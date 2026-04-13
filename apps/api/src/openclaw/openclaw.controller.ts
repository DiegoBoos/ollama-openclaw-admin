import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OpenclawService } from './openclaw.service';
import { SiriscloudAuthGuard } from '../auth/siriscloud-auth.guard';
import { LaunchDto, LogsQueryDto } from '../dto';

@Controller('openclaw')
export class OpenclawController {
  constructor(private readonly openclawService: OpenclawService) {}

  @Get('status')
  async status() {
    return this.openclawService.status();
  }

  @Get('agents')
  async listAgents() {
    return this.openclawService.listAgents();
  }

  @Get('logs')
  async logs(@Query() query: LogsQueryDto) {
    return this.openclawService.logs(query.tail || 50);
  }

  /**
   * Protected endpoints - require Siriscloud JWT
   * Stricter rate limiting for sensitive operations
   */
  @Post('launch')
  @HttpCode(200)
  @UseGuards(SiriscloudAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 launches per minute
  async launch(@Body() body: LaunchDto) {
    const { model } = body;
    return this.openclawService.launch(model);
  }

  @Post('stop')
  @UseGuards(SiriscloudAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async stop() {
    return this.openclawService.stop();
  }

  @Post('restart')
  @UseGuards(SiriscloudAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async restart() {
    return this.openclawService.restart();
  }
}