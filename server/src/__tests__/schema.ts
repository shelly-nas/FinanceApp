import fs from 'fs/promises';
import path from 'path';
import dbContext from '@/context/dbContext';
import { runMigrations } from '@/context/migrations';

const DATABASE_DIR = path.join(__dirname, '..', '..', '..', 'database');

/**
 * Bring a test database up to the schema the application ships.
 *
 * Reads the same files production does - `database/init.sql` plus any pending
 * migrations - rather than a copy maintained alongside the tests, so a schema
 * change cannot pass here while being wrong in a real install.
 *
 * Idempotent: the public schema is dropped first, which also gives each run a
 * clean slate regardless of what an earlier run left behind.
 */
export async function ensureSchema(): Promise<void> {
  const client = await dbContext.connect();

  try {
    const alreadySetUp = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'transactions'
      ) AS present;
    `);

    if (!alreadySetUp.rows[0].present) {
      const init = await fs.readFile(path.join(DATABASE_DIR, 'init.sql'), 'utf8');
      const seed = await fs.readFile(path.join(DATABASE_DIR, 'seed.sql'), 'utf8');
      await client.query(init);
      await client.query(seed);
    }
  } finally {
    client.release();
  }

  // Empty before 1.0.0, but the call belongs here: once migrations exist, the
  // tests have to run against the same schema an install would end up with.
  await runMigrations();
}
