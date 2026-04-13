import { Controller, Get, Post, Param, Body, Headers, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SiriscloudService } from './siriscloud.service';
import { LoginDto, RegisterDto, ValidateTokenDto, CreateIntegrationDto } from '../dto';

@Controller('siriscloud')
export class SiriscloudController {
  constructor(private readonly siriscloudService: SiriscloudService) {}

  @Get('health')
  async health() {
    return this.siriscloudService.healthCheck();
  }

  // Auth endpoints - stricter rate limiting
  @Get('auth/health')
  async authHealth() {
    return this.siriscloudService.authHealth();
  }

  @Post('auth/login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 login attempts per minute
  async login(@Body() body: LoginDto) {
    return this.siriscloudService.authLogin(body);
  }

  @Post('auth/register')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 registrations per minute
  async register(@Body() body: RegisterDto) {
    return this.siriscloudService.authRegister(body);
  }

  @Post('auth/validate')
  async validate(@Body() body: ValidateTokenDto) {
    return this.siriscloudService.authValidate(body.token);
  }

  // Portal endpoints
  @Get('portal/health')
  async portalHealth() {
    return this.siriscloudService.portalHealth();
  }

  @Get('portal/users')
  async listUsers(@Headers('authorization') auth: string) {
    return this.siriscloudService.portalListUsers(auth?.replace('Bearer ', ''));
  }

  @Get('portal/users/:id')
  async getUser(@Param('id') id: string, @Headers('authorization') auth: string) {
    return this.siriscloudService.portalGetUser(id, auth?.replace('Bearer ', ''));
  }

  // Integrations endpoints
  @Get('integrations/health')
  async integrationsHealth() {
    return this.siriscloudService.integrationsHealth();
  }

  @Get('integrations')
  async listIntegrations(@Headers('authorization') auth: string) {
    return this.siriscloudService.integrationsList(auth?.replace('Bearer ', ''));
  }

  @Post('integrations')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async createIntegration(@Body() body: CreateIntegrationDto, @Headers('authorization') auth: string) {
    return this.siriscloudService.integrationsCreate(body, auth?.replace('Bearer ', ''));
  }
}