import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Prisma client instance
const prisma = new PrismaClient();

/**
 * Database Connection Test Script
 * 
 * This script tests connection to the PostgreSQL database,
 * logs connection details, and shows entity counts for
 * the Australian Auto Parts Sales Platform.
 * 
 * Run with: npx ts-node test-database.ts
 */
async function testConnection() {
  console.log('\n===== DATABASE CONNECTION TEST =====');
  console.log('Attempting to connect to database...');

  try {
    // Test connection with a simple query
    const result = await prisma.$queryRaw`SELECT current_database(), current_user, version()`;
    const dbInfo = result[0];

    console.log('\n✅ Connection successful!');
    console.log('Database details:');
    console.log(`  Database: ${dbInfo.current_database}`);
    console.log(`  User: ${dbInfo.current_user}`);
    console.log(`  PostgreSQL Version: ${dbInfo.version.split(',')[0]}`);
    
    // Get connection URL (with password masked)
    const dbUrl = process.env.DATABASE_URL ? 
      process.env.DATABASE_URL.replace(/(postgresql:\/\/[^:]+:)([^@]+)(@.*)/, '$1*****$3') : 
      'Not configured';
    
    console.log(`  Connection URL: ${dbUrl}`);

    // Test entity counts
    await countEntities();
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error details:');
    
    if (error instanceof Error) {
      console.error(`  Message: ${error.message}`);
      console.error(`  Stack: ${error.stack}`);
    } else {
      console.error(error);
    }
    
    console.log('\nTroubleshooting steps:');
    console.log('1. Ensure PostgreSQL is running');
    console.log('2. Verify DATABASE_URL in .env file is correct');
    console.log('3. Check that the database exists:');
    console.log('   - psql -U postgres -c "SELECT datname FROM pg_database WHERE datname = \'auto_parts_platform\';"');
    console.log('4. Ensure your Prisma schema is properly migrated:');
    console.log('   - npx prisma migrate deploy');
    console.log('5. Check network connectivity if using a remote database');
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Count entities in each table
 */
async function countEntities() {
  console.log('\n===== ENTITY COUNTS =====');

  try {
    // Count entities in each table
    const tenantCount = await prisma.tenant.count();
    const userCount = await prisma.user.count();
    const customerCount = await prisma.customer.count();
    const vehicleCount = await prisma.vehicle.count();
    const partCount = await prisma.part.count();
    const supplierCount = await prisma.supplier.count();
    
    // Group counts by customer type
    const retailCustomerCount = await prisma.customer.count({
      where: { customer_type: 'RETAIL' }
    });
    
    const tradeCustomerCount = await prisma.customer.count({
      where: { customer_type: 'TRADE' }
    });
    
    const wholesaleCustomerCount = await prisma.customer.count({
      where: { customer_type: 'WHOLESALE' }
    });

    // Log results in a table format
    console.log('Entity counts in database:');
    console.log('-------------------------');
    console.log(`Tenants:          ${tenantCount}`);
    console.log(`Users:            ${userCount}`);
    console.log(`Customers:        ${customerCount}`);
    console.log(`  - Retail:       ${retailCustomerCount}`);
    console.log(`  - Trade:        ${tradeCustomerCount}`);
    console.log(`  - Wholesale:    ${wholesaleCustomerCount}`);
    console.log(`Vehicles:         ${vehicleCount}`);
    console.log(`Parts:            ${partCount}`);
    console.log(`Suppliers:        ${supplierCount}`);
    
    // Sample part categories
    const partCategories = await prisma.part.groupBy({
      by: ['category'],
      _count: true
    });
    
    if (partCategories.length > 0) {
      console.log('\nPart Categories:');
      console.log('-------------------------');
      partCategories.forEach(cat => {
        console.log(`${cat.category.padEnd(20)} ${cat._count}`);
      });
    }

    // Database check result
    if (tenantCount === 0 && userCount === 0 && customerCount === 0 && vehicleCount === 0 && partCount === 0) {
      console.log('\n⚠️ Database appears to be empty. You may want to run:');
      console.log('   npm run db:seed');
    } else {
      console.log('\n✅ Database contains data');
    }
    
  } catch (error) {
    console.error('\n❌ Error counting entities:');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    
    console.log('\nThis may indicate that the database schema is not properly migrated.');
    console.log('Try running: npm run db:migrate');
  }
}

// Execute test
testConnection().catch(e => {
  console.error('Unhandled error in test script:', e);
  process.exit(1);
});