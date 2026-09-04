import fs from 'fs/promises';
import path from 'path';
import dbContext from '@/context/dbContext';

// Migrations live as plain .sql files next to the compiled output. They run in
// filename order on every boot; the schema_migrations table records which ones
// already ran, so a restart is a no-op and an existing database picks up only
// what it is missing.
//
// The directory is empty until 1.0.0 ships: with no installed database to
// migrate from, the schema is created in one go by database/init.sql, which the
// postgres image runs on the first start of an empty volume. After that the
// entrypoint is never re-run, so every later schema change belongs here.
const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

async function ensureMigrationsTable(client: any): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

// Migrations are numbered; anything else in the directory is not one. The
// category seed lives alongside them but is data rather than schema, and is run
// deliberately via `npm run seed` instead of on every boot.
const MIGRATION_FILE = /^\d{3}_.*\.sql$/;

async function readMigrationFiles(): Promise<string[]> {
  try {
    const files = await fs.readdir(MIGRATIONS_DIR);
    return files.filter((f) => MIGRATION_FILE.test(f)).sort();
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      console.warn(`No migrations directory at ${MIGRATIONS_DIR}, skipping.`);
      return [];
    }
    throw error;
  }
}

export async function runMigrations(): Promise<void> {
  const client = await dbContext.connect();

  try {
    await ensureMigrationsTable(client);

    const applied = await client.query('SELECT filename FROM public.schema_migrations');
    const appliedSet = new Set<string>(applied.rows.map((r: any) => r.filename));
    const files = await readMigrationFiles();
    const pending = files.filter((f) => !appliedSet.has(f));

    if (files.length === 0) {
      // Expected before 1.0.0: the schema comes from database/init.sql.
      console.log('No migrations to apply.');
      return;
    }

    if (pending.length === 0) {
      console.log(`Database up to date (${files.length} migrations applied).`);
      return;
    }

    for (const filename of pending) {
      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, filename), 'utf8');

      // Each migration is its own transaction: a failure rolls that file back
      // and leaves it unrecorded, so the next boot retries it rather than
      // skipping past a half-applied change.
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO public.schema_migrations (filename) VALUES ($1)', [filename]);
        await client.query('COMMIT');
        console.log(`Applied migration ${filename}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${filename} failed: ${error}`);
      }
    }
  } finally {
    client.release();
  }
}
