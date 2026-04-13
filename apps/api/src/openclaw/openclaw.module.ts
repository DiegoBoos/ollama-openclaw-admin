import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { OpenclawController } from './openclaw.controller';
import { OpenclawService } from './openclaw.service';
import { SiriscloudAuthGuard } from '../auth/siriscloud-auth.guard';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [OpenclawController],
  providers: [OpenclawService, SiriscloudAuthGuard],
  exports: [OpenclawService],
})
export class OpenclawModule {}