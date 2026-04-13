import * as process from 'process';

/**
 * Configuration validation schema.
 * Validates required environment variables at startup.
 * Fail-fast approach for production environments.
 */

export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  ollamaBaseUrl: string;
  siriscloudAuthUrl: string;
  siriscloudPortalUrl: string;
  siriscloudIntegrationsUrl: string;
  corsOrigins: string[];
  httpTimeout: number;
  rateLimitTtl: number;
  rateLimitCount: number;
}

function getEnvVar(name: string, required: boolean = true, defaultValue?: string): string {
  const value = process.env[name];
  if (!value) {
    if (required && process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return defaultValue ?? '';
  }
  return value;
}

function getEnvNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.warn(`Invalid number for ${name}, using default: ${defaultValue}`);
    return defaultValue;
  }
  return parsed;
}

function getCorsOrigins(): string[] {
  const origins = process.env.CORS_ORIGINS;
  if (!origins) {
    // Default: allow same-origin and localhost in development
    if (process.env.NODE_ENV !== 'production') {
      return ['http://localhost:3000', 'http://localhost:4200', 'http://127.0.0.1:3000'];
    }
    // In production, no origins = fail safe
    throw new Error('CORS_ORIGINS must be defined in production (comma-separated list of allowed origins)');
  }
  return origins.split(',').map((o) => o.trim());
}

export function getConfig(): AppConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as AppConfig['nodeEnv'];
  const isProduction = nodeEnv === 'production';
  const isTest = nodeEnv === 'test';

  return {
    nodeEnv,
    port: getEnvNumber('PORT', 3000),
    ollamaBaseUrl: getEnvVar('OLLAMA_BASE_URL', false, 'http://localhost:11434'),
    siriscloudAuthUrl: getEnvVar('SIRISCLOUD_AUTH_URL', isProduction, 'https://api-auth.siriscloud.com.co'),
    siriscloudPortalUrl: getEnvVar('SIRISCLOUD_PORTAL_URL', false, 'https://auth.siriscloud.com.co'),
    siriscloudIntegrationsUrl: getEnvVar('SIRISCLOUD_INTEGRATIONS_URL', false, 'https://api-integrations.siriscloud.com.co'),
    corsOrigins: getCorsOrigins(),
    httpTimeout: getEnvNumber('HTTP_TIMEOUT', 30000),
    rateLimitTtl: getEnvNumber('RATE_LIMIT_TTL', 60),
    rateLimitCount: getEnvNumber('RATE_LIMIT_COUNT', 100),
  };
}

/**
 * Validate configuration at startup.
 * Throws if required variables are missing in production.
 */
export function validateConfig(): void {
  try {
    const config = getConfig();
    console.log('[Config] Configuration validated successfully');
    console.log(`[Config] Environment: ${config.nodeEnv}`);
    console.log(`[Config] Port: ${config.port}`);
    console.log(`[Config] CORS Origins: ${config.corsOrigins.join(', ')}`);
  } catch (error) {
    console.error('[Config] Configuration validation failed:', error.message);
    throw error;
  }
}