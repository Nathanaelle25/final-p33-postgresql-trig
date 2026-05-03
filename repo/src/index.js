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


// POST /api/orders : Call sp_create_order, catch SQL exception and return 400
app.post('/api/orders', async (req, res) => {
  const { customer_name, items } = req.body;
  try {
    // items should be an array of objects e.g. [{"product_id": 1, "quantity": 2}]
    await pool.query('CALL sp_create_order($1, $2)', [customer_name, JSON.stringify(items)]);
    res.status(201).json({ message: 'Order created successfully' });
  } catch (err) {
    console.error('Order creation error:', err.message);
    res.status(400).json({ error: err.message });
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
    await client.query('COMMIT');
    res.json({ message: 'Serializable transaction successful', data: rows });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = app;
