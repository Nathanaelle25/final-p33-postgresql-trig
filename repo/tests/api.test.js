const request = require('supertest');
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

// Re-create app inline for testing (avoids server.listen conflict)
const app = express();
app.use(express.json());
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get('/api/products', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reports/low-stock', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_low_stock_products');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reports/trend', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_sales_trend_30days');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/orders', async (req, res) => {
  const { customer_name, items } = req.body;
  try {
    await pool.query('CALL sp_create_order($1, $2)', [customer_name, JSON.stringify(items)]);
    res.status(201).json({ message: 'Order created successfully' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

describe('Products API', () => {
  test('GET /api/products returns array', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('Reports API', () => {
  test('GET /api/reports/low-stock returns array', async () => {
    const res = await request(app).get('/api/reports/low-stock');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/reports/trend returns array', async () => {
    const res = await request(app).get('/api/reports/trend');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('Orders API', () => {
  test('POST /api/orders with bad stock returns 400', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ customer_name: 'Test', items: [{ product_id: 99999, quantity: 9999 }] });
    expect(res.status).toBe(400);
  });
});

afterAll(async () => { await pool.end(); });
