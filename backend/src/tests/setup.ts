import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables FIRST, before any imports
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// Set test timeout to prevent hook timeouts
jest.setTimeout(30000);

import { PrismaClient } from '@prisma/client';
import { createApp } from '../app';
import prisma from '../models/prisma';

// Global setup for tests
beforeAll(async () => {
  // Ensure we're using test database
  if (!process.env.DATABASE_URL?.includes('test')) {
    throw new Error('Tests must run against a test database! Check .env.test file');
  }
  
  // Clean database before tests
  await clearDatabase();
});

// Cleanup after all tests
afterAll(async () => {
  await clearDatabase();
  await prisma.$disconnect();
});

// Clear all data from test database with retry logic for deadlocks
export async function clearDatabase(): Promise<void> {
  const maxRetries = 3;
  const retryDelay = 100; // ms

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Use a single transaction with extended timeout to handle large datasets
      await prisma.$transaction(async (tx) => {
        // Clear all tables using PostgreSQL TRUNCATE CASCADE
        // Order tables by dependency to handle foreign key constraints
        // Use exact case-sensitive table names from the schema
        const tableNames = [
          'refresh_tokens',  // lowercase as defined in migration
          'WarrantyClaim',   // mixed case as in schema
          'Supplier',        // mixed case as in schema
          'AuditLog',        // mixed case as in schema
          'Communication',   // mixed case as in schema
          'Shipment',        // mixed case as in schema
          'OrderItem',       // mixed case as in schema
          'Order',           // mixed case as in schema
          'QuoteItem',       // mixed case as in schema
          'Quote',           // mixed case as in schema
          'Payment',         // mixed case as in schema
          'Part',            // mixed case as in schema
          'Vehicle',         // mixed case as in schema
          'Customer',        // mixed case as in schema
          'User',            // mixed case as in schema
          'Tenant'           // mixed case as in schema
        ];

        for (const tableName of tableNames) {
          try {
            await tx.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
          } catch (error) {
            // Table might not exist or have no data - that's OK for tests
            console.log(`Table ${tableName} cleared or doesn't exist`);
          }
        }
      }, {
        timeout: 30000, // 30 seconds timeout to match Jest test timeout
        maxWait: 10000  // 10 seconds max wait for transaction acquisition
      });
      
      // Success - break out of retry loop
      break;
    } catch (error) {
      if (attempt === maxRetries - 1) {
        // Last attempt failed, throw the error
        console.error(`Failed to clear database after ${maxRetries} attempts:`, error);
        throw error;
      }
      
      // Check if error is transaction timeout related
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('timeout') || errorMessage.includes('Transaction already closed')) {
        console.log(`Transaction timeout detected, extending wait time...`);
        // Increase retry delay for timeout issues
        const timeoutDelay = retryDelay * Math.pow(2, attempt) + 1000;
        console.log(`Database clearing attempt ${attempt + 1} failed, retrying in ${timeoutDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, timeoutDelay));
      } else {
        // Retry with exponential backoff for other errors
        const delay = retryDelay * Math.pow(2, attempt);
        console.log(`Database clearing attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

// Helper function to execute operations with retry logic for database connection issues
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 100
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      
      // Check for retryable errors
      const errorMessage = lastError.message.toLowerCase();
      if (
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('deadlock') ||
        errorMessage.includes('locked')
      ) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Operation attempt ${attempt + 1} failed with retryable error, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Non-retryable error, throw immediately
        throw lastError;
      }
    }
  }
  
  throw lastError!;
}

// Helper function to create transaction with extended timeout
export async function executeInTransaction<T>(
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return await executeWithRetry(async () => {
    return await prisma.$transaction(callback, {
      timeout: 30000, // 30 seconds timeout
      maxWait: 10000  // 10 seconds max wait for transaction acquisition
    });
  });
}

// Create test app instance
export const app = createApp();

// Test utility to create test tenant
export const createTestTenant = async (overrides: Record<string, unknown> = {}) => {
  const defaultTenant = {
    name: `Test Tenant ${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    email: `tenant-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@example.com`,
    phone: '0400000000',
    is_active: true,
  };

  return await prisma.tenant.create({
    data: {
      ...defaultTenant,
      ...overrides,
    },
  });
};

// Test utility to create test users
export const createTestUser = async (overrides: Record<string, unknown> = {}) => {
  let tenantId = overrides.tenant_id as string | undefined;

  // Create tenant if not provided
  if (!tenantId) {
    const tenant = await createTestTenant();
    tenantId = tenant.id;
  }

  const defaultUser = {
    email: `test-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@example.com`,
    password_hash: '$2b$10$lJYs3HGq73mDPSKzvL4HXOb2VUY6HQnGdKMeP1j5w33CGvq1AP9qG', // 'password123'
    first_name: 'Test',
    last_name: 'User',
    role: 'ADMIN' as const,
    is_active: true,
    email_verified: true,
  };

  const { tenant_id: _tid, ...restOverrides } = overrides;

  return await prisma.user.create({
    data: {
      ...defaultUser,
      ...restOverrides,
      tenant: {
        connect: { id: tenantId },
      },
    },
    include: {
      tenant: true,
    },
  });
};

// Test utility to create test parts
export const createTestPart = async (tenantId: string, overrides: Record<string, unknown> = {}) => {
  const defaultPart = {
    part_number: `PART-${Date.now()}`,
    name: 'Test Part',
    description: 'A test part for integration testing',
    category: 'TEST',
    sell_price: 99.99,
    cost_price: 49.99,
    stock_quantity: 100,
    is_available: true,
  };

  return await prisma.part.create({
    data: {
      ...defaultPart,
      ...overrides,
      tenant: {
        connect: { id: tenantId },
      },
    },
  });
};

// Test utility to create test customers
export const createTestCustomer = async (tenantId: string, overrides: Record<string, unknown> = {}) => {
  const defaultCustomer = {
    first_name: 'Test',
    last_name: 'Customer',
    email: `customer-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@example.com`,
    phone: '0400123456',
    address: '123 Test St',
    suburb: 'Sydney',
    state: 'NSW',
    postcode: '2000',
    is_active: true,
  };

  return await prisma.customer.create({
    data: {
      ...defaultCustomer,
      ...overrides,
      tenant: {
        connect: { id: tenantId },
      },
    },
  });
};

// Test utility to create test vehicle
export const createTestVehicle = async (tenantId: string, overrides: Record<string, unknown> = {}) => {
  const defaultVehicle = {
    vin: `TEST${Date.now()}VIN12345`,
    make: 'Toyota',
    model: 'Corolla',
    year: 2020,
    date_received: new Date(),
  };

  return await prisma.vehicle.create({
    data: {
      ...defaultVehicle,
      ...overrides,
      tenant: {
        connect: { id: tenantId },
      },
    },
  });
};