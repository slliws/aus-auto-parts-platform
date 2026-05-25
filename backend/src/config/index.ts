import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

/**
 * Application configuration
 * Centralizes all environment variable access with type safety and validation
 */

interface Config {
  // Application
  env: string;
  port: number;
  apiPrefix: string;

  // Database
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    ssl: boolean;
    maxConnections: number;
    idleTimeoutMs: number;
    connectionTimeoutMs: number;
  };

  // Redis
  redis: {
    host: string;
    port: number;
    password: string;
    db: number;
    tls: boolean;
  };

  // JWT
  jwt: {
    secret: string;
    refreshSecret: string;
    accessExpiry: string;
    refreshExpiry: string;
    issuer: string;
    emailVerificationExpiry: string;
    passwordResetExpiry: string;
  };

  // Rate Limiting
  rateLimit: {
    windowMs: number;
    maxBasic: number;
    maxPro: number;
    maxEnterprise: number;
  };

  // CORS
  cors: {
    allowedOrigins: string[];
    credentials: boolean;
  };

  // Logging
  logging: {
    level: string;
    format: string;
    filePath: string;
    errorFilePath: string;
    maxSize: string;
    maxFiles: string;
  };

  // Security
  security: {
    bcryptRounds: number;
    sessionSecret: string;
  };

  // API
  api: {
    timeout: number;
  };
}

/**
 * Validates required environment variables
 * @throws {Error} If required variables are missing
 */
const validateConfig = (): void => {
  const required = ['NODE_ENV', 'PORT', 'DB_HOST', 'DB_NAME', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
};

/**
 * Parses comma-separated string into array
 */
const parseStringArray = (value: string | undefined, defaultValue: string[]): string[] => {
  if (!value) return defaultValue;
  return value.split(',').map((item) => item.trim());
};

/**
 * Configuration object
 */
const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'auto_parts_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
    idleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
    connectionTimeoutMs: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '2000', 10),
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
    tls: process.env.REDIS_TLS === 'true',
  },

  jwt: {
    secret: process.env.JWT_SECRET || '',
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || '',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '1h',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
    issuer: process.env.JWT_ISSUER || 'aus-auto-parts-platform',
    emailVerificationExpiry: process.env.JWT_EMAIL_VERIFICATION_EXPIRY || '24h',
    passwordResetExpiry: process.env.JWT_PASSWORD_RESET_EXPIRY || '1h',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10),
    maxBasic: parseInt(process.env.RATE_LIMIT_MAX_BASIC || '1000', 10),
    maxPro: parseInt(process.env.RATE_LIMIT_MAX_PRO || '10000', 10),
    maxEnterprise: parseInt(process.env.RATE_LIMIT_MAX_ENTERPRISE || '100000', 10),
  },

  cors: {
    allowedOrigins: parseStringArray(
      process.env.ALLOWED_ORIGINS,
      ['http://localhost:3001']
    ),
    credentials: process.env.CORS_CREDENTIALS !== 'false',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    filePath: process.env.LOG_FILE_PATH || 'logs/app.log',
    errorFilePath: process.env.LOG_ERROR_FILE_PATH || 'logs/error.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
  },

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    sessionSecret: process.env.SESSION_SECRET || '',
  },

  api: {
    timeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
  },
};

// Validate configuration in non-test environments
if (process.env.NODE_ENV !== 'test') {
  validateConfig();
}

export default config;