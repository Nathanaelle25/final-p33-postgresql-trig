const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir).sort();
  const sqlFiles = files.filter(f => f.endsWith('.sql'));

  for (const file of sqlFiles) {
    console.log(`Running migration: ${file}`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`Successfully completed: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`Error in migration ${file}:`, err);
      process.exit(1);
    } finally {
      client.release();
    }
  }
  await pool.end();
  console.log('All migrations completed successfully.');
}

runMigrations();
