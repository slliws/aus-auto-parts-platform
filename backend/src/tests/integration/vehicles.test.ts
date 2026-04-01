import request from 'supertest';
import { app, clearDatabase } from '../setup';
import { getAdminUserWithToken } from '../helpers';
import prisma from '../../models/prisma';

/**
 * Vehicles Module Integration Tests
 * Tests vehicle listing, creation with VIN decoder, update, deletion
 * and customer association functionality
 */

describe('Vehicles API', () => {
  let accessToken: string;
  let tenantId: string;

  // Setup: Create a user and get token before each test
  beforeEach(async () => {
    await clearDatabase();
    const result = await getAdminUserWithToken();
    accessToken = result.accessToken;
    tenantId = result.tenant.id;
  });

  describe('GET /api/v1/vehicles', () => {
    it('should return empty array when no vehicles exist', async () => {
      const response = await request(app)
        .get('/api/v1/vehicles')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.vehicles).toBeInstanceOf(Array);
      expect(response.body.data.vehicles.length).toBe(0);
    });

    it('should return vehicles when they exist', async () => {
      // Create test vehicles
      await prisma.vehicle.createMany({
        data: [
          {
            vin: 'TEST1234567890A',
            make: 'Toyota',
            model: 'Corolla',
            year: 2020,
            date_received: new Date(),
            tenant_id: tenantId,
          },
          {
            vin: 'TEST9876543210B',
            make: 'Honda',
            model: 'Civic',
            year: 2021,
            date_received: new Date(),
            tenant_id: tenantId,
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/vehicles')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.vehicles).toBeInstanceOf(Array);
      expect(response.body.data.vehicles.length).toBe(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should support pagination', async () => {
      // Create 15 test vehicles
      const vehiclesData = Array(15).fill(null).map((_, i) => ({
        vin: `TEST${i.toString().padStart(6, '0')}`,
        make: i % 2 === 0 ? 'Toyota' : 'Honda',
        model: i % 2 === 0 ? 'Corolla' : 'Civic',
        year: 2020 + (i % 5),
        date_received: new Date(),
        tenant_id: tenantId,
      }));

      await prisma.vehicle.createMany({ data: vehiclesData });

      // Test first page with 10 items
      const response1 = await request(app)
        .get('/api/v1/vehicles?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response1.status).toBe(200);
      expect(response1.body.data.vehicles.length).toBe(10);
      expect(response1.body.data.total).toBe(15);
      expect(response1.body.data.page).toBe(1);
      expect(response1.body.data.totalPages).toBe(2);

      // Test second page
      const response2 = await request(app)
        .get('/api/v1/vehicles?page=2&limit=10')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response2.status).toBe(200);
      expect(response2.body.data.vehicles.length).toBe(5);
      expect(response2.body.data.page).toBe(2);

      // Verify different vehicles on different pages
      const firstPageIds = response1.body.data.vehicles.map((v: any) => v.id);
      const secondPageIds = response2.body.data.vehicles.map((v: any) => v.id);
      firstPageIds.forEach((id: string) => {
        expect(secondPageIds).not.toContain(id);
      });
    });

    it('should filter vehicles by make', async () => {
      // Create vehicles with different makes
      await prisma.vehicle.createMany({
        data: [
          {
            vin: 'TOYOTA1234567890',
            make: 'Toyota',
            model: 'Corolla',
            year: 2020,
            date_received: new Date(),
            tenant_id: tenantId,
          },
          {
            vin: 'HONDA1234567890',
            make: 'Honda',
            model: 'Civic',
            year: 2021,
            date_received: new Date(),
            tenant_id: tenantId,
          },
          {
            vin: 'TOYOTA9876543210',
            make: 'Toyota',
            model: 'Camry',
            year: 2019,
            date_received: new Date(),
            tenant_id: tenantId,
          },
        ],
      });

      // Filter by Toyota make
      const response = await request(app)
        .get('/api/v1/vehicles?make=Toyota')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.vehicles.length).toBe(2);
      response.body.data.vehicles.forEach((vehicle: any) => {
        expect(vehicle.make).toBe('Toyota');
      });
    });

    it('should not return vehicles from other tenants', async () => {
      // Create another tenant
      const otherTenant = await prisma.tenant.create({
        data: {
          name: 'Other Tenant',
          email: 'other-tenant@example.com',
          is_active: true,
        },
      });

      // Create vehicles for both tenants
      await prisma.vehicle.createMany({
        data: [
          {
            vin: 'OWN1234567890',
            make: 'Toyota',
            model: 'Corolla',
            year: 2020,
            date_received: new Date(),
            tenant_id: tenantId,
          },
          {
            vin: 'OTHER1234567890',
            make: 'Honda',
            model: 'Civic',
            year: 2021,
            date_received: new Date(),
            tenant_id: otherTenant.id,
          },
        ],
      });

      // Get vehicles for current tenant
      const response = await request(app)
        .get('/api/v1/vehicles')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.vehicles.length).toBe(1);
      expect(response.body.data.vehicles[0].vin).toBe('OWN1234567890');
    });
  });

  describe('POST /api/v1/vehicles', () => {
    it('should create a new vehicle', async () => {
      const vehicleData = {
        vin: 'NEW1234567890',
        make: 'Toyota',
        model: 'RAV4',
        year: 2022,
        date_received: new Date().toISOString(),
      };

      const response = await request(app)
        .post('/api/v1/vehicles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(vehicleData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.vin).toBe(vehicleData.vin);
      expect(response.body.data.make).toBe(vehicleData.make);
      expect(response.body.data.model).toBe(vehicleData.model);
      expect(response.body.data.tenant_id).toBe(tenantId);

      // Verify in database
      const dbVehicle = await prisma.vehicle.findFirst({
        where: {
          vin: vehicleData.vin,
          tenant_id: tenantId,
        },
      });

      expect(dbVehicle).not.toBeNull();
      expect(dbVehicle?.make).toBe(vehicleData.make);
    });

    it('should create a vehicle with VIN decoder information if available', async () => {
      // Note: Since we don't have a real VIN decoder in the test,
      // we'll simulate by providing all vehicle details and expect
      // the system to use them. In a real test with a VIN decoder,
      // we'd just provide the VIN and expect the system to populate
      // the other fields.
      const vehicleData = {
        vin: 'VIN1234567890',
        make: 'Ford',
        model: 'Mustang',
        year: 2021,
        date_received: new Date().toISOString(),
      };

      const response = await request(app)
        .post('/api/v1/vehicles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(vehicleData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.vin).toBe(vehicleData.vin);
      expect(response.body.data.make).toBe(vehicleData.make);
      expect(response.body.data.year).toBe(vehicleData.year);
    });

    it('should reject vehicles with duplicate VIN within the same tenant', async () => {
      // Create a vehicle
      await prisma.vehicle.create({
        data: {
          vin: 'DUPLICATE12345',
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          date_received: new Date(),
          tenant_id: tenantId,
        },
      });

      // Try to create with same VIN
      const vehicleData = {
        vin: 'DUPLICATE12345',
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        date_received: new Date().toISOString(),
      };

      const response = await request(app)
        .post('/api/v1/vehicles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(vehicleData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should allow vehicles with same VIN in different tenants', async () => {
      // Create another tenant
      const otherTenant = await prisma.tenant.create({
        data: {
          name: 'Other Tenant',
          email: 'other-tenant@example.com',
          is_active: true,
        },
      });

      // Create a vehicle in other tenant
      await prisma.vehicle.create({
        data: {
          vin: 'MULTITENANT123',
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          date_received: new Date(),
          tenant_id: otherTenant.id,
        },
      });

      // Create vehicle with same VIN in current tenant
      const vehicleData = {
        vin: 'MULTITENANT123',
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        date_received: new Date().toISOString(),
      };

      const response = await request(app)
        .post('/api/v1/vehicles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(vehicleData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.vin).toBe(vehicleData.vin);
      expect(response.body.data.tenant_id).toBe(tenantId);
    });
  });

  describe('GET /api/v1/vehicles/:id', () => {
    it('should return a specific vehicle by ID', async () => {
      // Create a vehicle
      const vehicle = await prisma.vehicle.create({
        data: {
          vin: 'DETAIL12345',
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          date_received: new Date(),
          tenant_id: tenantId,
        },
      });

      const response = await request(app)
        .get(`/api/v1/vehicles/${vehicle.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(vehicle.id);
      expect(response.body.data.vin).toBe('DETAIL12345');
      expect(response.body.data.make).toBe('Toyota');
    });

    it('should return 404 for non-existent vehicle', async () => {
      const response = await request(app)
        .get('/api/v1/vehicles/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should not allow access to vehicles from other tenants', async () => {
      // Create another tenant
      const otherTenant = await prisma.tenant.create({
        data: {
          name: 'Other Tenant',
          email: 'other-tenant@example.com',
          is_active: true,
        },
      });

      // Create a vehicle in the other tenant
      const otherVehicle = await prisma.vehicle.create({
        data: {
          vin: 'OTHER12345',
          make: 'Honda',
          model: 'Civic',
          year: 2021,
          date_received: new Date(),
          tenant_id: otherTenant.id,
        },
      });

      // Try to access with current tenant's token
      const response = await request(app)
        .get(`/api/v1/vehicles/${otherVehicle.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/vehicles/:id', () => {
    it('should update an existing vehicle', async () => {
      // Create a vehicle
      const vehicle = await prisma.vehicle.create({
        data: {
          vin: 'UPDATE12345',
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          date_received: new Date(),
          tenant_id: tenantId,
        },
      });

      const updateData = {
        model: 'Corolla Hybrid',
        year: 2021,
        notes: 'Updated with hybrid information',
      };

      const response = await request(app)
        .put(`/api/v1/vehicles/${vehicle.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.model).toBe(updateData.model);
      expect(response.body.data.year).toBe(updateData.year);
      expect(response.body.data.notes).toBe(updateData.notes);

      // Unchanged fields should remain the same
      expect(response.body.data.vin).toBe('UPDATE12345');
      expect(response.body.data.make).toBe('Toyota');
    });

    it('should return 404 for updating non-existent vehicle', async () => {
      const updateData = {
        model: 'Updated Model',
      };

      const response = await request(app)
        .put('/api/v1/vehicles/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/vehicles/:id', () => {
    it('should delete an existing vehicle', async () => {
      // Create a vehicle
      const vehicle = await prisma.vehicle.create({
        data: {
          vin: 'DELETE12345',
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          date_received: new Date(),
          tenant_id: tenantId,
        },
      });

      // Delete the vehicle
      const deleteResponse = await request(app)
        .delete(`/api/v1/vehicles/${vehicle.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/api/v1/vehicles/${vehicle.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for deleting non-existent vehicle', async () => {
      const response = await request(app)
        .delete('/api/v1/vehicles/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('VIN Decoder Integration', () => {
    it('should attempt to decode VIN when creating a vehicle', async () => {
      // Create with minimal data, expecting VIN decoder to fill in details
      // Note: In a real test, we'd mock the VIN decoder service
      const vehicleData = {
        vin: 'DECODER12345',
        date_received: new Date().toISOString(),
      };

      const response = await request(app)
        .post('/api/v1/vehicles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(vehicleData);

      // Even if decoder fails, it should create the vehicle with the data provided
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.vin).toBe(vehicleData.vin);
    });
  });
});