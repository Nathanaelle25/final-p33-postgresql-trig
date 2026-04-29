const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkDatabase() {
  try {
    console.log('\n--- TABLES IN YOUR DATABASE ---');
    const tableRes = await pool.query(`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname != 'pg_catalog' 
        AND schemaname != 'information_schema'
    `);
    console.table(tableRes.rows);

    console.log('\n--- SEED DATA: PRODUCTS TABLE ---');
    const productRes = await pool.query('SELECT id, name, sku, price, stock, category FROM products');
    console.table(productRes.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkDatabase();
