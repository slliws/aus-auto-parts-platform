import prisma, { testDatabaseConnection, disconnectPrisma } from '../models/prisma';
import { logger } from '../utils/logger';
import { DatabaseError } from '../utils/errors';

/**
 * PostgreSQL database connection configuration using Prisma ORM
 * Prisma handles connection pooling automatically
 */

/**
 * Tests database connection using Prisma
 * @throws {DatabaseError} If connection fails
 */
export const testConnection = async (): Promise<void> => {
  try {
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      throw new Error('Database connection test failed');
    }
  } catch (error) {
    logger.error('Database connection failed', { error });
    throw new DatabaseError(
      'Failed to connect to database',
      error instanceof Error ? error : undefined
    );
  }
};

/**
 * Closes the Prisma database connection
 * Should be called on application shutdown
 */
export const closePool = async (): Promise<void> => {
  await disconnectPrisma();
};

/**
 * Begins a database transaction using Prisma
 * Returns a transaction client that can be used for queries
 */
export const beginTransaction = async () => {
  // Prisma transactions are handled using prisma.$transaction()
  // This will be implemented in service layer
  logger.debug('Use prisma.$transaction() for transactions');
  return prisma;
};

/**
 * Commits a database transaction
 * Note: Prisma handles commits automatically when transaction block completes
 */
export const commitTransaction = async (): Promise<void> => {
  logger.debug('Prisma handles commits automatically');
};

/**
 * Rolls back a database transaction
 * Note: Prisma handles rollbacks automatically on errors
 */
export const rollbackTransaction = async (): Promise<void> => {
  logger.debug('Prisma handles rollbacks automatically on errors');
};

// Export Prisma client for direct use
export { prisma };

export default {
  testConnection,
  closePool,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  prisma,
};