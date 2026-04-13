import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { validateConfig, getConfig } from './config/configuration';

async function bootstrap() {
  // Validate configuration at startup (fail-fast)
  validateConfig();
  const config = getConfig();

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Global prefix for API routes
  app.setGlobalPrefix('api');

  // CORS configuration - explicit whitelist
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests without origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (config.corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS policy`), false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Request-Timeout'],
    credentials: true,
    maxAge: 3600, // Cache preflight for 1 hour
  });

  // Global validation pipe for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip non-whitelisted properties
      forbidNonWhitelisted: true, // Throw error on non-whitelisted
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global timeout interceptor
  app.useGlobalInterceptors(new TimeoutInterceptor(config.httpTimeout));

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Logger middleware for request tracking
  app.use(new LoggerMiddleware().use.bind(new LoggerMiddleware()));

  const port = config.port;
  await app.listen(port);

  console.log(`[Bootstrap] API running on port ${port}`);
  console.log(`[Bootstrap] Environment: ${config.nodeEnv}`);
  console.log(`[Bootstrap] CORS Origins: ${config.corsOrigins.join(', ')}`);
}
bootstrap();