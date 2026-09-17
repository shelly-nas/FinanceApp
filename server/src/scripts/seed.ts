import 'module-alias/register';
import fs from 'fs/promises';
import path from 'path';
import dbContext from '@/context/dbContext';


async function seed() {
  const file = path.join(__dirname, '..', '..', '..', 'database', 'seed.sql');
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
