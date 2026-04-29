
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runDemo() {
  try {
    console.log('--- INSERTING SAMPLE DATA ---');
    await pool.query(`
      INSERT INTO stock_movements (product_id, movement_type, quantity, reference_info, created_at)
      VALUES 
      (1, 'IN', 100, 'April Stock In', '2026-04-15 10:00:00'),
      (1, 'OUT', 20, 'April Order', '2026-04-20 14:00:00'),
      (2, 'IN', 50, 'May Stock In', '2026-05-05 09:00:00');
    `);
    console.log('Data inserted successfully.');

    console.log('\n--- EXPLAIN ANALYZE: SCANNING APRIL ONLY ---');
    const aprilPlan = await pool.query(`
      EXPLAIN (ANALYZE, COSTS OFF)
      SELECT * FROM stock_movements 
      WHERE created_at >= '2026-04-01' AND created_at < '2026-05-01';
    `);
    aprilPlan.rows.forEach(row => console.log(row['QUERY PLAN']));

    console.log('\n--- EXPLAIN ANALYZE: SCANNING MAY ONLY ---');
    const mayPlan = await pool.query(`
      EXPLAIN (ANALYZE, COSTS OFF)
      SELECT * FROM stock_movements 
      WHERE created_at >= '2026-05-01' AND created_at < '2026-06-01';
    `);
    mayPlan.rows.forEach(row => console.log(row['QUERY PLAN']));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

runDemo();
