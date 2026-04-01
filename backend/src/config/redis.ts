import { createClient, RedisClientType } from 'redis';
import config from './index';
import { logger } from '../utils/logger';
import { ServiceUnavailableError } from '../utils/errors';

/**
 * Redis cache configuration and client management
 * Provides caching capabilities for session management, rate limiting, and data caching
 * TODO: Implement actual Redis connection and caching strategies
 */

let redisClient: RedisClientType | null = null;

/**
 * Creates and returns a Redis client
 * @returns {RedisClientType} Redis client instance
 */
export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
        tls: config.redis.tls,
      },
      password: config.redis.password || undefined,
      database: config.redis.db,
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connecting');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error', { error: err });
    });

    redisClient.on('end', () => {
      logger.info('Redis client disconnected');
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis client reconnecting');
    });
  }

  return redisClient;
};

/**
 * Connects to Redis server
 * @throws {ServiceUnavailableError} If connection fails
 */
export const connectRedis = async (): Promise<void> => {
  try {
    const client = getRedisClient();
    if (!client.isOpen) {
      await client.connect();
      logger.info('Redis connection established');
    }
  } catch (error) {
    logger.error('Redis connection failed', { error });
    throw new ServiceUnavailableError('Failed to connect to Redis');
  }
};

/**
 * Disconnects from Redis server
 */
export const disconnectRedis = async (): Promise<void> => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
};

/**
 * Tests Redis connection
 * @returns {Promise<boolean>} True if connection is successful
 */
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    const client = getRedisClient();
    if (!client.isOpen) {
      await client.connect();
    }
    const pong = await client.ping();
    logger.info('Redis connection test successful', { response: pong });
    return true;
  } catch (error) {
    logger.error('Redis connection test failed', { error });
    return false;
  }
};

/**
 * Cache helper functions
 * TODO: Implement comprehensive caching strategies
 */

/**
 * Sets a value in Redis cache
 * @param key - Cache key
 * @param value - Value to cache
 * @param expirySeconds - Optional expiry time in seconds
 */
export const setCache = async (
  key: string,
  value: string,
  expirySeconds?: number
): Promise<void> => {
  try {
    const client = getRedisClient();
    if (expirySeconds) {
      await client.setEx(key, expirySeconds, value);
    } else {
      await client.set(key, value);
    }
    logger.debug('Cache set', { key, expirySeconds });
  } catch (error) {
    logger.error('Failed to set cache', { key, error });
    // Don't throw - caching failures should not break the application
  }
};

/**
 * Gets a value from Redis cache
 * @param key - Cache key
 * @returns Cached value or null if not found
 */
export const getCache = async (key: string): Promise<string | null> => {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    logger.debug('Cache get', { key, found: !!value });
    return value;
  } catch (error) {
    logger.error('Failed to get cache', { key, error });
    return null;
  }
};

/**
 * Deletes a value from Redis cache
 * @param key - Cache key
 */
export const deleteCache = async (key: string): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.del(key);
    logger.debug('Cache deleted', { key });
  } catch (error) {
    logger.error('Failed to delete cache', { key, error });
  }
};

/**
 * Deletes multiple keys matching a pattern
 * @param pattern - Key pattern (e.g., 'user:*')
 */
export const deleteCachePattern = async (pattern: string): Promise<void> => {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
      logger.debug('Cache pattern deleted', { pattern, count: keys.length });
    }
  } catch (error) {
    logger.error('Failed to delete cache pattern', { pattern, error });
  }
};

/**
 * Checks if a key exists in cache
 * @param key - Cache key
 * @returns True if key exists
 */
export const existsCache = async (key: string): Promise<boolean> => {
  try {
    const client = getRedisClient();
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error('Failed to check cache existence', { key, error });
    return false;
  }
};

export default {
  getRedisClient,
  connectRedis,
  disconnectRedis,
  testRedisConnection,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  existsCache,
};