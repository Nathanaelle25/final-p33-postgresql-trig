const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runSeed() {
  console.log('Seeding database with products...');
  const filePath = path.join(__dirname, '../migrations/007_seed_data.sql');
  const sql = fs.readFileSync(filePath, 'utf8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // We use ON CONFLICT DO NOTHING to avoid errors if already seeded, 
    // but the original SQL doesn't have it. 
    // Let's just run it and handle the error if needed.
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Successfully seeded database.');
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') { // Unique violation (e.g. SKU already exists)
      console.log('Data already exists, skipping seed.');
    } else {
      console.error('Error during seeding:', err.message);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();
