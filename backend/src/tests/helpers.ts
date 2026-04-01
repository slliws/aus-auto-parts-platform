import request from 'supertest';
import { app } from './setup';
import { User, Tenant } from '@prisma/client';
import prisma from '../models/prisma';
import { generateAccessToken } from '../utils/jwt';

/**
 * Test helper functions for integration tests
 */

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'password_hash'>;
}

/**
 * Login a user and get auth tokens
 */
export const loginUser = async (
  email: string,
  password: string,
  tenantId?: string
): Promise<LoginResponse> => {
  const loginData: Record<string, string> = {
    email,
    password,
  };

  if (tenantId) {
    loginData.tenantId = tenantId;
  }

  const response = await request(app)
    .post('/api/v1/auth/login')
    .send(loginData);

  if (response.status !== 200) {
    throw new Error(`Login failed: ${JSON.stringify(response.body)}`);
  }

  return response.body.data;
};

/**
 * Register a new user for testing
 */
export const registerUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  tenantId: string
) => {
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({
      email,
      password,
      firstName,
      lastName,
      tenantId,
    });

  if (response.status !== 201) {
    throw new Error(`Registration failed: ${JSON.stringify(response.body)}`);
  }

  // Verify the email directly through the database for testing
  await prisma.user.update({
    where: { email },
    data: { email_verified: true },
  });

  return response.body.data;
};

/**
 * Get an authorized request with auth headers set
 */
export const authorizedRequest = (
  accessToken: string
): ReturnType<typeof request> => {
  return request(app).set('Authorization', `Bearer ${accessToken}`);
};

/**
 * Get admin user with generated token
 */
export const getAdminUserWithToken = async (tenantId?: string): Promise<{
  user: User;
  accessToken: string;
  tenant: Tenant;
}> => {
  // Create tenant if needed
  let tenant: Tenant;
  if (!tenantId) {
    tenant = await prisma.tenant.create({
      data: {
        name: `Admin Test Tenant ${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        email: `tenant-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@example.com`,
        phone: '0400000000',
        is_active: true,
      },
    });
    tenantId = tenant.id;
  } else {
    tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    }) as Tenant;
  }

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: `admin-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@example.com`,
      password_hash: '$2b$10$lJYs3HGq73mDPSKzvL4HXOb2VUY6HQnGdKMeP1j5w33CGvq1AP9qG', // password123
      first_name: 'Admin',
      last_name: 'User',
      role: 'ADMIN',
      is_active: true,
      email_verified: true,
      tenant: {
        connect: { id: tenantId },
      },
    },
  });

  // Generate token
  const accessToken = generateAccessToken(adminUser, tenant);

  return {
    user: adminUser,
    accessToken,
    tenant,
  };
};

/**
 * Create test data utilities
 */
export const testData = {
  /**
   * Create test part
   */
  createPart: async (tenantId: string, accessToken: string, overrides = {}) => {
    const defaultPart = {
      partNumber: `TEST-${Date.now()}`,
      name: 'Test Part',
      description: 'A test part',
      category: 'TEST',
      sell_price: 99.99,
      cost_price: 49.99,
      stock_quantity: 100,
    };

    const partData = { ...defaultPart, ...overrides };

    const response = await request(app)
      .post('/api/v1/parts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(partData);

    if (response.status !== 201) {
      throw new Error(`Creating test part failed: ${JSON.stringify(response.body)}`);
    }

    return response.body.data;
  },

  /**
   * Create test customer
   */
  createCustomer: async (tenantId: string, accessToken: string, overrides = {}) => {
    const defaultCustomer = {
      first_name: 'Test',
      last_name: 'Customer',
      email: `customer-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@example.com`,
      phone: '0400123456',
      address: '123 Test St, Sydney NSW 2000',
    };

    const customerData = { ...defaultCustomer, ...overrides };

    const response = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(customerData);

    if (response.status !== 201) {
      throw new Error(`Creating test customer failed: ${JSON.stringify(response.body)}`);
    }

    return response.body.data;
  },

  /**
   * Create test vehicle
   */
  createVehicle: async (
    tenantId: string,
    accessToken: string,
    overrides = {}
  ) => {
    const defaultVehicle = {
      vin: `TEST${Date.now()}`,
      make: 'Toyota',
      model: 'Corolla',
      year: 2020,
      date_received: new Date().toISOString(),
    };

    const vehicleData = { ...defaultVehicle, ...overrides };

    const response = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(vehicleData);

    if (response.status !== 201) {
      throw new Error(`Creating test vehicle failed: ${JSON.stringify(response.body)}`);
    }

    return response.body.data;
  },
};