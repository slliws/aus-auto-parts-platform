-- Check row counts for all tables
SELECT 'User' as table_name, COUNT(*) as row_count FROM "User"
UNION ALL
SELECT 'Tenant', COUNT(*) FROM "Tenant"
UNION ALL
SELECT 'Customer', COUNT(*) FROM "Customer"
UNION ALL
SELECT 'Vehicle', COUNT(*) FROM "Vehicle"
UNION ALL
SELECT 'Part', COUNT(*) FROM "Part"
UNION ALL
SELECT 'Order', COUNT(*) FROM "Order"
UNION ALL
SELECT 'Payment', COUNT(*) FROM "Payment"
ORDER BY table_name;

-- Check User details
SELECT id, email, role, is_active, created_at FROM "User";