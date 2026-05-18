const request = require('supertest');
const app = require('../src/index'); // import your actual app
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

describe('Products API', () => {
  test('GET /api/products returns array', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('Reports API', () => {
  test('GET /api/demo/low-stock-view returns array', async () => {
    const res = await request(app).get('/api/demo/low-stock-view');
    expect(res.status).toBe(200);
    // Since the actual API returns { message: "...", data: rows }, check res.body.data
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
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

afterAll(async () => { 
  await pool.end(); 
});
