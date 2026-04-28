const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
