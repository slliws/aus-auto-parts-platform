import { PrismaClient, UserRole, PartCondition, OrderStatus, QuoteStatus, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo data...');

  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error('No tenant — run main seed first');
  const adminUser = await prisma.user.findFirst({ where: { role: UserRole.ADMIN, tenant_id: tenant.id } });
  if (!adminUser) throw new Error('No admin user');

  // Clear existing
  await prisma.orderItem.deleteMany({ where: { order: { tenant_id: tenant.id } } });
  await prisma.order.deleteMany({ where: { tenant_id: tenant.id } });
  await prisma.quoteItem.deleteMany({ where: { quote: { tenant_id: tenant.id } } });
  await prisma.quote.deleteMany({ where: { tenant_id: tenant.id } });

  const customers = await prisma.customer.findMany({ where: { tenant_id: tenant.id } });
  const parts = await prisma.part.findMany({ where: { tenant_id: tenant.id } });

  // ── Quotes ────────────────────────────────────────
  const quoteCfg = [
    { daysAgo: 10, status: QuoteStatus.ACCEPTED },
    { daysAgo: 6,  status: QuoteStatus.SENT },
    { daysAgo: 4,  status: QuoteStatus.SENT },
    { daysAgo: 2,  status: QuoteStatus.DRAFT },
    { daysAgo: 1,  status: QuoteStatus.ACCEPTED },
  ];

  const createdQuotes = [];
  for (let i = 0; i < quoteCfg.length; i++) {
    const { daysAgo, status } = quoteCfg[i];
    const customer = customers[i % customers.length];
    const p1 = parts[i % parts.length];
    const p2 = parts[(i + 2) % parts.length];
    const subtotal = Number(p1.sell_price) * 2 + Number(p2.sell_price);
    const gst = Math.round(subtotal * 0.1 * 100) / 100;
    const total = Math.round((subtotal + gst) * 100) / 100;
    const createdAt = new Date(Date.now() - daysAgo * 86400000);

    const quote = await prisma.quote.create({
      data: {
        tenant_id: tenant.id,
        customer_id: customer.id,
        user_id: adminUser.id,
        quote_number: `Q-2025-${1000 + i}`,
        status,
        subtotal_amount: subtotal,
        gst_amount: gst,
        total_amount: total,
        expires_at: new Date(Date.now() + 14 * 86400000),
        notes: 'GST included. 6-month warranty per ACL.',
        ...(status === QuoteStatus.ACCEPTED ? { accepted_at: createdAt } : {}),
        ...(status === QuoteStatus.SENT ? { sent_at: createdAt } : {}),
        created_at: createdAt,
        quote_items: {
          create: [
            { part_id: p1.id, quantity: 2, unit_price: p1.sell_price, total_price: Number(p1.sell_price) * 2, gst_amount: Number(p1.sell_price) * 2 * 0.1 },
            { part_id: p2.id, quantity: 1, unit_price: p2.sell_price, total_price: p2.sell_price,             gst_amount: Number(p2.sell_price) * 0.1 },
          ]
        }
      }
    });
    createdQuotes.push(quote);
    console.log(`✅ Quote ${quote.quote_number} [${status}] $${total}`);
  }

  // ── Orders ────────────────────────────────────────
  const orderCfg = [
    { daysAgo: 14, status: OrderStatus.DELIVERED,  payment: PaymentStatus.PAID,    quoteIdx: 0 },
    { daysAgo: 8,  status: OrderStatus.SHIPPED,     payment: PaymentStatus.PAID,    quoteIdx: 4 },
    { daysAgo: 3,  status: OrderStatus.PROCESSING,  payment: PaymentStatus.PAID,    quoteIdx: null },
    { daysAgo: 1,  status: OrderStatus.PENDING,     payment: PaymentStatus.PENDING, quoteIdx: null },
  ];

  for (let i = 0; i < orderCfg.length; i++) {
    const { daysAgo, status, payment, quoteIdx } = orderCfg[i];
    const customer = customers[(i + 1) % customers.length];
    const p1 = parts[(i + 3) % parts.length];
    const p2 = parts[(i + 5) % parts.length];
    const subtotal = Number(p1.sell_price) + Number(p2.sell_price) * 2;
    const gst = Math.round(subtotal * 0.1 * 100) / 100;
    const total = Math.round((subtotal + gst) * 100) / 100;
    const createdAt = new Date(Date.now() - daysAgo * 86400000);
    const linkedQuote = quoteIdx !== null ? createdQuotes[quoteIdx] : null;

    const order = await prisma.order.create({
      data: {
        tenant_id: tenant.id,
        customer_id: customer.id,
        user_id: adminUser.id,
        ...(linkedQuote ? { quote_id: linkedQuote.id } : {}),
        order_number: `ORD-2025-${5000 + i}`,
        status,
        payment_status: payment,
        subtotal_amount: subtotal,
        gst_amount: gst,
        total_amount: total,
        notes: 'Packed and dispatched from Parramatta warehouse.',
        created_at: createdAt,
        order_items: {
          create: [
            { part_id: p1.id, quantity: 1, unit_price: p1.sell_price, total_price: p1.sell_price, gst_amount: Number(p1.sell_price) * 0.1 },
            { part_id: p2.id, quantity: 2, unit_price: p2.sell_price, total_price: Number(p2.sell_price) * 2, gst_amount: Number(p2.sell_price) * 2 * 0.1 },
          ]
        }
      }
    });
    console.log(`✅ Order ${order.order_number} [${status}] $${total}`);
  }

  console.log('\n🎉 Demo data ready!');
  const qCount = await prisma.quote.count({ where: { tenant_id: tenant.id } });
  const oCount = await prisma.order.count({ where: { tenant_id: tenant.id } });
  console.log(`   Quotes: ${qCount}  Orders: ${oCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
