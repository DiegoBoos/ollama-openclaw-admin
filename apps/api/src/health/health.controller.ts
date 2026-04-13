import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

/**
 * Consolidated health check endpoint.
 * Returns status of all dependent services.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check() {
    return this.healthService.checkAll();
  }

  @Get('ready')
  async ready() {
    // Kubernetes readiness probe
    // Returns 200 only if all critical services are healthy
    const result = await this.healthService.checkAll();

    if (result.status === 'unhealthy') {
      // Return 503 Service Unavailable
      return {
        status: 'not_ready',
        message: 'One or more services are unhealthy',
        services: result.services,
      };
    }

    return {
      status: 'ready',
      timestamp: result.timestamp,
    };
  }

  @Get('live')
  async live() {
    // Kubernetes liveness probe
    // Returns 200 if the app process is running
    return {
      status: 'alive',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}