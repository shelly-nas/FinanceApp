import dbContext from '@/context/dbContext';
import Transactions from '@/models/financeModel';

const category_table = "categories"
const transaction_table = "transactions";
const account_table = "accounts";
const investment_table = "investments";

class FinanceManager {
  public async addTransactions(entries: { date_str: string, name_description: string, account: string, counterparty: string | null, debit_credit: string | undefined, amount: number, notifications: string | null }[]): Promise<number[]> {
    const client = await dbContext.connect();
    const createdIds: number[] = [];
  
    try {
      await client.query('BEGIN');
  
      for (const entry of entries) {
        try {
          const result = await client.query(
            `INSERT INTO ${transaction_table} (date_str, name_description, account, counterparty, debit_credit, amount, notifications)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [entry.date_str, entry.name_description, entry.account, entry.counterparty, entry.debit_credit, entry.amount, entry.notifications]
          );
  
          const insertedId = result.rows[0].id;
          createdIds.push(insertedId);
          console.log('Inserted entry ID:', insertedId);
        } catch (insertError) {
          console.error('Error inserting entry:', entry, insertError);
          throw insertError;
        }
      }
  
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction rolled back due to error:', error);
      throw error;
    } finally {
      client.release();
    }
  
    return createdIds;
  }
  
  public async getTransactions(startDate?: string, endDate?: string): Promise<Transactions[]> {
    const client = await dbContext.connect();
    let query = `SELECT * FROM ${transaction_table} WHERE 1=1`;
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
        public.${transaction_table} ja
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
            public.${transaction_table} ja
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

  public async getEmptyCategoryTransactions(): Promise<any[]> {
    const client = await dbContext.connect();

    let query = `
      SELECT *
      FROM ${transaction_table}
      WHERE category IS NULL;
    `;

    try {
      const result = await client.query(query);
      return result.rows;
    } finally {
      client.release();
    }
  }

  public async updateTransaction(id: string, updates: { [key: string]: any }): Promise<any> {
    const client = await dbContext.connect();
  
    // Constructing the set clause of the update query dynamically
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
  
    const values = Object.values(updates);
  
    let query = `
      UPDATE ${transaction_table}
      SET ${setClause}
      WHERE id = $${values.length + 1}
      RETURNING *;
    `;

    try {
      const result = await client.query(query, [...values, id]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  public async getAccountOverview(): Promise<any> {
    const client = await dbContext.connect();

    let query = `
      SELECT 
        ${account_table}.account_type, 
        ${account_table}.account_name, 
      COALESCE(
        CASE
          WHEN ${account_table}.account_type IN ('Checking Account', 'Savings Account') THEN (
            SELECT ${account_table}.balance_when_created + COALESCE(SUM(
              CASE 
                WHEN ${transaction_table}.debit_credit = 'Debit' THEN -${transaction_table}.amount
                WHEN ${transaction_table}.debit_credit = 'Credit' THEN ${transaction_table}.amount
                ELSE 0
              END
            ), 0)
            FROM ${transaction_table}
            WHERE ${transaction_table}.account = ${account_table}.details
          )
          WHEN ${account_table}.account_type = 'Investments' THEN (
            SELECT ${investment_table}.balance
            FROM ${investment_table}
            WHERE ${investment_table}.account = ${account_table}.details
            ORDER BY ${investment_table}.date_str DESC
            LIMIT 1
          )
          ELSE ${account_table}.balance_when_created
        END,
        ${account_table}.balance_when_created
      ) AS current_balance
    FROM ${account_table};
    `;
    
    try {
      const result = await client.query(query);
      return result.rows;
    } finally {
      client.release();
    }
  }

}

export default new FinanceManager();
