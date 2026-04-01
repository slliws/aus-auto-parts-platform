import request from 'supertest';
import { app, clearDatabase } from '../setup';
import { getAdminUserWithToken } from '../helpers';
import prisma from '../../models/prisma';

/**
 * Customers Module Integration Tests
 * Tests customer listing, creation, update, deletion and search functionality
 */

describe('Customers API', () => {
  let accessToken: string;
  let tenantId: string;

  // Setup: Create a user and get token before each test
  beforeEach(async () => {
    await clearDatabase();
    const result = await getAdminUserWithToken();
    accessToken = result.accessToken;
    tenantId = result.tenant.id;
  });

  describe('GET /api/v1/customers', () => {
    it('should return empty array when no customers exist', async () => {
      const response = await request(app)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customers).toBeInstanceOf(Array);
      expect(response.body.data.customers.length).toBe(0);
    });

    it('should return customers when they exist', async () => {
      // Create test customers
      await prisma.customer.createMany({
        data: [
          {
            first_name: 'Test',
            last_name: 'Customer 1',
            email: 'customer1@example.com',
            phone: '0400111222',
            address: '123 Test St, Sydney NSW 2000',
            tenant_id: tenantId,
            is_active: true,
          },
          {
            first_name: 'Test',
            last_name: 'Customer 2',
            email: 'customer2@example.com',
            phone: '0400333444',
            address: '456 Test Ave, Melbourne VIC 3000',
            tenant_id: tenantId,
            is_active: true,
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customers).toBeInstanceOf(Array);
      expect(response.body.data.customers.length).toBe(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should support pagination', async () => {
      // Create 25 test customers
      const customersData = Array(25).fill(null).map((_, i) => ({
        first_name: 'Customer',
        last_name: `${i + 1}`,
        email: `customer${i + 1}@example.com`,
        phone: `0400${i.toString().padStart(6, '0')}`,
        address: `${i + 1} Test St, Sydney NSW 2000`,
        tenant_id: tenantId,
        is_active: true,
      }));

      await prisma.customer.createMany({ data: customersData });

      // Test first page with 10 items
      const response1 = await request(app)
        .get('/api/v1/customers?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response1.status).toBe(200);
      expect(response1.body.data.customers.length).toBe(10);
      expect(response1.body.data.total).toBe(25);
      expect(response1.body.data.page).toBe(1);
      expect(response1.body.data.totalPages).toBe(3);

      // Test second page
      const response2 = await request(app)
        .get('/api/v1/customers?page=2&limit=10')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response2.status).toBe(200);
      expect(response2.body.data.customers.length).toBe(10);
      expect(response2.body.data.page).toBe(2);

      // Verify different customers on different pages
      const firstPageIds = response1.body.data.customers.map((c: any) => c.id);
      const secondPageIds = response2.body.data.customers.map((c: any) => c.id);
      firstPageIds.forEach((id: string) => {
        expect(secondPageIds).not.toContain(id);
      });
    });

    it('should filter customers by search term', async () => {
      // Create customers with different names
      await prisma.customer.createMany({
        data: [
          {
            first_name: 'Automotive',
            last_name: 'Specialists',
            email: 'auto@example.com',
            phone: '0400111222',
            address: '123 Auto St, Sydney NSW 2000',
            tenant_id: tenantId,
            is_active: true,
          },
          {
            first_name: 'Sydney',
            last_name: 'Mechanics',
            email: 'mechanics@example.com',
            phone: '0400333444',
            address: '456 Mechanic Ave, Sydney NSW 2000',
            tenant_id: tenantId,
            is_active: true,
          },
          {
            first_name: 'Melbourne',
            last_name: 'Parts',
            email: 'parts@example.com',
            phone: '0400555666',
            address: '789 Parts St, Melbourne VIC 3000',
            tenant_id: tenantId,
            is_active: true,
          },
        ],
      });

      // Search for "Sydney"
      const response = await request(app)
        .get('/api/v1/customers?search=Sydney')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.customers.length).toBe(1);
      expect(response.body.data.customers[0].last_name).toBe('Mechanics');
    });

    it('should not return customers from other tenants', async () => {
      // Create another tenant
      const otherTenant = await prisma.tenant.create({
        data: {
          name: 'Other Tenant',
          email: 'other-tenant@example.com',
          is_active: true,
        },
      });

      // Create customers for both tenants
      await prisma.customer.createMany({
        data: [
          {
            first_name: 'Own',
            last_name: 'Tenant Customer',
            email: 'own@example.com',
            phone: '0400111222',
            address: '123 Own St, Sydney NSW 2000',
            tenant_id: tenantId,
            is_active: true,
          },
          {
            first_name: 'Other',
            last_name: 'Tenant Customer',
            email: 'other@example.com',
            phone: '0400333444',
            address: '456 Other Ave, Sydney NSW 2000',
            tenant_id: otherTenant.id,
            is_active: true,
          },
        ],
      });

      // Get customers for current tenant
      const response = await request(app)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.customers.length).toBe(1);
      expect(response.body.data.customers[0].last_name).toBe('Tenant Customer');
    });
  });

  describe('POST /api/v1/customers', () => {
    it('should create a new customer', async () => {
      const customerData = {
        first_name: 'New',
        last_name: 'Customer',
        email: 'new@example.com',
        phone: '0400123456',
        address: '123 New St, Brisbane QLD 4000',
      };

      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(customerData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.last_name).toBe(customerData.last_name);
      expect(response.body.data.email).toBe(customerData.email);
      expect(response.body.data.tenant_id).toBe(tenantId);
      expect(response.body.data.is_active).toBe(true);

      // Verify in database
      const dbCustomer = await prisma.customer.findFirst({
        where: {
          email: customerData.email,
          tenant_id: tenantId,
        },
      });

      expect(dbCustomer).not.toBeNull();
      expect(dbCustomer?.last_name).toBe(customerData.last_name);
    });

    it('should reject customers with duplicate email within the same tenant', async () => {
      // Create a customer
      await prisma.customer.create({
        data: {
          first_name: 'Existing',
          last_name: 'Customer',
          email: 'duplicate@example.com',
          phone: '0400111222',
          address: '123 Existing St, Sydney NSW 2000',
          tenant_id: tenantId,
          is_active: true,
        },
      });

      // Try to create with same email
      const customerData = {
        first_name: 'Duplicate',
        last_name: 'Customer',
        email: 'duplicate@example.com',
        phone: '0400333444',
        address: '456 Duplicate Ave, Sydney NSW 2000',
      };

      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(customerData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should allow customers with same email in different tenants', async () => {
      // Create another tenant
      const otherTenant = await prisma.tenant.create({
        data: {
          name: 'Other Tenant',
          email: 'other-tenant@example.com',
          is_active: true,
        },
      });

      // Create a customer in other tenant
      await prisma.customer.create({
        data: {
          first_name: 'Other',
          last_name: 'Tenant Customer',
          email: 'multi-tenant@example.com',
          phone: '0400111222',
          address: '123 Other St, Sydney NSW 2000',
          tenant_id: otherTenant.id,
          is_active: true,
        },
      });

      // Create customer with same email in current tenant
      const customerData = {
        first_name: 'Own',
        last_name: 'Tenant Customer',
        email: 'multi-tenant@example.com',
        phone: '0400333444',
        address: '456 Own Ave, Sydney NSW 2000',
      };

      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(customerData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.last_name).toBe(customerData.last_name);
      expect(response.body.data.email).toBe(customerData.email);
      expect(response.body.data.tenant_id).toBe(tenantId);
    });
  });

  describe('GET /api/v1/customers/:id', () => {
    it('should return a specific customer by ID', async () => {
      // Create a customer
      const customer = await prisma.customer.create({
        data: {
          first_name: 'Detail',
          last_name: 'Customer',
          email: 'detail@example.com',
          phone: '0400123456',
          address: '123 Detail St, Sydney NSW 2000',
          tenant_id: tenantId,
          is_active: true,
        },
      });

      const response = await request(app)
        .get(`/api/v1/customers/${customer.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(customer.id);
      expect(response.body.data.last_name).toBe('Customer');
      expect(response.body.data.email).toBe('detail@example.com');
    });

    it('should return 404 for non-existent customer', async () => {
      const response = await request(app)
        .get('/api/v1/customers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should not allow access to customers from other tenants', async () => {
      // Create another tenant
      const otherTenant = await prisma.tenant.create({
        data: {
          name: 'Other Tenant',
          email: 'other-tenant@example.com',
          is_active: true,
        },
      });

      // Create a customer in the other tenant
      const otherCustomer = await prisma.customer.create({
        data: {
          first_name: 'Other',
          last_name: 'Tenant Customer',
          email: 'other@example.com',
          phone: '0400123456',
          address: '123 Other St, Sydney NSW 2000',
          tenant_id: otherTenant.id,
          is_active: true,
        },
      });

      // Try to access with current tenant's token
      const response = await request(app)
        .get(`/api/v1/customers/${otherCustomer.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/customers/:id', () => {
    it('should update an existing customer', async () => {
      // Create a customer
      const customer = await prisma.customer.create({
        data: {
          first_name: 'Original',
          last_name: 'Name',
          email: 'original@example.com',
          phone: '0400123456',
          address: '123 Original St, Sydney NSW 2000',
          tenant_id: tenantId,
          is_active: true,
        },
      });

      const updateData = {
        first_name: 'Updated',
        last_name: 'Name',
        phone: '0400789012',
        address: '456 Updated Ave, Brisbane QLD 4000',
      };

      const response = await request(app)
        .put(`/api/v1/customers/${customer.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.last_name).toBe(updateData.last_name);
      expect(response.body.data.phone).toBe(updateData.phone);
      expect(response.body.data.address).toBe(updateData.address);

      // Unchanged fields should remain the same
      expect(response.body.data.email).toBe('original@example.com');
      expect(response.body.data.is_active).toBe(true);
    });

    it('should return 404 for updating non-existent customer', async () => {
      const updateData = {
        first_name: 'Updated',
        last_name: 'Name',
      };

      const response = await request(app)
        .put('/api/v1/customers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/customers/:id', () => {
    it('should delete an existing customer', async () => {
      // Create a customer
      const customer = await prisma.customer.create({
        data: {
          first_name: 'Customer',
          last_name: 'to Delete',
          email: 'delete@example.com',
          phone: '0400123456',
          address: '123 Delete St, Sydney NSW 2000',
          tenant_id: tenantId,
          is_active: true,
        },
      });

      // Delete the customer
      const deleteResponse = await request(app)
        .delete(`/api/v1/customers/${customer.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/api/v1/customers/${customer.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for deleting non-existent customer', async () => {
      const response = await request(app)
        .delete('/api/v1/customers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/customers/:id/vehicles', () => {
    it('should return customer vehicles', async () => {
      // Create a customer
      const customer = await prisma.customer.create({
        data: {
          first_name: 'Vehicle',
          last_name: 'Owner',
          email: 'owner@example.com',
          phone: '0400123456',
          address: '123 Vehicle St, Sydney NSW 2000',
          tenant_id: tenantId,
          is_active: true,
        },
      });

      // Create vehicles for the customer
      await prisma.vehicle.createMany({
        data: [
          {
            vin: 'VIN1234567890',
            make: 'Toyota',
            model: 'Corolla',
            year: 2020,
            date_received: new Date(),
            tenant_id: tenantId,
          },
          {
            vin: 'VIN0987654321',
            make: 'Honda',
            model: 'Civic',
            year: 2021,
            date_received: new Date(),
            tenant_id: tenantId,
          },
        ],
      });

      const response = await request(app)
        .get(`/api/v1/customers/${customer.id}/vehicles`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.vehicles).toBeInstanceOf(Array);
      expect(response.body.data.vehicles.length).toBe(2);
      expect(response.body.data.customer.id).toBe(customer.id);
    });

    it('should return 404 for non-existent customer', async () => {
      const response = await request(app)
        .get('/api/v1/customers/00000000-0000-0000-0000-000000000000/vehicles')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return empty array when customer has no vehicles', async () => {
      // Create a customer with no vehicles
      const customer = await prisma.customer.create({
        data: {
          first_name: 'No',
          last_name: 'Vehicle Owner',
          email: 'no-vehicles@example.com',
          phone: '0400123456',
          address: '123 No Vehicle St, Sydney NSW 2000',
          tenant_id: tenantId,
          is_active: true,
        },
      });

      const response = await request(app)
        .get(`/api/v1/customers/${customer.id}/vehicles`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.vehicles).toBeInstanceOf(Array);
      expect(response.body.data.vehicles.length).toBe(0);
    });
  });
});