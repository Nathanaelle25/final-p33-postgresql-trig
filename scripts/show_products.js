const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function showProducts() {
  try {
    console.log("Fetching products from the database...\n");
    const { rows } = await pool.query('SELECT id, name, stock, min_stock_level, price FROM products');
    console.table(rows);
  } catch (err) {
    console.error("Error fetching products:", err.message);
  } finally {
    pool.end();
  }
}

showProducts();
