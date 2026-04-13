import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ConfigService } from '@nestjs/config';

const execAsync = promisify(exec);

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details?: Record<string, unknown>;
  latency?: number;
  error?: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    ollama: ServiceHealth;
    openclaw: ServiceHealth;
    siriscloud: ServiceHealth;
  };
}

@Injectable()
export class HealthService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async checkAll(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    // Run all health checks in parallel
    const [ollama, openclaw, siriscloud] = await Promise.all([
      this.checkOllama(),
      this.checkOpenClaw(),
      this.checkSiriscloud(),
    ]);

    // Determine overall status
    const statuses = [ollama.status, openclaw.status, siriscloud.status];
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';

    if (statuses.every((s) => s === 'healthy')) {
      overallStatus = 'healthy';
    } else if (statuses.some((s) => s === 'unhealthy')) {
      overallStatus = 'unhealthy';
    } else {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.0.1',
      services: {
        ollama,
        openclaw,
        siriscloud,
      },
    };
  }

  private async checkOllama(): Promise<ServiceHealth> {
    const start = Date.now();
    const baseUrl = this.configService.get('OLLAMA_BASE_URL') || 'http://localhost:11434';

    try {
      const response = await this.httpService.axiosRef.get(`${baseUrl}/api/tags`, {
        timeout: 5000,
      });

      return {
        status: 'healthy',
        latency: Date.now() - start,
        details: {
          models: response.data?.models?.length || 0,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        error: error.message,
      };
    }
  }

  private async checkOpenClaw(): Promise<ServiceHealth> {
    const start = Date.now();

    try {
      const { stdout } = await execAsync('openclaw status --json 2>/dev/null || echo "{}"');
      const status = JSON.parse(stdout);

      return {
        status: status.ok ? 'healthy' : 'unhealthy',
        latency: Date.now() - start,
        details: status,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        error: error.message,
      };
    }
  }

  private async checkSiriscloud(): Promise<ServiceHealth> {
    const start = Date.now();
    const authUrl = this.configService.get('SIRISCLOUD_AUTH_URL');

    if (!authUrl) {
      return {
        status: 'degraded',
        error: 'SIRISCLOUD_AUTH_URL not configured',
      };
    }

    try {
      const response = await this.httpService.axiosRef.get(`${authUrl}/health`, {
        timeout: 5000,
      });

      return {
        status: response.status === 200 ? 'healthy' : 'degraded',
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        error: error.message,
      };
    }
  }
}