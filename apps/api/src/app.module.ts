import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { OllamaModule } from './ollama/ollama.module';
import { OpenclawModule } from './openclaw/openclaw.module';
import { SiriscloudModule } from './siriscloud/siriscloud.module';
import { HealthModule } from './health/health.module';
import { getConfig } from './config/configuration';

@Module({
  imports: [
    // Configuration - global with validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => getConfig()],
    }),

    // Rate limiting - global protection
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3, // 3 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 20, // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // HTTP client with timeout
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 30000,
        maxRedirects: 5,
      }),
    }),

    AuthModule,
    OllamaModule,
    OpenclawModule,
    SiriscloudModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}