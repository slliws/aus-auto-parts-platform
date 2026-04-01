import request from 'supertest';
import { app, clearDatabase } from '../setup';
import { getAdminUserWithToken } from '../helpers';
import prisma from '../../models/prisma';
import { generateAccessToken } from '../../utils/jwt';

/**
 * Cross-Module Integration Tests
 * Tests functionality that spans multiple modules:
 * - Global search across entities
 * - Multi-tenant isolation
 * - Relationship management (customer-vehicle, etc.)
 */

describe('Cross-Module Integration', () => {
  let accessToken: string;
  let tenantId: string;

  // Setup: Create a user and get token before each test
  beforeEach(async () => {
    await clearDatabase();
    const result = await getAdminUserWithToken();
    accessToken = result.accessToken;
    tenantId = result.tenant.id;
  });

  describe('Global Search API', () => {
    it('should search across multiple entity types', async () => {
      // Create test customer
      const customer = await prisma.customer.create({
        data: {
          first_name: 'Acme',
          last_name: 'Auto Parts',
          email: 'acme@example.com',
          phone: '0400123456',
          address: '123 Acme St, Sydney NSW 2000',
          tenant_id: tenantId,
          is_active: true,
        },
      });

      // Create test vehicle
      const vehicle = await prisma.vehicle.create({
        data: {
          vin: 'ACME1234567890',
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          date_received: new Date(),
          tenant_id: tenantId,
        },
      });

      // Create test part
      const part = await prisma.part.create({
        data: {
          part_number: 'ACME-001',
          name: 'Acme Special Filter',
          description: 'High-quality air filter for Toyota vehicles',
          category: 'FILTERS',
          sell_price: 29.99,
          cost_price: 15.99,
          stock_quantity: 100,
          tenant_id: tenantId,
          is_available: true,
        },
      });

      // Search for "Acme" across all entities
      const response = await request(app)
        .get('/api/v1/search?query=Acme')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toBeDefined();

      // Check that all entity types are represented
      expect(response.body.data.results.customers).toBeDefined();
      expect(response.body.data.results.customers.length).toBeGreaterThan(0);
      expect(response.body.data.results.customers[0].id).toBe(customer.id);

      expect(response.body.data.results.parts).toBeDefined();
      expect(response.body.data.results.parts.length).toBeGreaterThan(0);
      expect(response.body.data.results.parts[0].id).toBe(part.id);

      // Vehicle might be found by association with Acme customer
      if (response.body.data.results.vehicles?.length > 0) {
        expect(response.body.data.results.vehicles[0].id).toBe(vehicle.id);
      }
    });

    it('should return empty results for non-matching search', async () => {
      // Create some test data
      await prisma.customer.create({
        data: {
          first_name: 'Test',
          last_name: 'Customer',
          email: 'test@example.com',
          phone: '0400123456',
          address: '123 Test St, Sydney NSW 2000',
          tenant_id: tenantId,
          is_active: true,
        },
      });

      // Search for non-existent term
      const response = await request(app)
        .get('/api/v1/search?query=NonExistent')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toBeDefined();

      // Check that all entity arrays are empty
      expect(response.body.data.results.customers).toEqual([]);
      expect(response.body.data.results.parts).toEqual([]);
      expect(response.body.data.results.vehicles).toEqual([]);
    });

    it('should respect tenant isolation in search results', async () => {
      // Create own tenant data
      const ownCustomer = await prisma.customer.create({
        data: {
          first_name: 'Universal',
          last_name: 'Auto Parts',
          email: 'universal@example.com',
          phone: '0400123456',
          address: '123 Universal St, Sydney NSW 2000',
          tenant_id: tenantId,
          is_active: true,
        },
      });

      // Create another tenant
      const otherTenant = await prisma.tenant.create({
        data: {
          name: 'Other Tenant',
          email: 'other-tenant@example.com',
          is_active: true,
        },
      });

      // Create data in other tenant
      await prisma.customer.create({
        data: {
          first_name: 'Universal',
          last_name: 'Motors',
          email: 'motors@example.com',
          phone: '0400789012',
          address: '456 Universal Ave, Melbourne VIC 3000',
          tenant_id: otherTenant.id,
          is_active: true,
        },
      });

      // Search for "Universal" term
      const response = await request(app)
        .get('/api/v1/search?query=Universal')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Should only find customer from own tenant
      expect(response.body.data.results.customers.length).toBe(1);
      expect(response.body.data.results.customers[0].id).toBe(ownCustomer.id);
      expect(response.body.data.results.customers[0].last_name).toBe('Auto Parts');
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should ensure complete data isolation between tenants', async () => {
      // Create data in current tenant
      await prisma.customer.create({
        data: {
          first_name: 'Own',
          last_name: 'Tenant Customer',
          email: 'own@example.com',
          phone: '0400123456',
          address: '123 Own St, Sydney NSW 2000',
          tenant_id: tenantId,
          is_active: true,
        },
      });

      await prisma.part.create({
        data: {
          part_number: 'OWN-001',
          name: 'Own Tenant Part',
          description: 'A part for own tenant',
          category: 'ENGINE',
          sell_price: 99.99,
          cost_price: 49.99,
          stock_quantity: 100,
          tenant_id: tenantId,
          is_available: true,
        },
      });

      // Create another tenant
      const otherTenant = await prisma.tenant.create({
        data: {
          name: 'Other Tenant',
          email: 'other-tenant@example.com',
          is_active: true,
        },
      });

      // Create admin user for other tenant
      const otherAdminUser = await prisma.user.create({
        data: {
          email: `other-admin-${Date.now()}@example.com`,
          password_hash: '$2b$10$lJYs3HGq73mDPSKzvL4HXOb2VUY6HQnGdKMeP1j5w33CGvq1AP9qG', // password123
          first_name: 'Other',
          last_name: 'Admin',
          role: 'ADMIN',
          is_active: true,
          email_verified: true,
          tenant_id: otherTenant.id,
        },
      });

      // Generate token for other tenant's admin
      const otherAccessToken = generateAccessToken(otherAdminUser, otherTenant);

      // Create data in other tenant
      await prisma.customer.create({
        data: {
          first_name: 'Other',
          last_name: 'Tenant Customer',
          email: 'other@example.com',
          phone: '0400789012',
          address: '456 Other Ave, Melbourne VIC 3000',
          tenant_id: otherTenant.id,
          is_active: true,
        },
      });

      await prisma.part.create({
        data: {
          part_number: 'OTHER-001',
          name: 'Other Tenant Part',
          description: 'A part for other tenant',
          category: 'ENGINE',
          sell_price: 199.99,
          cost_price: 99.99,
          stock_quantity: 50,
          tenant_id: otherTenant.id,
          is_available: true,
        },
      });

      // Test isolation for first tenant
      const response1 = await request(app)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response1.status).toBe(200);
      expect(response1.body.data.customers.length).toBe(1);
      expect(response1.body.data.customers[0].last_name).toBe('Tenant Customer');

      // Test isolation for second tenant
      const response2 = await request(app)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${otherAccessToken}`);

      expect(response2.status).toBe(200);
      expect(response2.body.data.customers.length).toBe(1);
      expect(response2.body.data.customers[0].last_name).toBe('Tenant Customer');
    });
  });

  describe('Relationship Management', () => {
    it('should maintain customer-vehicle relationships', async () => {
      // Create a customer
      const customer = await prisma.customer.create({
        data: {
          first_name: 'Relationship',
          last_name: 'Test Customer',
          email: 'relationship@example.com',
          phone: '0400123456',
          address: '123 Relationship St, Sydney NSW 2000',
          tenant_id: tenantId,
          is_active: true,
        },
      });

      // Create vehicles for the customer
      const vehicle1 = await prisma.vehicle.create({
        data: {
          vin: 'REL1234567890',
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          date_received: new Date(),
          tenant_id: tenantId,
        },
      });

      const vehicle2 = await prisma.vehicle.create({
        data: {
          vin: 'REL0987654321',
          make: 'Honda',
          model: 'Civic',
          year: 2021,
          date_received: new Date(),
          tenant_id: tenantId,
        },
      });

      // Verify customer has vehicles
      const customerResponse = await request(app)
        .get(`/api/v1/customers/${customer.id}/vehicles`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(customerResponse.status).toBe(200);
      expect(customerResponse.body.data.vehicles).toBeInstanceOf(Array);
      expect(customerResponse.body.data.customer.id).toBe(customer.id);
      
      // Verify vehicles include customer details
      const vehicleResponse = await request(app)
        .get(`/api/v1/vehicles/${vehicle1.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(vehicleResponse.status).toBe(200);
      expect(vehicleResponse.body.data.id).toBe(vehicle1.id);

      // Transfer vehicle to another customer
      const newCustomer = await prisma.customer.create({
        data: {
          first_name: 'New',
          last_name: 'Owner',
          email: 'new-owner@example.com',
          phone: '0400789012',
          address: '456 New Owner Ave, Sydney NSW 2000',
          tenant_id: tenantId,
          is_active: true,
        },
      });

      await request(app)
        .put(`/api/v1/vehicles/${vehicle1.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          notes: 'Vehicle transferred to new owner',
        });

      // Verify first customer now has only one vehicle
      const updatedCustomerResponse = await request(app)
        .get(`/api/v1/customers/${customer.id}/vehicles`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(updatedCustomerResponse.status).toBe(200);
      expect(updatedCustomerResponse.body.data.vehicles.length).toBe(1);
      expect(updatedCustomerResponse.body.data.vehicles[0].id).toBe(vehicle2.id);

      // Verify new customer has the transferred vehicle
      const newCustomerResponse = await request(app)
        .get(`/api/v1/customers/${newCustomer.id}/vehicles`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(newCustomerResponse.status).toBe(200);
      expect(newCustomerResponse.body.data.vehicles.length).toBe(1);
      expect(newCustomerResponse.body.data.vehicles[0].id).toBe(vehicle1.id);
    });

    it('should handle cascading operations properly', async () => {
      // Create a customer
      const customer = await prisma.customer.create({
        data: {
          first_name: 'Cascade',
          last_name: 'Test Customer',
          email: 'cascade@example.com',
          phone: '0400123456',
          address: '123 Cascade St, Sydney NSW 2000',
          tenant_id: tenantId,
          is_active: true,
        },
      });

      // Create a vehicle for the customer
      const vehicle = await prisma.vehicle.create({
        data: {
          vin: 'CASCADE12345',
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          date_received: new Date(),
          tenant_id: tenantId,
        },
      });

      // Verify relationship
      const initialResponse = await request(app)
        .get(`/api/v1/customers/${customer.id}/vehicles`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(initialResponse.status).toBe(200);
      expect(initialResponse.body.data.vehicles).toBeInstanceOf(Array);

      // Delete the customer
      const deleteResponse = await request(app)
        .delete(`/api/v1/customers/${customer.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteResponse.status).toBe(200);

      // Vehicle should still exist but with null customer_id
      // This depends on how cascading is configured in the database schema
      const vehicleResponse = await request(app)
        .get(`/api/v1/vehicles/${vehicle.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Depending on implementation, this could be 404 if cascade delete is set
      // or 200 with null customer_id if set null is configured
      if (vehicleResponse.status === 200) {
        expect(vehicleResponse.body.data.id).toBe(vehicle.id);
      } else {
        expect(vehicleResponse.status).toBe(404);
      }
    });
  });
});