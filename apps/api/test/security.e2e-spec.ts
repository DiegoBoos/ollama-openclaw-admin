import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import request from 'supertest';
import { App } from 'supertest/types';

jest.mock('child_process', () => ({
  exec: jest.fn((command: string, callback: (error: Error | null, stdout?: string, stderr?: string) => void) => {
    if (command.includes('openclaw status --json')) {
      callback(null, JSON.stringify({ ok: true, status: 'running' }), '');
      return;
    }

    callback(null, '', '');
  }),
}));

import { AppModule } from './../src/app.module';
import { OpenclawService } from './../src/openclaw/openclaw.service';

describe('Openclaw security (e2e)', () => {
  let app: INestApplication<App>;
  let openclawService: OpenclawService;
  const validateTokenMock = jest.fn();

  beforeEach(async () => {
    process.env.SIRISCLOUD_AUTH_URL = 'https://auth.test';

    validateTokenMock.mockImplementation(async (url: string, body: { token: string }) => {
      if (body.token === 'valid-token') {
        return {
          data: {
            valid: true,
            user: { id: 'user-123', email: 'test@example.com' },
          },
        };
      }

      const error = new Error('Unauthorized') as Error & { response?: { status: number } };
      error.response = { status: 401 };
      throw error;
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HttpService)
      .useValue({
        axiosRef: {
          post: validateTokenMock,
        },
      })
      .compile();

    openclawService = moduleFixture.get(OpenclawService);
    jest
      .spyOn(openclawService, 'status')
      .mockResolvedValue({ ok: true, status: 'running' });

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    validateTokenMock.mockReset();
    delete process.env.SIRISCLOUD_AUTH_URL;
    await app.close();
  });

  it('POST /openclaw/launch without Authorization returns 401', () => {
    return request(app.getHttpServer())
      .post('/openclaw/launch')
      .send({ model: 'llama3.2' })
      .expect(401);
  });

  it('POST /openclaw/launch with invalid token returns 401', () => {
    return request(app.getHttpServer())
      .post('/openclaw/launch')
      .set('Authorization', 'Bearer invalid-token')
      .send({ model: 'llama3.2' })
      .expect(401);
  });

  it('POST /openclaw/stop without auth returns 401', () => {
    return request(app.getHttpServer()).post('/openclaw/stop').expect(401);
  });

  it('POST /openclaw/restart without auth returns 401', () => {
    return request(app.getHttpServer()).post('/openclaw/restart').expect(401);
  });

  it('GET /openclaw/status without auth returns 200', async () => {
    const response = await request(app.getHttpServer())
      .get('/openclaw/status')
      .expect(200);

    expect(response.body).toEqual({ ok: true, status: 'running' });
  });

  it('POST /openclaw/launch with shell injection payload returns 400', () => {
    return request(app.getHttpServer())
      .post('/openclaw/launch')
      .set('Authorization', 'Bearer valid-token')
      .send({ model: '; rm -rf /' })
      .expect(400);
  });

  it('POST /openclaw/launch with valid token and safe model returns 200', async () => {
    const response = await request(app.getHttpServer())
      .post('/openclaw/launch')
      .set('Authorization', 'Bearer valid-token')
      .send({ model: 'llama3.2' })
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      message: 'OpenClaw launched',
    });
    expect(validateTokenMock).toHaveBeenCalledWith(
      'https://auth.test/api/auth/validate',
      { token: 'valid-token' },
      { timeout: 5000 },
    );
  });
});
