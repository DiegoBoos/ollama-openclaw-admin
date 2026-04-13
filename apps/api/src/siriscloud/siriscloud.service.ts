import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SiriscloudService {
  private authUrl: string;
  private portalUrl: string;
  private integrationsUrl: string;

  constructor(
    private http: HttpService,
    private configService: ConfigService,
  ) {
    this.authUrl = this.configService.get('SIRISCLOUD_AUTH_URL') || 'https://api-auth.siriscloud.com.co';
    this.portalUrl = this.configService.get('SIRISCLOUD_PORTAL_URL') || 'https://auth.siriscloud.com.co';
    this.integrationsUrl = this.configService.get('SIRISCLOUD_INTEGRATIONS_URL') || 'https://api-integrations.siriscloud.com.co';
  }

  // Auth Service
  async authHealth(): Promise<any> {
    try {
      const response = await this.http.axiosRef.get(`${this.authUrl}/health`);
      return { status: 'ok', url: this.authUrl, data: response.data };
    } catch (error) {
      return { status: 'unavailable', error: error.message, url: this.authUrl };
    }
  }

  async authLogin(credentials: any): Promise<any> {
    try {
      const response = await this.http.axiosRef.post(`${this.authUrl}/api/auth/login`, credentials);
      return response.data;
    } catch (error) {
      throw new HttpException(`Auth login failed: ${error.message}`, HttpStatus.BAD_GATEWAY);
    }
  }

  async authRegister(userData: any): Promise<any> {
    try {
      const response = await this.http.axiosRef.post(`${this.authUrl}/api/auth/register`, userData);
      return response.data;
    } catch (error) {
      throw new HttpException(`Auth register failed: ${error.message}`, HttpStatus.BAD_GATEWAY);
    }
  }

  async authValidate(token: string): Promise<any> {
    try {
      const response = await this.http.axiosRef.post(`${this.authUrl}/api/auth/validate`, { token });
      return response.data;
    } catch (error) {
      throw new HttpException(`Auth validate failed: ${error.message}`, HttpStatus.BAD_GATEWAY);
    }
  }

  // Portal Service
  async portalHealth(): Promise<any> {
    try {
      const response = await this.http.axiosRef.get(`${this.portalUrl}`);
      return { status: response.status === 200 ? 'ok' : 'error', url: this.portalUrl };
    } catch (error) {
      return { status: 'unavailable', error: error.message, url: this.portalUrl };
    }
  }

  async portalGetUser(userId: string, token?: string): Promise<any> {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await this.http.axiosRef.get(`${this.portalUrl}/api/users/${userId}`, { headers });
      return response.data;
    } catch (error) {
      throw new HttpException(`Portal get user failed: ${error.message}`, HttpStatus.BAD_GATEWAY);
    }
  }

  async portalListUsers(token?: string): Promise<any> {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await this.http.axiosRef.get(`${this.portalUrl}/api/users`, { headers });
      return response.data;
    } catch (error) {
      throw new HttpException(`Portal list users failed: ${error.message}`, HttpStatus.BAD_GATEWAY);
    }
  }

  // Integrations Service
  async integrationsHealth(): Promise<any> {
    try {
      const response = await this.http.axiosRef.get(`${this.integrationsUrl}/health`);
      return { status: 'ok', url: this.integrationsUrl, data: response.data };
    } catch (error) {
      return { status: 'unavailable', error: error.message, url: this.integrationsUrl };
    }
  }

  async integrationsList(token?: string): Promise<any> {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await this.http.axiosRef.get(`${this.integrationsUrl}/api/integrations`, { headers });
      return response.data;
    } catch (error) {
      throw new HttpException(`Integrations list failed: ${error.message}`, HttpStatus.BAD_GATEWAY);
    }
  }

  async integrationsCreate(data: any, token?: string): Promise<any> {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await this.http.axiosRef.post(`${this.integrationsUrl}/api/integrations`, data, { headers });
      return response.data;
    } catch (error) {
      throw new HttpException(`Integrations create failed: ${error.message}`, HttpStatus.BAD_GATEWAY);
    }
  }

  // Health check completo
  async healthCheck(): Promise<any> {
    const [auth, portal, integrations] = await Promise.all([
      this.authHealth().catch(() => ({ status: 'unavailable' })),
      this.portalHealth().catch(() => ({ status: 'unavailable' })),
      this.integrationsHealth().catch(() => ({ status: 'unavailable' })),
    ]);

    return {
      services: {
        auth: auth.status,
        portal: portal.status,
        integrations: integrations.status,
      },
      overall: auth.status === 'ok' && portal.status === 'ok' ? 'healthy' : 'degraded',
      urls: {
        auth: this.authUrl,
        portal: this.portalUrl,
        integrations: this.integrationsUrl,
      },
    };
  }
}