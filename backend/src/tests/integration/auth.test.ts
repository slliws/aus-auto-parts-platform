import request from 'supertest';
import { app, createTestUser, clearDatabase } from '../setup';
import prisma from '../../models/prisma';
import {
  loginUser,
  registerUser,
  getAdminUserWithToken,
} from '../helpers';

/**
 * Authentication Module Integration Tests
 * Tests the complete login flow, token refresh, unauthorized access, and registration
 */

describe('Authentication API', () => {
  // Clear database before each test
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Create a tenant first
      const tenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant',
          email: 'test-tenant@example.com',
          is_active: true,
        },
      });

      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        tenantId: tenant.id,
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      // Check response
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email.toLowerCase());
      expect(response.body.data.verificationToken).toBeDefined();

      // Verify user exists in database
      const user = await prisma.user.findUnique({
        where: { email: userData.email.toLowerCase() },
      });

      expect(user).toBeDefined();
      expect(user?.email).toBe(userData.email.toLowerCase());
      expect(user?.tenant_id).toBe(tenant.id);
      expect(user?.email_verified).toBe(false);
    });

    it('should prevent registration when tenant does not exist', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        tenantId: '00000000-0000-0000-0000-000000000000',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Tenant not found');
    });

    it('should prevent registration with duplicate email in same tenant', async () => {
      // Create a tenant
      const tenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant',
          email: 'test-tenant@example.com',
          is_active: true,
        },
      });

      // Create a user
      await prisma.user.create({
        data: {
          email: 'duplicate@example.com',
          password_hash: 'hash',
          first_name: 'Existing',
          last_name: 'User',
          tenant_id: tenant.id,
          is_active: true,
          email_verified: true,
          role: 'VIEWER',
        },
      });

      // Try to create another user with the same email
      const userData = {
        email: 'duplicate@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
        tenantId: tenant.id,
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should register user with same email in different tenants', async () => {
      // Create two tenants
      const tenant1 = await prisma.tenant.create({
        data: {
          name: 'Tenant 1',
          email: 'tenant1@example.com',
          is_active: true,
        },
      });

      const tenant2 = await prisma.tenant.create({
        data: {
          name: 'Tenant 2',
          email: 'tenant2@example.com',
          is_active: true,
        },
      });

      // Register user in first tenant
      const userData1 = {
        email: 'multi-tenant@example.com',
        password: 'Password123!',
        firstName: 'Multi',
        lastName: 'Tenant',
        tenantId: tenant1.id,
      };

      const response1 = await request(app)
        .post('/api/v1/auth/register')
        .send(userData1);

      expect(response1.status).toBe(201);

      // Register same email in second tenant
      const userData2 = {
        email: 'multi-tenant@example.com',
        password: 'Password123!',
        firstName: 'Multi',
        lastName: 'Tenant',
        tenantId: tenant2.id,
      };

      const response2 = await request(app)
        .post('/api/v1/auth/register')
        .send(userData2);

      expect(response2.status).toBe(201);

      // Verify both users exist
      const users = await prisma.user.findMany({
        where: { email: 'multi-tenant@example.com' },
      });

      expect(users.length).toBe(2);
      expect(users[0].tenant_id).not.toBe(users[1].tenant_id);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Create a tenant
      const tenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant',
          email: 'test-tenant@example.com',
          is_active: true,
        },
      });

      // Create a test user
      await createTestUser({
        email: 'login-test@example.com',
        tenant_id: tenant.id,
      });

      // Login
      const loginData = {
        email: 'login-test@example.com',
        password: 'password123', // Matches hash in createTestUser
        tenantId: tenant.id,
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(loginData.email);
    });

    it('should reject login with invalid password', async () => {
      // Create a tenant
      const tenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant',
          email: 'test-tenant@example.com',
          is_active: true,
        },
      });

      // Create a test user
      await createTestUser({
        email: 'password-test@example.com',
        tenant_id: tenant.id,
      });

      // Login with wrong password
      const loginData = {
        email: 'password-test@example.com',
        password: 'wrong-password',
        tenantId: tenant.id,
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should reject login for unverified email', async () => {
      // Create a tenant
      const tenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant',
          email: 'test-tenant@example.com',
          is_active: true,
        },
      });

      // Create a test user with unverified email
      await createTestUser({
        email: 'unverified@example.com',
        tenant_id: tenant.id,
        email_verified: false,
      });

      // Login
      const loginData = {
        email: 'unverified@example.com',
        password: 'password123',
        tenantId: tenant.id,
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email not verified');
    });

    it('should reject login for inactive user', async () => {
      // Create a tenant
      const tenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant',
          email: 'test-tenant@example.com',
          is_active: true,
        },
      });

      // Create an inactive user
      await createTestUser({
        email: 'inactive@example.com',
        tenant_id: tenant.id,
        is_active: false,
      });

      // Login
      const loginData = {
        email: 'inactive@example.com',
        password: 'password123',
        tenantId: tenant.id,
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('inactive');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // Create a tenant
      const tenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant',
          email: 'test-tenant@example.com',
          is_active: true,
        },
      });

      // Create a test user
      await createTestUser({
        email: 'refresh-test@example.com',
        tenant_id: tenant.id,
      });

      // Login to get tokens
      const loginData = {
        email: 'refresh-test@example.com',
        password: 'password123',
        tenantId: tenant.id,
      };

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(loginResponse.status).toBe(200);
      const { refreshToken } = loginResponse.body.data;

      // Refresh token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.data.accessToken).toBeDefined();
    });

    it('should reject refresh with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid refresh token');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should successfully logout with valid refresh token', async () => {
      // Create a tenant
      const tenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant',
          email: 'test-tenant@example.com',
          is_active: true,
        },
      });

      // Create a test user
      await createTestUser({
        email: 'logout-test@example.com',
        tenant_id: tenant.id,
      });

      // Login to get tokens
      const loginData = {
        email: 'logout-test@example.com',
        password: 'password123',
        tenantId: tenant.id,
      };

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(loginResponse.status).toBe(200);
      const { refreshToken } = loginResponse.body.data;

      // Logout
      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken });

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.success).toBe(true);

      // Try to refresh with the revoked token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user details with valid token', async () => {
      // Create a tenant and admin user with token
      const { accessToken, user } = await getAdminUserWithToken();

      // Get current user
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.id).toBe(user.id);
      expect(response.body.data.tenant).toBeDefined();
    });

    it('should reject unauthenticated access', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});