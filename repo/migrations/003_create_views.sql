DROP VIEW IF EXISTS v_low_stock_products, v_daily_sales_summary CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_product_performance CASCADE;

-- 1. View: Low Stock Products
CREATE OR REPLACE VIEW v_low_stock_products AS
SELECT 
    id AS product_id,
    name,
    sku,
    stock,
    min_stock_level
FROM products
WHERE stock < min_stock_level;

-- 2. View: Daily Sales Summary
CREATE OR REPLACE VIEW v_daily_sales_summary AS
SELECT 
    DATE(created_at) AS sale_date,
    COUNT(id) AS total_orders,
    SUM(total_amount) AS total_revenue
FROM orders
GROUP BY DATE(created_at);

-- 3. Materialized View: Product Performance
CREATE MATERIALIZED VIEW mv_product_performance AS
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.sku,
    COALESCE(SUM(oi.quantity), 0) AS total_quantity_sold,
    COALESCE(SUM(oi.total_price), 0) AS total_revenue_generated
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id, p.name, p.sku;

-- Unique index to allow CONCURRENTLY refreshing
CREATE UNIQUE INDEX idx_mv_product_performance_product_id ON mv_product_performance(product_id);
