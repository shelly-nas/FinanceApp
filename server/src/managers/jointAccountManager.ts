import dbContext from '@/context/dbContext';
import JointAccount from '@/models/jointAccountModel';

const table = process.env.TABLE_NAME;

class UserManager {
  public async addMultipleEntries(entries: { date_str: string, name_description: string, account: string, counterparty: string | null, category: string, debit_credit: string, amount: number, transaction_type: string, notifications: string }[]) {
    const client = await dbContext.connect();
    try {
      await client.query('BEGIN');

      for (const entry of entries) {
        await client.query(
          `INSERT INTO ${table} (date_str, name_description, account, counterparty, category, debit_credit, amount, transaction_type, notifications)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [entry.date_str, entry.name_description, entry.account, entry.counterparty, entry.category, entry.debit_credit, entry.amount, entry.transaction_type, entry.notifications]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async getUsers(): Promise<JointAccount[]> {
    const client = await dbContext.connect();
    try {
      const result = await client.query(`SELECT * FROM ${table}`);
      return result.rows.map(row => new JointAccount(row.id, row.date_str, row.name_description, row.account, row.counterparty, row.category, row.debit_credit, row.amount, row.transaction_type, row.notifications));
    } finally {
      client.release();
    }
  }
}

export default new UserManager();
