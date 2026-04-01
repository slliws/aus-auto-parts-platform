#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Load test environment from correct path
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

const prisma = new PrismaClient();

async function setupTestDatabase() {
  try {
    console.log('Setting up test database...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    // Read migration files and apply them
    const migrationsDir = path.join(__dirname, 'prisma', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(dir => fs.statSync(path.join(migrationsDir, dir)).isDirectory())
      .sort();

    for (const migration of migrationFiles) {
      const migrationFile = path.join(migrationsDir, migration, 'migration.sql');
      if (fs.existsSync(migrationFile)) {
        const sql = fs.readFileSync(migrationFile, 'utf8');
        console.log(`Applying migration: ${migration}`);
        
        // Split SQL by semicolons and execute each statement separately
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
        for (const statement of statements) {
          if (statement.trim()) {
            await prisma.$executeRawUnsafe(statement.trim() + ';');
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

setupTestDatabase();