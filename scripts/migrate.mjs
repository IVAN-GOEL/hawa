import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const password = process.env.SUPABASE_DB_PASSWORD || process.argv[2];

if (!password) {
  console.error('Error: Please provide your database password as an argument or in SUPABASE_DB_PASSWORD.');
  console.error('Usage: node scripts/migrate.mjs <your-database-password>');
  process.exit(1);
}

const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.tbzjvwpfjocydzhtdtjf.supabase.co:5432/postgres`;

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    console.log('Connecting to Supabase PostgreSQL database...');
    await client.connect();
    console.log('Connected successfully!');

    const rootDir = path.resolve(__dirname, '..');
    const initSqlPath = path.join(rootDir, 'supabase', 'migrations', '0001_init.sql');
    const seedSqlPath = path.join(rootDir, 'supabase', 'seed.sql');

    console.log('Applying schema from 0001_init.sql...');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    await client.query(initSql);
    console.log('Schema, views, and parimutuel RPC functions created successfully!');

    console.log('Applying seed data from seed.sql...');
    const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
    await client.query(seedSql);
    console.log('Seed markets and options inserted successfully!');

    console.log('\nMigration complete! Your database is 100% ready.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

run();
