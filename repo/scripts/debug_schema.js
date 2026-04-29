const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT schemaname, tablename FROM pg_catalog.pg_tables WHERE tablename IN ('products', 'orders', 'alerts')").then(res => {
    console.table(res.rows);
    pool.end();
}).catch(err => {
    console.error(err);
    pool.end();
});
