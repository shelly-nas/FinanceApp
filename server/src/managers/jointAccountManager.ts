import dbContext from '@/context/dbContext';
import JointAccount from '@/models/jointAccountModel';

const table = process.env.TABLE_NAME;

class UserManager {
  public async addMultipleTransactions(entries: { date_str: string, name_description: string, account: string, counterparty: string | null, debit_credit: string, amount: number, transaction_type: string, notifications: string }[]) {
    const client = await dbContext.connect();
    try {
      await client.query('BEGIN');

      for (const entry of entries) {
        await client.query(
          `INSERT INTO ${table} (date_str, name_description, account, counterparty, debit_credit, amount, transaction_type, notifications)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [entry.date_str, entry.name_description, entry.account, entry.counterparty, entry.debit_credit, entry.amount, entry.transaction_type, entry.notifications]
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

  public async getTransactions(startDate?: string, endDate?: string): Promise<JointAccount[]> {
    const client = await dbContext.connect();
    let query = `SELECT * FROM ${table} WHERE 1=1`;
    const params: any[] = [];

    if (startDate) {
      query += " AND date_str >= $1";
      params.push(startDate);
    }

    if (endDate) {
      query += " AND date_str <= $2";
      params.push(endDate);
    }

    try {
      const result = await client.query(query, params);
      return result.rows.map(row => new JointAccount(row.id, row.date_str, row.name_description, row.account, row.counterparty, row.category, row.debit_credit, row.amount, row.transaction_type, row.notifications));
    } finally {
      client.release();
    }
  }
}

export default new UserManager();
