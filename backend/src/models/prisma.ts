import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

// Extend PrismaClient with custom methods if needed
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'info',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Singleton pattern to avoid multiple Prisma instances in development
const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug('Query: ' + e.query);
    logger.debug('Params: ' + e.params);
    logger.debug('Duration: ' + e.duration + 'ms');
  });
}

// Log errors
prisma.$on('error', (e) => {
  logger.error('Prisma Error:', e);
});

// Log warnings
prisma.$on('warn', (e) => {
  logger.warn('Prisma Warning:', e);
});

// Log info
prisma.$on('info', (e) => {
  logger.info('Prisma Info:', e);
});

/**
 * Middleware for multi-tenant row-level filtering
 * This ensures that all queries are automatically filtered by tenant_id
 * when a tenant context is available
 */
export interface TenantContext {
  tenantId?: string;
}

let currentTenantContext: TenantContext = {};

export const setTenantContext = (context: TenantContext) => {
  currentTenantContext = context;
};

export const getTenantContext = (): TenantContext => {
  return currentTenantContext;
};

export const clearTenantContext = () => {
  currentTenantContext = {};
};

/**
 * Prisma Client Extension for automatic tenant filtering
 * Applies tenant_id filter to all queries when tenant context is available
 */
const prismaWithExtensions = prisma.$extends({
  name: 'tenantFilter',
  query: {
    $allModels: {
      async $allOperations({ operation, model, args, query }) {
        const ctx = getTenantContext();
        
        // Skip tenant filtering for Tenant and AuditLog models (they manage their own tenant_id)
        if (model === 'Tenant' || model === 'AuditLog') {
          return query(args);
        }
        
        // Skip for models that don't have tenant_id field
        const modelsWithoutTenant = ['RefreshToken'];
        if (modelsWithoutTenant.includes(model || '')) {
          return query(args);
        }
        
        // Apply tenant filter if context is available
        if (ctx.tenantId && operation !== 'count' && operation !== 'aggregate') {
          // Cast args to mutable record for tenant injection
          // (Prisma's $allOperations args is a union type; runtime access is safe)
          const mutableArgs = args as unknown as { where?: Record<string, unknown> };
          // Ensure where clause exists
          mutableArgs.where = mutableArgs.where || {};
          
          // Add tenant_id filter if not already present
          if (!mutableArgs.where['tenant_id']) {
            mutableArgs.where['tenant_id'] = ctx.tenantId;
          }
        }
        
        return query(args);
      },
    },
  },
});

/**
 * Graceful shutdown handler
 */
export const disconnectPrisma = async () => {
  try {
    await prisma.$disconnect();
    logger.info('✅ Prisma disconnected successfully');
  } catch (error) {
    logger.error('❌ Error disconnecting Prisma:', error);
    throw error;
  }
};

/**
 * Database connection test
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    logger.debug('Testing database connection with URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@') : 'undefined');
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Database connection successful');
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    logger.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      meta: (error as any)?.meta,
    });
    return false;
  }
};

// Export the extended Prisma client with tenant filtering
export default prismaWithExtensions;