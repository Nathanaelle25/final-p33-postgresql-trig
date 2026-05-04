const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..'))); // Serve static files from repo directory

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// GET /api/products : Include a text search query parameter using the full-text search index.
app.get('/api/products', async (req, res) => {
  const { search } = req.query;
  try {
    let query = 'SELECT * FROM products';
    const values = [];
    
    if (search) {
      query += ` WHERE search_vector @@ plainto_tsquery('english', $1)`;
      query += ` ORDER BY ts_rank(search_vector, plainto_tsquery('english', $1)) DESC`;
      values.push(search);
    }
    
    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/:id
app.get('/api/products/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products
app.post('/api/products', async (req, res) => {
  const { name, sku, price, stock, category } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO products (name, sku, price, stock, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, sku, price, stock, category]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/products/:id
app.put('/api/products/:id', async (req, res) => {
  const { name, price, stock, category } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE products SET name = $1, price = $2, stock = $3, category = $4 WHERE id = $5 RETURNING *',
      [name, price, stock, category, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/products/:id
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Product not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST /api/orders : Call sp_create_order and return detailed order summary
app.post('/api/orders', async (req, res) => {
  const { customer_name, items } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Call the procedure
    await client.query('CALL sp_create_order($1, $2)', [customer_name, JSON.stringify(items)]);
    
    // Get the latest order ID for this customer
    const orderResult = await client.query(
      'SELECT id, total_amount, created_at FROM orders WHERE customer_name = $1 ORDER BY created_at DESC LIMIT 1',
      [customer_name]
    );
    const order = orderResult.rows[0];
    
    // Get the items and updated stock for those products
    const itemsResult = await client.query(
      `SELECT oi.product_id, p.name, oi.quantity, oi.unit_price, p.stock as current_stock
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [order.id]
    );
    
    await client.query('COMMIT');

    res.status(201).json({
      message: 'Order created successfully',
      order_id: order.id,
      total_amount: order.total_amount,
      created_at: order.created_at,
      items: itemsResult.rows
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order creation error:', err.message);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/reports/trend : Query the v_sales_trend_30days view.
app.get('/api/reports/trend', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_sales_trend_30days');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports/daily-sales : Query the v_daily_sales_summary view.
app.get('/api/reports/daily-sales', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_daily_sales_summary ORDER BY sale_date DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts : Query the alerts table.
app.get('/api/alerts', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM alerts ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/audit-log : Query the audit_log table.
app.get('/api/audit-log', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM audit_log ORDER BY changed_at DESC LIMIT 50');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products/:id/restock : Increase stock for a product.
app.post('/api/products/:id/restock', async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid quantity' });
  }
  try {
    const { rows } = await pool.query(
      'UPDATE products SET stock = stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [quantity, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/demo/isolation : explicit BEGIN SERIALIZABLE, read low stock view, COMMIT
app.get('/api/demo/isolation', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
    const { rows } = await client.query('SELECT * FROM v_low_stock_products');
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));
    await client.query('COMMIT');
    res.json({ 
      message: 'ACID Guarantee: Serializable transaction ensured no concurrent updates affected this view during the read.',
      isolation_level: 'SERIALIZABLE',
      data: rows 
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /api/demo/performance : Compare Index vs Sequential Scan
app.get('/api/demo/performance', async (req, res) => {
  try {
    const results = {};
    
    // 1. Drop index
    await pool.query('DROP INDEX IF EXISTS idx_products_name');
    
    // 2. Explan Seq Scan
    const seq = await pool.query("EXPLAIN (ANALYZE, COSTS OFF, FORMAT JSON) SELECT * FROM products WHERE name = 'Product 500'");
    results.sequential_scan = seq.rows[0]['QUERY PLAN'][0];
    
    // 3. Create index
    await pool.query('CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)');
    
    // 4. Explain Index Scan
    const idx = await pool.query("EXPLAIN (ANALYZE, COSTS OFF, FORMAT JSON) SELECT * FROM products WHERE name = 'Product 500'");
    results.index_scan = idx.rows[0]['QUERY PLAN'][0];
    
    res.json({
      message: "Performance Optimization: Comparing Sequential Scan (No Index) vs Index Scan.",
      results
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/demo/partitioning : Show partition pruning
app.get('/api/demo/partitioning', async (req, res) => {
  try {
    const plan = await pool.query(`
      EXPLAIN (ANALYZE, COSTS OFF, FORMAT JSON)
      SELECT * FROM stock_movements 
      WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
    `);
    res.json({
      message: "Partitioning Demo: Querying only the current month's partition.",
      query_plan: plan.rows[0]['QUERY PLAN'][0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/demo/seed-sales : Generate random sales for last 30 days
app.post('/api/demo/seed-sales', async (req, res) => {
  try {
    await pool.query(`
      INSERT INTO orders (customer_name, status, total_amount, created_at)
      SELECT 
        'Bulk Seed ' || i, 
        'COMPLETED', 
        (random() * 500 + 50)::numeric(10,2),
        CURRENT_DATE - (i % 30 || ' days')::interval
      FROM generate_series(1, 100) s(i);
    `);
    res.json({ message: "30 days of sales data generated successfully for analytics demo." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/demo/low-stock-view : Show low stock products view
app.get('/api/demo/low-stock-view', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_low_stock_products');
    res.json({
      message: "View Demo: Displaying products that fell below minimum stock level (Triggers also fire alerts for these).",
      data: rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = app;
