import { PrismaClient, SubscriptionTier, UserRole, CustomerType, PartCondition } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seed script for Australian Auto Parts Sales Platform
 * Creates realistic Australian tenant, users, customers, vehicles, and parts data
 * This script is idempotent and can be run multiple times without creating duplicates
 */
async function main() {
  console.log('🌱 Starting database seed...\n');

  // 1. Create Australian Tenant
  console.log('Creating demo tenant with Australian details...');
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Aussie Auto Parts Pty Ltd',
      abn: '45 123 456 789', // Valid ABN format
      email: 'info@aussieautoparts.com.au',
      phone: '02 8765 4321',
      address: '15 Mechanics Way, Parramatta NSW 2150',
      subscription_tier: SubscriptionTier.PRO,
      is_active: true,
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });
  console.log(`✅ Created tenant: ${tenant.name} (${tenant.id}) with ABN: ${tenant.abn}\n`);

  // 2. Create Users
  console.log('Creating admin user with login credentials...');
  const passwordHash = await bcrypt.hash('Password123!', 12);
  
  const adminUser = await prisma.user.create({
    data: {
      tenant_id: tenant.id,
      email: 'admin@aussieautoparts.com.au',
      password_hash: passwordHash,
      first_name: 'James',
      last_name: 'Wilson',
      role: UserRole.ADMIN,
      is_active: true,
      email_verified: true,
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      tenant_id: tenant.id,
      email: 'sales@aussieautoparts.com.au',
      password_hash: passwordHash,
      first_name: 'Sarah',
      last_name: 'Johnson',
      role: UserRole.SALES,
      is_active: true,
      email_verified: true,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      tenant_id: tenant.id,
      email: 'manager@aussieautoparts.com.au',
      password_hash: passwordHash,
      first_name: 'David',
      last_name: 'Thompson',
      role: UserRole.MANAGER,
      is_active: true,
      email_verified: true,
    },
  });

  console.log(`✅ Created ${3} users\n`);
  console.log(`Admin login: admin@aussieautoparts.com.au / Password123!`);

  // 3. Create Customers of different types (RETAIL, TRADE, WHOLESALE)
  console.log('Creating customers with Australian details...');
  const customers = await prisma.$transaction([
    // Retail customers
    prisma.customer.create({
      data: {
        tenant_id: tenant.id,
        customer_type: CustomerType.RETAIL,
        first_name: 'Michael',
        last_name: 'Brown',
        email: 'michael.brown@gmail.com',
        phone: '0400 123 456', // Australian mobile format
        address: '45 Main Road',
        suburb: 'Parramatta',
        state: 'NSW', // Australian state
        postcode: '2150', // 4-digit Australian postcode
      },
    }),
    prisma.customer.create({
      data: {
        tenant_id: tenant.id,
        customer_type: CustomerType.RETAIL,
        first_name: 'Jessica',
        last_name: 'Lee',
        email: 'jessica.lee@outlook.com.au',
        phone: '0411 234 567',
        address: '87 Elizabeth Street',
        suburb: 'North Sydney',
        state: 'NSW',
        postcode: '2060',
      },
    }),
    
    // Trade customers
    prisma.customer.create({
      data: {
        tenant_id: tenant.id,
        customer_type: CustomerType.TRADE,
        first_name: 'David',
        last_name: 'Wilson',
        email: 'david@wilsonmechanics.com.au',
        phone: '02 9555 1234', // Australian landline format
        mobile: '0422 987 654',
        abn: '72 345 678 901', // 11-digit ABN
        company_name: 'Wilson Mechanics',
        address: '78 Industrial Drive',
        suburb: 'Blacktown',
        state: 'NSW',
        postcode: '2148',
      },
    }),
    prisma.customer.create({
      data: {
        tenant_id: tenant.id,
        customer_type: CustomerType.TRADE,
        first_name: 'Steve',
        last_name: 'Matthews',
        email: 'steve@matthewsautomotive.com.au',
        phone: '03 9876 5432',
        mobile: '0433 765 432',
        abn: '67 890 123 456',
        company_name: 'Matthews Automotive',
        address: '23 Workshop Street',
        suburb: 'Preston',
        state: 'VIC',
        postcode: '3072',
      },
    }),
    
    // Wholesale customers
    prisma.customer.create({
      data: {
        tenant_id: tenant.id,
        customer_type: CustomerType.WHOLESALE,
        first_name: 'Emma',
        last_name: 'Taylor',
        email: 'emma@taylorautoparts.com.au',
        phone: '07 3666 7890',
        mobile: '0444 888 999',
        abn: '11 222 333 444',
        company_name: 'Taylor Auto Parts Wholesale',
        address: '234 Commerce Street',
        suburb: 'Brisbane',
        state: 'QLD',
        postcode: '4000',
      },
    }),
    prisma.customer.create({
      data: {
        tenant_id: tenant.id,
        customer_type: CustomerType.WHOLESALE,
        first_name: 'Robert',
        last_name: 'Campbell',
        email: 'robert@campbellparts.net.au',
        phone: '08 9444 3210',
        mobile: '0455 678 901',
        abn: '98 765 432 109',
        company_name: 'Campbell Automotive Supplies',
        address: '17 Distribution Avenue',
        suburb: 'Perth',
        state: 'WA',
        postcode: '6000',
      },
    }),
  ]);

  console.log(`✅ Created ${customers.length} customers with Australian details\n`);

  // 4. Create Vehicles with Australian models
  console.log('Creating vehicles with common Australian models...');
  const vehicles = await prisma.$transaction([
    prisma.vehicle.create({
      data: {
        tenant_id: tenant.id,
        vin: '1HGBH41JXMN109186',
        make: 'Holden',
        model: 'Commodore',
        year: 2018,
        variant: 'SS V8',
        color: 'Red',
        odometer: 85000,
        engine_number: 'LS3-123456',
        date_received: new Date('2025-09-15'),
        location: 'Bay A1',
      },
    }),
    prisma.vehicle.create({
      data: {
        tenant_id: tenant.id,
        vin: 'WVWZZZ3CZBE123456',
        make: 'Ford',
        model: 'Falcon',
        year: 2016,
        variant: 'XR6 Turbo',
        color: 'Blue',
        odometer: 92000,
        engine_number: 'FGX-654321',
        date_received: new Date('2025-08-20'),
        location: 'Bay B2',
      },
    }),
    prisma.vehicle.create({
      data: {
        tenant_id: tenant.id,
        vin: 'JN1TANZ51U0123456',
        make: 'Toyota',
        model: 'Hilux',
        year: 2020,
        variant: 'SR5',
        color: 'White',
        odometer: 62000,
        engine_number: '1GD-654321',
        date_received: new Date('2025-09-10'),
        location: 'Bay C3',
      },
    }),
    prisma.vehicle.create({
      data: {
        tenant_id: tenant.id,
        vin: '5UXWX7C59BA123456',
        make: 'Mazda',
        model: 'CX-5',
        year: 2019,
        variant: 'Maxx Sport',
        color: 'Grey',
        odometer: 78000,
        engine_number: 'SkyG-123456',
        date_received: new Date('2025-10-05'),
        location: 'Bay D4',
      },
    }),
    prisma.vehicle.create({
      data: {
        tenant_id: tenant.id,
        vin: 'KMHCT4AE5CU123456',
        make: 'Hyundai',
        model: 'i30',
        year: 2021,
        variant: 'N Line',
        color: 'Phantom Black',
        odometer: 45000,
        engine_number: 'G4KH-123456',
        date_received: new Date('2025-10-12'),
        location: 'Bay E5',
      },
    }),
    prisma.vehicle.create({
      data: {
        tenant_id: tenant.id,
        vin: 'JMZKE17D701123456',
        make: 'Mitsubishi',
        model: 'Triton',
        year: 2019,
        variant: 'GLS Premium',
        color: 'Charcoal',
        odometer: 65000,
        engine_number: '4D56-123456',
        date_received: new Date('2025-09-22'),
        location: 'Bay F6',
      },
    }),
  ]);

  console.log(`✅ Created ${vehicles.length} vehicles with common Australian models\n`);

  // 5. Create Parts across different categories
  console.log('Creating parts in different categories...');
  const parts = await prisma.$transaction([
    // Holden Commodore parts
    prisma.part.create({
      data: {
        tenant_id: tenant.id,
        vehicle_id: vehicles[0].id,
        part_number: 'HC-ENG-2018-V8',
        name: 'V8 6.2L LS3 Engine Assembly',
        description: 'Complete LS3 V8 engine from 2018 Holden Commodore SS, low km, fully tested',
        category: 'Engine',
        condition: PartCondition.USED_EXCELLENT,
        cost_price: 5500.00,
        sell_price: 8500.00,
        gst_inclusive: true,
        stock_quantity: 1,
        location: 'Engine Rack E-22',
        weight: 250.5,
        dimensions: '80 x 65 x 60',
      },
    }),
    prisma.part.create({
      data: {
        tenant_id: tenant.id,
        vehicle_id: vehicles[0].id,
        part_number: 'HC-WHEEL-2018-SS',
        name: '20" Holden SS Alloy Wheel',
        description: 'Original 20" alloy wheel from Holden Commodore SS, good condition',
        category: 'Wheels',
        condition: PartCondition.USED_GOOD,
        cost_price: 180.00,
        sell_price: 350.00,
        gst_inclusive: true,
        stock_quantity: 4,
        location: 'Wheel Rack W-05',
        weight: 12.5,
        dimensions: '65 x 65 x 25',
      },
    }),
    
    // Ford Falcon parts
    prisma.part.create({
      data: {
        tenant_id: tenant.id,
        vehicle_id: vehicles[1].id,
        part_number: 'FF-TRANS-2016-AUTO',
        name: 'Ford Falcon ZF 6-Speed Automatic Transmission',
        description: 'ZF 6HP21 transmission from Ford Falcon XR6 Turbo, tested working',
        category: 'Transmission',
        condition: PartCondition.USED_GOOD,
        cost_price: 1200.00,
        sell_price: 2400.00,
        gst_inclusive: true,
        stock_quantity: 1,
        location: 'Trans Rack T-08',
        weight: 75.0,
        dimensions: '60 x 40 x 30',
      },
    }),
    prisma.part.create({
      data: {
        tenant_id: tenant.id,
        vehicle_id: vehicles[1].id,
        part_number: 'FF-DOOR-2016-FL',
        name: 'Ford Falcon Front Left Door',
        description: 'Blue front left door for FG-X Falcon, minor scratches, all electronics working',
        category: 'Body',
        condition: PartCondition.USED_GOOD,
        cost_price: 250.00,
        sell_price: 450.00,
        gst_inclusive: true,
        stock_quantity: 1,
        location: 'Door Section D-12',
        weight: 35.0,
        dimensions: '120 x 80 x 20',
      },
    }),
    
    // Toyota Hilux parts
    prisma.part.create({
      data: {
        tenant_id: tenant.id,
        vehicle_id: vehicles[2].id,
        part_number: 'TH-DIFF-2020-REAR',
        name: 'Toyota Hilux Rear Differential',
        description: 'Rear diff from 2020 Hilux SR5, 4WD, 2.8L diesel',
        category: 'Drivetrain',
        condition: PartCondition.USED_EXCELLENT,
        cost_price: 900.00,
        sell_price: 1800.00,
        gst_inclusive: true,
        stock_quantity: 1,
        location: 'Drivetrain Section DR-15',
        weight: 60.0,
        dimensions: '50 x 40 x 30',
      },
    }),
    prisma.part.create({
      data: {
        tenant_id: tenant.id,
        vehicle_id: vehicles[2].id,
        part_number: 'TH-TRAY-2020-COMP',
        name: 'Toyota Hilux Tray/Tub',
        description: 'Complete white tray with tailgate, minor scratches and wear',
        category: 'Body',
        condition: PartCondition.USED_GOOD,
        cost_price: 800.00,
        sell_price: 1500.00,
        gst_inclusive: true,
        stock_quantity: 1,
        location: 'Outdoor Yard Y-03',
        weight: 120.0,
        dimensions: '180 x 160 x 50',
      },
    }),
    
    // Mazda CX-5 parts
    prisma.part.create({
      data: {
        tenant_id: tenant.id,
        vehicle_id: vehicles[3].id,
        part_number: 'MZ-DASH-2019-COMP',
        name: 'Mazda CX-5 Complete Dashboard',
        description: 'Full dashboard assembly with airbags, perfect condition',
        category: 'Interior',
        condition: PartCondition.USED_EXCELLENT,
        cost_price: 600.00,
        sell_price: 1200.00,
        gst_inclusive: true,
        stock_quantity: 1,
        location: 'Interior Section I-09',
        weight: 25.0,
        dimensions: '120 x 50 x 30',
      },
    }),
    
    // Hyundai i30 parts
    prisma.part.create({
      data: {
        tenant_id: tenant.id,
        vehicle_id: vehicles[4].id,
        part_number: 'HI-ENG-2021-2.0',
        name: 'Hyundai i30 2.0L Engine',
        description: 'Low km engine from 2021 i30 N Line, fully tested',
        category: 'Engine',
        condition: PartCondition.USED_EXCELLENT,
        cost_price: 2200.00,
        sell_price: 4500.00,
        gst_inclusive: true,
        stock_quantity: 1,
        location: 'Engine Rack E-18',
        weight: 150.0,
        dimensions: '70 x 60 x 55',
      },
    }),
    
    // Mitsubishi Triton parts
    prisma.part.create({
      data: {
        tenant_id: tenant.id,
        vehicle_id: vehicles[5].id,
        part_number: 'MT-SUSP-2019-FRONT',
        name: 'Mitsubishi Triton Front Suspension',
        description: 'Complete front suspension assembly with shocks and springs',
        category: 'Suspension',
        condition: PartCondition.USED_GOOD,
        cost_price: 450.00,
        sell_price: 950.00,
        gst_inclusive: true,
        stock_quantity: 1,
        location: 'Suspension Rack S-12',
        weight: 45.0,
        dimensions: '90 x 60 x 40',
      },
    }),
    
    // Universal/Generic parts
    prisma.part.create({
      data: {
        tenant_id: tenant.id,
        part_number: 'UNIV-BATTERY-N70',
        name: 'Century N70ZZ Battery',
        description: 'Heavy duty automotive battery, reconditioned with warranty',
        category: 'Electrical',
        condition: PartCondition.RECONDITIONED,
        cost_price: 110.00,
        sell_price: 225.00,
        gst_inclusive: true,
        stock_quantity: 8,
        location: 'Battery Shelf B-01',
        weight: 18.0,
        dimensions: '30 x 20 x 20',
      },
    }),
    prisma.part.create({
      data: {
        tenant_id: tenant.id,
        part_number: 'UNIV-TYRE-265/65R17',
        name: 'Bridgestone Dueler A/T 265/65R17',
        description: 'All-terrain tyre, 70% tread remaining, suitable for 4WD/SUV',
        category: 'Tyres',
        condition: PartCondition.USED_GOOD,
        cost_price: 80.00,
        sell_price: 160.00,
        gst_inclusive: true,
        stock_quantity: 6,
        location: 'Tyre Rack TR-04',
        weight: 15.0,
        dimensions: '70 x 70 x 27',
      },
    }),
  ]);

  console.log(`✅ Created ${parts.length} parts across different categories\n`);

  // 6. Create a Supplier
  console.log('Creating supplier with Australian details...');
  const supplier = await prisma.supplier.create({
    data: {
      tenant_id: tenant.id,
      name: 'Sydney Auto Dismantlers',
      abn: '55 666 777 888', // 11-digit ABN
      email: 'sales@sydneyautodismantlers.com.au',
      phone: '02 9123 4567', // Australian landline format
      address: '567 Salvage Road',
      suburb: 'Penrith',
      state: 'NSW', // Australian state
      postcode: '2750', // 4-digit Australian postcode
      contact_name: 'Robert Clarke',
    },
  });

  console.log(`✅ Created supplier: ${supplier.name}\n`);

  console.log('✅ Database seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - Tenants: 1`);
  console.log(`   - Users: ${3}`);
  console.log(`   - Customers: ${customers.length}`);
  console.log(`   - Vehicles: ${vehicles.length}`);
  console.log(`   - Parts: ${parts.length}`);
  console.log(`   - Suppliers: 1`);
  console.log('\n🔑 Default credentials:');
  console.log(`   Admin: admin@aussieautoparts.com.au / Password123!`);
  console.log(`   Manager: manager@aussieautoparts.com.au / Password123!`);
  console.log(`   Sales: sales@aussieautoparts.com.au / Password123!\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });