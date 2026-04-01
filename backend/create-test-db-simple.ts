import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

const prisma = new PrismaClient();

async function createTestDatabase() {
  try {
    console.log('Creating test database...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    // First create the database by connecting to postgres and running CREATE DATABASE
    const adminPrisma = new PrismaClient({
      datasources: {
        db: {
          url: 'postgresql://postgres:password@localhost:5432/postgres?schema=public'
        }
      }
    });
    
    // Create the database
    await adminPrisma.$executeRawUnsafe('CREATE DATABASE auto_parts_platform_test');
    console.log('Test database created successfully!');
    
    // Now apply migrations to the test database
    const testPrisma = new PrismaClient();
    
    // Read and apply the first migration
    const fs = await import('fs');
    const migrationPath = path.join(__dirname, 'prisma', 'migrations', '20251027082209_autoapp', 'migration.sql');
    
    if (fs.existsSync(migrationPath)) {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      console.log('Applying migration: 20251027082209_autoapp');
      
      // Split SQL by semicolons and execute each statement separately
      const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await testPrisma.$executeRawUnsafe(statement.trim() + ';');
          } catch (error) {
            // Skip if statement fails (e.g., type already exists)
            console.log(`Statement skipped: ${statement.substring(0, 50)}...`);
          }
        }
      }
    }
    
    console.log('Test database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestDatabase();