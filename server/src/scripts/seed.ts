import 'module-alias/register';
import fs from 'fs/promises';
import path from 'path';
import dbContext from '@/context/dbContext';

// Seeds the category reference data. Separate from the migrations because it is
// data rather than schema: a user who has renamed or recoloured categories
// should not have that undone by a deploy.
async function seed() {
  const file = path.join(__dirname, '..', '..', 'migrations', 'seed_categories.sql');
  const sql = await fs.readFile(file, 'utf8');
  const client = await dbContext.connect();

  try {
    const before = await client.query('SELECT COUNT(*)::int AS n FROM public.categories');
    await client.query(sql);
    const after = await client.query('SELECT COUNT(*)::int AS n FROM public.categories');
    console.log(`Categories: ${before.rows[0].n} before, ${after.rows[0].n} after.`);
  } finally {
    client.release();
    await dbContext.pool.end();
  }
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
