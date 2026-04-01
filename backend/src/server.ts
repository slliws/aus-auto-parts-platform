import { createApp } from './app';
import config from './config';
import { logger } from './utils/logger';
import { testConnection, closePool } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import {
  handleUnhandledRejection,
  handleUncaughtException,
} from './middleware/errorHandler';

/**
 * Server entry point
 * Initializes database connections, starts the Express server
 */

/**
 * Starts the HTTP server
 */
const startServer = async (): Promise<void> => {
  try {
    // Create Express app
    const app = createApp();

    // Test database connection
    logger.info('Testing database connection...');
    try {
      await testConnection();
      logger.info('Database connection successful');
    } catch (error) {
      logger.warn('Database connection failed - continuing without database', {
        error,
      });
      // Don't exit - allow server to start for development/testing
      // In production, you might want to exit here
    }

    // Connect to Redis
    logger.info('Connecting to Redis...');
    try {
      await connectRedis();
      logger.info('Redis connection successful');
    } catch (error) {
      logger.warn('Redis connection failed - continuing without Redis', {
        error,
      });
      // Don't exit - allow server to start for development/testing
    }

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info('Server started successfully', {
        port: config.port,
        environment: config.env,
        apiPrefix: config.apiPrefix,
        nodeVersion: process.version,
      });

      logger.info(`API available at: http://localhost:${config.port}${config.apiPrefix}`);
      logger.info(`Health check: http://localhost:${config.port}${config.apiPrefix}/health`);
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received, shutting down gracefully...`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close database connections
          await closePool();
          logger.info('Database connections closed');

          // Close Redis connection
          await disconnectRedis();
          logger.info('Redis connection closed');

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown', { error });
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: Error) => {
      handleUnhandledRejection(reason);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      handleUncaughtException(error);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Start the server
startServer();