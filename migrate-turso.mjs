import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const url = process.env.DATABASE_URL;

if (!url || !url.startsWith('libsql://')) {
  console.error("❌ ERROR: DATABASE_URL must start with 'libsql://' to migrate to Turso.");
  console.log("Current value:", url);
  process.exit(1);
}

const client = createClient({
  url: process.env.DATABASE_URL,
});

async function runMigration() {
  console.log("🚀 Starting migration to Turso...");
  
  try {
    // 1. Locate the migration file
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
        throw new Error("No prisma/migrations directory found. Run 'npx prisma migrate dev' locally first.");
    }

    const folders = fs.readdirSync(migrationsDir).filter(f => fs.lstatSync(path.join(migrationsDir, f)).isDirectory());
    // Sort by name to get the latest or run all. For the first time, we just need 'init'.
    const initFolder = folders.find(f => f.includes('_init'));

    if (!initFolder) {
      throw new Error("Could not find an 'init' migration folder.");
    }

    const sqlPath = path.join(migrationsDir, initFolder, 'migration.sql');
    console.log(`Reading SQL from: ${initFolder}`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // 2. Split SQL into statements
    // This is a basic split; Prisma migrations are usually clean enough for this.
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute.`);

    // 3. Execute on Turso
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await client.execute(statement);
    }

    console.log("✅ SUCCESS: Database schema applied to Turso!");
  } catch (err) {
    console.error("❌ MIGRATION FAILED:");
    console.error(err.message);
  } finally {
    client.close();
  }
}

runMigration();
