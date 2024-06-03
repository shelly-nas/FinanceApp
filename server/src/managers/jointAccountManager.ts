import dbContext from '@/context/dbContext';
import Transactions from '@/models/jointAccountModel';

const category_table = "categories"
const account_table = "transactions";

class UserManager {
  public async addMultipleTransactions(entries: { date_str: string, name_description: string, account: string, counterparty: string | null, debit_credit: string, amount: number, transaction_type: string, notifications: string }[]) {
    const client = await dbContext.connect();
    try {
      await client.query('BEGIN');

      for (const entry of entries) {
        await client.query(
          `INSERT INTO ${account_table} (date_str, name_description, account, counterparty, debit_credit, amount, transaction_type, notifications)
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

  public async getTransactions(startDate?: string, endDate?: string): Promise<Transactions[]> {
    const client = await dbContext.connect();
    let query = `SELECT * FROM ${account_table} WHERE 1=1`;
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
      return result.rows;
    } finally {
      client.release();
    }
  }

  public async getCategorySums(startDate?: string, endDate?: string): Promise<any[]> {
    const client = await dbContext.connect();
    const params: any[] = [];

    let query = `
      SELECT 
        ja.category::text,
        SUM(
            CASE 
                WHEN ja.debit_credit = 'Debit' THEN -ja.amount::numeric 
                WHEN ja.debit_credit = 'Credit' THEN ja.amount::numeric
                ELSE 0 
            END
        ) AS total_amount,
        c.color::text
      FROM 
        public.${account_table} ja
      JOIN
        public.${category_table} c ON ja.category = c.category_name
      WHERE 
        1=1
    `;

    if (startDate) {
      query += " AND ja.date_str >= $1";
      params.push(startDate);
    }

    if (endDate) {
      query += " AND ja.date_str <= $2";
      params.push(endDate);
    }

    query += `
      GROUP BY 
        ja.category, c.color
      LIMIT 1000;
    `;

    try {
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  public async getIncomeExpensesSum(startDate?: string, endDate?: string): Promise<any[]> {
    const client = await dbContext.connect();
    const params: any[] = [];

    let query = `
      WITH categorized_transactions AS (
        SELECT
            ja.category,
            ja.debit_credit,
            CASE
                WHEN ja.debit_credit = 'Debit' THEN -ja.amount
                ELSE ja.amount
            END AS adjusted_amount,
            c.category_type
        FROM
            public.${account_table} ja
        JOIN
            public.${category_table} c
        ON
            ja.category = c.category_name
        WHERE
            c.category_type IN ('Vast', 'Variabel')
    `;

    if (startDate) {
      query += " AND ja.date_str >= $1";
      params.push(startDate);
    }

    if (endDate) {
      query += " AND ja.date_str <= $2";
      params.push(endDate);
    }

    query += `
      )
      SELECT 
          category_type::text,
          SUM(CASE WHEN category LIKE '%Inkomen%' THEN adjusted_amount::numeric ELSE 0::numeric END) AS income,
          SUM(CASE WHEN category NOT LIKE '%Inkomen%' THEN -adjusted_amount::numeric ELSE 0::numeric END) AS expenses
      FROM
          categorized_transactions
      GROUP BY
          category_type
      ORDER BY
          category_type
    `;

    try {
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
}


export default new UserManager();
