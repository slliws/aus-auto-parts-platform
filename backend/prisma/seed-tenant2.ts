import { PrismaClient, SubscriptionTier, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:postgres@127.0.0.1:5432/auto_parts_platform?schema=public' } }
});

async function main() {
  console.log('Creating second tenant: Melbourne Motor Spares...');

  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'Melbourne Motor Spares Pty Ltd',
      abn: '72 098 765 432',
      email: 'admin@melbmotorspares.com.au',
      phone: '03 9876 5432',
      address: '88 Warehouse Drive, Dandenong VIC 3175',
      subscription_tier: SubscriptionTier.BASIC,
      is_active: true,
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`✅ Tenant 2: ${tenant2.name} (${tenant2.id})`);

  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin2 = await prisma.user.create({
    data: {
      tenant_id: tenant2.id,
      email: 'admin@melbmotorspares.com.au',
      password_hash: passwordHash,
      first_name: 'Karen',
      last_name: 'Mitchell',
      role: UserRole.ADMIN,
      is_active: true,
      email_verified: true,
    },
  });
  console.log(`✅ Admin user: ${admin2.email} (password: Password123!)`);

  // Add a couple of customers to tenant2
  const customer1 = await prisma.customer.create({
    data: {
      tenant_id: tenant2.id,
      first_name: 'Tom',
      last_name: 'Richards',
      email: 'tom.richards@gmail.com',
      phone: '0411 222 333',
      customer_type: 'RETAIL',
      address: '22 Suburb Street',
      suburb: 'Dandenong',
      state: 'VIC',
      postcode: '3175',
      is_active: true,
    },
  });
  console.log(`✅ Customer: ${customer1.first_name} ${customer1.last_name}`);

  // Add a part to tenant2
  const part1 = await prisma.part.create({
    data: {
      tenant_id: tenant2.id,
      part_number: 'MMS-OIL-F001',
      name: 'Penrite HPR 5 Engine Oil 5L',
      description: 'High performance 5W-30 engine oil, suits most Japanese imports',
      condition: 'NEW',
      unit_price: 42.95,
      cost_price: 28.50,
      quantity_on_hand: 48,
      quantity_reserved: 0,
      min_stock_level: 10,
      is_active: true,
    },
  });
  console.log(`✅ Part: ${part1.part_number} @ $${part1.unit_price}`);

  console.log('\n🎉 Second tenant fully seeded!');
  console.log(`   Login: admin@melbmotorspares.com.au / Password123!`);
  console.log(`   Tenant ID: ${tenant2.id}`);
  console.log(`   Subscription: BASIC (vs Tenant 1: PRO)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
