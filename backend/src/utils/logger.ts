import winston from 'winston';
import path from 'path';

/**
 * Logger configuration using Winston
 * Supports multiple transports (console, file) with configurable levels
 */

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

/**
 * Creates a Winston logger instance with configured transports
 * @returns {winston.Logger} Configured logger instance
 */
export const createLogger = (): winston.Logger => {
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'aus-auto-parts-api' },
    transports: [
      // Console transport
      new winston.transports.Console({
        format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
      }),
    ],
  });

  // Add file transports in production or if specified
  if (process.env.NODE_ENV === 'production' || process.env.LOG_FILE_PATH) {
    logger.add(
      new winston.transports.File({
        filename: process.env.LOG_ERROR_FILE_PATH || 'logs/error.log',
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
      })
    );

    logger.add(
      new winston.transports.File({
        filename: process.env.LOG_FILE_PATH || 'logs/app.log',
        maxsize: 10485760, // 10MB
        maxFiles: 14,
      })
    );
  }

  return logger;
};

// Export singleton logger instance
export const logger = createLogger();

/**
 * Stream object for Morgan HTTP logger integration
 */
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;