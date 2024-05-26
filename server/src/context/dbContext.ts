import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

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
