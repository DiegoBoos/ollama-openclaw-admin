import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { SiriscloudAuthGuard } from './siriscloud-auth.guard';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [SiriscloudAuthGuard],
  exports: [SiriscloudAuthGuard],
})
export class AuthModule {}
