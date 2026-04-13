import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { SiriscloudController } from './siriscloud.controller';
import { SiriscloudService } from './siriscloud.service';

@Module({
  imports: [ConfigModule.forRoot(), HttpModule],
  controllers: [SiriscloudController],
  providers: [SiriscloudService],
  exports: [SiriscloudService],
})
export class SiriscloudModule {}