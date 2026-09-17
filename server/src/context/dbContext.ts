import { Pool, types } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Postgres OID 1082 is DATE. By default pg turns it into a JavaScript Date at
// local midnight, which JSON then serialises as UTC: a row stored as 2026-08-05
// reaches the browser as "2026-08-04T22:00:00.000Z" in Amsterdam, a day early.
// At a month boundary that files a transaction in the wrong month.
//
// A DATE has no time and no zone, so it is kept as the plain 'YYYY-MM-DD' string
// Postgres sends - which is also the shape the client formats and compares.
types.setTypeParser(types.builtins.DATE, (value: string) => value);

class DbContext {
  public pool: Pool;

  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT!),
    });
  }

  public async connect() {
    return this.pool.connect();
  }
}

export default new DbContext();
