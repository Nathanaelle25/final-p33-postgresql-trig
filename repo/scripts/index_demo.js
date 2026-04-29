
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runIndexDemo() {
  try {
    console.log('--- PREPARING DATA ---');
    // Drop existing index if any
    await pool.query('DROP INDEX IF EXISTS idx_products_name');
    
    // Insert some dummy data to ensure the table isn't empty
    await pool.query(`
      INSERT INTO products (name, sku, price, stock, category) 
      SELECT 'Product ' || i, 'SKU-' || i, (random() * 1000)::numeric(10,2), (random() * 100)::int, 'Category'
      FROM generate_series(1, 1000) s(i)
      ON CONFLICT DO NOTHING;
    `);
    
    console.log('\n--- SCENARIO 1: NO INDEX (SEQUENTIAL SCAN) ---');
    const seqPlan = await pool.query(`
      EXPLAIN (ANALYZE, COSTS OFF)
      SELECT * FROM products WHERE name = 'Product 500';
    `);
    seqPlan.rows.forEach(row => console.log(row['QUERY PLAN']));

    console.log('\n--- CREATING INDEX ---');
    await pool.query('CREATE INDEX idx_products_name ON products(name)');
    console.log('Index created.');

    console.log('\n--- SCENARIO 2: WITH INDEX (INDEX SCAN) ---');
    const indexPlan = await pool.query(`
      EXPLAIN (ANALYZE, COSTS OFF)
      SELECT * FROM products WHERE name = 'Product 500';
    `);
    indexPlan.rows.forEach(row => console.log(row['QUERY PLAN']));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

runIndexDemo();
