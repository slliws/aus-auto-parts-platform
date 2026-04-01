import request from 'supertest';
import { app, clearDatabase } from '../setup';
import { getAdminUserWithToken } from '../helpers';
import prisma from '../../models/prisma';

/**
 * Parts Module Integration Tests
 * Tests parts listing, creation, update, deletion and search functionality
 */

describe('Parts API', () => {
  let accessToken: string;
  let tenantId: string;

  // Setup: Create a user and get token before each test
  beforeEach(async () => {
    await clearDatabase();
    const result = await getAdminUserWithToken();
    accessToken = result.accessToken;
    tenantId = result.tenant.id;
  });

  describe('GET /api/v1/parts', () => {
    it('should return empty array when no parts exist', async () => {
      const response = await request(app)
        .get('/api/v1/parts')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toBeInstanceOf(Array);
      expect(response.body.data.parts.length).toBe(0);
    });

    it('should return parts when they exist', async () => {
      // Create test parts
      await prisma.part.createMany({
        data: [
          {
            part_number: 'TEST-001',
            name: 'Test Part 1',
            description: 'Description 1',
            category: 'ENGINE',
            sell_price: 99.99,
            cost_price: 49.99,
            stock_quantity: 100,
            tenant_id: tenantId,
            is_available: true,
          },
          {
            part_number: 'TEST-002',
            name: 'Test Part 2',
            description: 'Description 2',
            category: 'BRAKES',
            sell_price: 129.99,
            cost_price: 69.99,
            stock_quantity: 50,
            tenant_id: tenantId,
            is_available: true,
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/parts')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toBeInstanceOf(Array);
      expect(response.body.data.parts.length).toBe(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should support pagination', async () => {
      // Create 25 test parts
      const partsData = Array(25).fill(null).map((_, i) => ({
        part_number: `TEST-${i.toString().padStart(3, '0')}`,
        name: `Test Part ${i + 1}`,
        description: `Description ${i + 1}`,
        category: i % 2 === 0 ? 'ENGINE' : 'BRAKES',
        sell_price: 99.99 + i,
        cost_price: 49.99 + i,
        stock_quantity: 100 - i,
        tenant_id: tenantId,
        is_available: true,
      }));

      await prisma.part.createMany({ data: partsData });

      // Test first page with 10 items
      const response1 = await request(app)
        .get('/api/v1/parts?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response1.status).toBe(200);
      expect(response1.body.data.parts.length).toBe(10);
      expect(response1.body.data.total).toBe(25);
      expect(response1.body.data.page).toBe(1);
      expect(response1.body.data.totalPages).toBe(3);

      // Test second page
      const response2 = await request(app)
        .get('/api/v1/parts?page=2&limit=10')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response2.status).toBe(200);
      expect(response2.body.data.parts.length).toBe(10);
      expect(response2.body.data.page).toBe(2);

      // Verify different parts on different pages
      const firstPageIds = response1.body.data.parts.map((p: any) => p.id);
      const secondPageIds = response2.body.data.parts.map((p: any) => p.id);
      firstPageIds.forEach((id: string) => {
        expect(secondPageIds).not.toContain(id);
      });
    });

    it('should filter parts by category', async () => {
      // Create parts in different categories
      await prisma.part.createMany({
        data: [
          {
            part_number: 'ENGINE-001',
            name: 'Engine Part 1',
            description: 'Engine Description 1',
            category: 'ENGINE',
            sell_price: 199.99,
            cost_price: 99.99,
            stock_quantity: 100,
            tenant_id: tenantId,
            is_available: true,
          },
          {
            part_number: 'BRAKE-001',
            name: 'Brake Part 1',
            description: 'Brake Description 1',
            category: 'BRAKES',
            sell_price: 129.99,
            cost_price: 69.99,
            stock_quantity: 50,
            tenant_id: tenantId,
            is_available: true,
          },
          {
            part_number: 'ENGINE-002',
            name: 'Engine Part 2',
            description: 'Engine Description 2',
            category: 'ENGINE',
            sell_price: 299.99,
            cost_price: 149.99,
            stock_quantity: 75,
            tenant_id: tenantId,
            is_available: true,
          },
        ],
      });

      // Filter by ENGINE category
      const response = await request(app)
        .get('/api/v1/parts?category=ENGINE')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.parts.length).toBe(2);
      response.body.data.parts.forEach((part: any) => {
        expect(part.category).toBe('ENGINE');
      });
    });

    it('should filter parts by search term', async () => {
      // Create parts with different names
      await prisma.part.createMany({
        data: [
          {
            part_number: 'FILTER-001',
            name: 'Oil Filter',
            description: 'Oil Filter Description',
            category: 'FILTERS',
            sell_price: 19.99,
            cost_price: 9.99,
            stock_quantity: 100,
            tenant_id: tenantId,
            is_available: true,
          },
          {
            part_number: 'FILTER-002',
            name: 'Air Filter',
            description: 'Air Filter Description',
            category: 'FILTERS',
            sell_price: 29.99,
            cost_price: 14.99,
            stock_quantity: 50,
            tenant_id: tenantId,
            is_available: true,
          },
          {
            part_number: 'BRAKE-001',
            name: 'Brake Pad',
            description: 'Brake Pad Description',
            category: 'BRAKES',
            sell_price: 49.99,
            cost_price: 24.99,
            stock_quantity: 75,
            tenant_id: tenantId,
            is_available: true,
          },
        ],
      });

      // Search for "Filter"
      const response = await request(app)
        .get('/api/v1/parts?search=Filter')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.parts.length).toBe(2);
      response.body.data.parts.forEach((part: any) => {
        expect(part.name).toContain('Filter');
      });
    });

    it('should not return parts from other tenants', async () => {
      // Create another tenant
      const otherTenant = await prisma.tenant.create({
        data: {
          name: 'Other Tenant',
          email: 'other-tenant@example.com',
          is_active: true,
        },
      });

      // Create parts for both tenants
      await prisma.part.createMany({
        data: [
          {
            part_number: 'OWN-001',
            name: 'Own Tenant Part',
            description: 'Own Description',
            category: 'ENGINE',
            sell_price: 199.99,
            cost_price: 99.99,
            stock_quantity: 100,
            tenant_id: tenantId,
            is_available: true,
          },
          {
            part_number: 'OTHER-001',
            name: 'Other Tenant Part',
            description: 'Other Description',
            category: 'ENGINE',
            sell_price: 299.99,
            cost_price: 149.99,
            stock_quantity: 100,
            tenant_id: otherTenant.id,
            is_available: true,
          },
        ],
      });

      // Get parts for current tenant
      const response = await request(app)
        .get('/api/v1/parts')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.parts.length).toBe(1);
      expect(response.body.data.parts[0].name).toBe('Own Tenant Part');
    });
  });

  describe('POST /api/v1/parts', () => {
    it('should create a new part', async () => {
      const partData = {
        partNumber: 'NEW-001',
        name: 'New Test Part',
        description: 'New Description',
        category: 'ELECTRICAL',
        sell_price: 149.99,
        cost_price: 79.99,
        stock_quantity: 200,
      };

      const response = await request(app)
        .post('/api/v1/parts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(partData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.partNumber).toBe(partData.partNumber);
      expect(response.body.data.name).toBe(partData.name);
      expect(response.body.data.category).toBe(partData.category);
      expect(response.body.data.tenant_id).toBe(tenantId);
      expect(response.body.data.is_active).toBe(true);

      // Verify in database
      const dbPart = await prisma.part.findFirst({
        where: {
          part_number: partData.partNumber,
          tenant_id: tenantId,
        },
      });

      expect(dbPart).not.toBeNull();
      expect(dbPart?.name).toBe(partData.name);
    });

    it('should reject parts with duplicate part numbers within the same tenant', async () => {
      // Create a part
      await prisma.part.create({
        data: {
          part_number: 'DUPLICATE',
          name: 'Existing Part',
          description: 'Existing Description',
          category: 'ENGINE',
          sell_price: 199.99,
          cost_price: 99.99,
          stock_quantity: 100,
          tenant_id: tenantId,
          is_available: true,
        },
      });

      // Try to create with same part number
      const partData = {
        partNumber: 'DUPLICATE',
        name: 'Duplicate Part',
        description: 'Duplicate Description',
        category: 'ELECTRICAL',
        sell_price: 149.99,
        cost_price: 79.99,
        stock_quantity: 200,
      };

      const response = await request(app)
        .post('/api/v1/parts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(partData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /api/v1/parts/:id', () => {
    it('should return a specific part by ID', async () => {
      // Create a part
      const part = await prisma.part.create({
        data: {
          part_number: 'GET-001',
          name: 'Get Test Part',
          description: 'Get Description',
          category: 'ENGINE',
          sell_price: 199.99,
          cost_price: 99.99,
          stock_quantity: 100,
          tenant_id: tenantId,
          is_available: true,
        },
      });

      const response = await request(app)
        .get(`/api/v1/parts/${part.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(part.id);
      expect(response.body.data.part_number).toBe('GET-001');
      expect(response.body.data.name).toBe('Get Test Part');
    });

    it('should return 404 for non-existent part', async () => {
      const response = await request(app)
        .get('/api/v1/parts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should not allow access to parts from other tenants', async () => {
      // Create another tenant
      const otherTenant = await prisma.tenant.create({
        data: {
          name: 'Other Tenant',
          email: 'other-tenant@example.com',
          is_active: true,
        },
      });

      // Create a part in the other tenant
      const otherPart = await prisma.part.create({
        data: {
          part_number: 'OTHER-001',
          name: 'Other Tenant Part',
          description: 'Other Description',
          category: 'ENGINE',
          sell_price: 299.99,
          cost_price: 149.99,
          stock_quantity: 100,
          tenant_id: otherTenant.id,
          is_available: true,
        },
      });

      // Try to access with current tenant's token
      const response = await request(app)
        .get(`/api/v1/parts/${otherPart.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/parts/:id', () => {
    it('should update an existing part', async () => {
      // Create a part
      const part = await prisma.part.create({
        data: {
          part_number: 'UPDATE-001',
          name: 'Original Name',
          description: 'Original Description',
          category: 'ENGINE',
          sell_price: 199.99,
          cost_price: 99.99,
          stock_quantity: 100,
          tenant_id: tenantId,
          is_available: true,
        },
      });

      const updateData = {
        name: 'Updated Name',
        description: 'Updated Description',
        sell_price: 249.99,
        stock_quantity: 150,
      };

      const response = await request(app)
        .put(`/api/v1/parts/${part.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.sell_price).toBe(updateData.sell_price);
      expect(response.body.data.stock_quantity).toBe(updateData.stock_quantity);

      // Unchanged fields should remain the same
      expect(response.body.data.part_number).toBe('UPDATE-001');
      expect(response.body.data.category).toBe('ENGINE');
      expect(response.body.data.cost_price).toBe(99.99);
    });

    it('should return 404 for updating non-existent part', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const response = await request(app)
        .put('/api/v1/parts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/parts/:id', () => {
    it('should delete an existing part', async () => {
      // Create a part
      const part = await prisma.part.create({
        data: {
          part_number: 'DELETE-001',
          name: 'Part to Delete',
          description: 'Delete Description',
          category: 'ENGINE',
          sell_price: 199.99,
          cost_price: 99.99,
          stock_quantity: 100,
          tenant_id: tenantId,
          is_available: true,
        },
      });

      // Delete the part
      const deleteResponse = await request(app)
        .delete(`/api/v1/parts/${part.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/api/v1/parts/${part.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for deleting non-existent part', async () => {
      const response = await request(app)
        .delete('/api/v1/parts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});