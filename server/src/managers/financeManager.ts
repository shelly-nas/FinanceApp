import dbContext from '@/context/dbContext';
import Transactions from '@/models/financeModel';

const category_table = "categories"
const transaction_table = "transactions";
const account_table = "accounts";
const investment_table = "investments";
const tag_table = "tags";
const transaction_tag_table = "transaction_tags";

class FinanceManager {
  public async addTransactions(entries: { date_str: string, name_description: string, account: string, counterparty: string | null, category: string | null, debit_credit: string | undefined, amount: number, notifications: string | null }[]): Promise<number[]> {
    const client = await dbContext.connect();
    const createdIds: number[] = [];

    try {
      await client.query('BEGIN');
  
      for (const entry of entries) {
        entry.category = entry.category === 'null' ? null : entry.category;
        const result = await client.query(
          `INSERT INTO ${transaction_table} (date_str, name_description, account, counterparty, category, debit_credit, amount, notifications)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [entry.date_str, entry.name_description, entry.account, entry.counterparty, entry.category, entry.debit_credit, entry.amount, entry.notifications]
        );

        const insertedId = result.rows[0].id;
        createdIds.push(insertedId);
      }
  
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  
    return createdIds;
  }
  
  public async getTransactions(startDate?: string, endDate?: string, ids?: number[]): Promise<Transactions[]> {
    const client = await dbContext.connect();
    let query = `SELECT * FROM public.${transaction_table} WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;
  
    if (startDate) {
      query += ` AND date_str >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
  
    if (endDate) {
      query += ` AND date_str <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
  
    if (ids && ids.length > 0) {
      const placeholders = ids.map((_, index) => `$${paramIndex + index}`).join(', ');
      query += ` AND id IN (${placeholders})`;
      params.push(...ids);
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
          SUM(
            CASE
              WHEN ja.debit_credit = 'Debit' THEN -ja.amount
              ELSE ja.amount
            END
            ) AS total_adjusted_amount,
            CASE 
              WHEN c.income_outcome = 'Uitgaven' AND SUM(
                CASE
                  WHEN ja.debit_credit = 'Debit' THEN -ja.amount
                  ELSE ja.amount
                END
              ) > 0 THEN 'Variabel'
            ELSE c.category_type
            END AS category_type,
            c.income_outcome
        FROM
          public.transactions ja
        JOIN
          public.categories c ON ja.category = c.category_name
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
        GROUP BY ja.category, c.income_outcome, c.category_type  
      )
      SELECT 
        category_type::text,
        SUM(CASE WHEN total_adjusted_amount > 0 THEN total_adjusted_amount::numeric ELSE 0::numeric END) AS income,
        SUM(CASE WHEN total_adjusted_amount < 0 THEN -total_adjusted_amount::numeric ELSE 0::numeric END) AS expenses
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
      FROM public.${transaction_table}
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

    // Column names cannot be parameterised, so only allow known-safe ones
    // through - anything else would be interpolated straight into the SQL.
    const allowedColumns = new Set([
      'date_str',
      'name_description',
      'account',
      'counterparty',
      'category',
      'debit_credit',
      'amount',
      'notifications',
    ]);

    const entries = Object.entries(updates).filter(([key]) => allowedColumns.has(key));

    if (entries.length === 0) {
      client.release();
      throw new Error('No updatable columns supplied');
    }

    const setClause = entries
      .map(([key], index) => `${key} = $${index + 1}`)
      .join(', ');

    const values = entries.map(([, value]) => value);
  
    let query = `
      UPDATE public.${transaction_table}
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
            FROM public.${transaction_table}
            WHERE ${transaction_table}.account = ${account_table}.details
          )
          WHEN ${account_table}.account_type = 'Investments' THEN (
            SELECT ${investment_table}.balance
            FROM public.${investment_table}
            WHERE ${investment_table}.account = ${account_table}.details
            ORDER BY ${investment_table}.date_str DESC
            LIMIT 1
          )
          ELSE ${account_table}.balance_when_created
        END,
        ${account_table}.balance_when_created
      ) AS current_balance
    FROM public.${account_table};
    `;
    
    try {
      const result = await client.query(query);
      return result.rows;
    } finally {
      client.release();
    }
  }

  public async getCategoryList(): Promise<any[]> {
    const client = await dbContext.connect();

    let query = `
      SELECT category_name
      FROM public.${category_table}
      ORDER BY category_name ASC;
    `;

    try {
      const result = await client.query(query);
      return result.rows;
    } finally {
      client.release();
    }
  }

  public async getInvestmentAccounts(): Promise<any[]> {
    const client = await dbContext.connect();

    let query = `
      SELECT account_name, details 
      FROM public.${account_table}
      WHERE account_type = 'Investments';
    `;

    try {
      const result = await client.query(query);
      return result.rows;
    } finally {
      client.release();
    }
  }

  public async addInvestments(entries: { date_str: string, name_description: string, account: string, balance: number }[]): Promise<number[]> {
    const client = await dbContext.connect();
    const createdIds: number[] = [];
    
    try {
      await client.query('BEGIN');

      for (const entry of entries) {
        const result = await client.query(
          `INSERT INTO public.${investment_table} (date_str, name_description, account, balance)
          VALUES ($1, $2, $3, $4) RETURNING id`,
          [entry.date_str, entry.name_description, entry.account, entry.balance]
        );

        const insertedId = result.rows[0].id;
        createdIds.push(insertedId);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return createdIds;
  }

  public async deleteTransaction(id: string): Promise<any> {
    const client = await dbContext.connect();
    const query = `
      DELETE FROM public.${transaction_table}
      WHERE id = $1
      RETURNING *;
    `;
    try {
        const result = await client.query(query, [id]);
        return result.rows[0];
    } finally {
        client.release();
    }
}


  // ---------------------------------------------------------------------------
  // Tags
  //
  // A tag groups spending for an event that spans months (a holiday booked in
  // February and taken in September). Unlike a category it is optional, and a
  // transaction may carry more than one.
  // ---------------------------------------------------------------------------

  public async getTags(includeClosed = true): Promise<any[]> {
    const client = await dbContext.connect();

    const query = `
      SELECT
        t.id,
        t.tag_name,
        t.color,
        t.budget,
        t.is_closed,
        t.notes,
        COUNT(tt.transaction_id)::int AS transaction_count
      FROM public.${tag_table} t
      LEFT JOIN public.${transaction_tag_table} tt ON tt.tag_id = t.id
      ${includeClosed ? '' : 'WHERE t.is_closed = FALSE'}
      GROUP BY t.id
      ORDER BY t.is_closed ASC, t.tag_name ASC;
    `;

    try {
      const result = await client.query(query);
      return result.rows;
    } finally {
      client.release();
    }
  }

  public async createTag(tag: { tag_name: string, color?: string | null, budget?: number | null, notes?: string | null }): Promise<any> {
    const client = await dbContext.connect();

    const query = `
      INSERT INTO public.${tag_table} (tag_name, color, budget, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    try {
      const result = await client.query(query, [
        tag.tag_name,
        tag.color ?? null,
        tag.budget ?? null,
        tag.notes ?? null,
      ]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  public async updateTag(id: string, updates: { [key: string]: any }): Promise<any> {
    const client = await dbContext.connect();

    // Column names cannot be parameterised - only allow known-safe ones.
    const allowedColumns = new Set(['tag_name', 'color', 'budget', 'is_closed', 'notes']);
    const entries = Object.entries(updates).filter(([key]) => allowedColumns.has(key));

    if (entries.length === 0) {
      client.release();
      throw new Error('No updatable columns supplied');
    }

    const setClause = entries.map(([key], index) => `${key} = $${index + 1}`).join(', ');
    const values = entries.map(([, value]) => value);

    const query = `
      UPDATE public.${tag_table}
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

  public async deleteTag(id: string): Promise<any> {
    const client = await dbContext.connect();

    // transaction_tags rows cascade; the transactions themselves are untouched.
    const query = `
      DELETE FROM public.${tag_table}
      WHERE id = $1
      RETURNING *;
    `;

    try {
      const result = await client.query(query, [id]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Replace the full tag set for one transaction in a single transaction.
  public async setTransactionTags(transactionId: string, tagIds: number[]): Promise<any[]> {
    const client = await dbContext.connect();

    try {
      await client.query('BEGIN');
      await client.query(
        `DELETE FROM public.${transaction_tag_table} WHERE transaction_id = $1`,
        [transactionId],
      );

      if (tagIds.length > 0) {
        await client.query(
          `INSERT INTO public.${transaction_tag_table} (transaction_id, tag_id)
           SELECT $1, UNNEST($2::int[])
           ON CONFLICT DO NOTHING`,
          [transactionId, tagIds],
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return this.getTagsForTransaction(transactionId);
  }

  public async getTagsForTransaction(transactionId: string): Promise<any[]> {
    const client = await dbContext.connect();

    const query = `
      SELECT t.id, t.tag_name, t.color
      FROM public.${tag_table} t
      JOIN public.${transaction_tag_table} tt ON tt.tag_id = t.id
      WHERE tt.transaction_id = $1
      ORDER BY t.tag_name ASC;
    `;

    try {
      const result = await client.query(query, [transactionId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Totals for one event across its whole lifetime, ignoring month boundaries.
  public async getTagSummary(id: string): Promise<any> {
    const client = await dbContext.connect();

    const totalsQuery = `
      SELECT
        t.id,
        t.tag_name,
        t.color,
        t.budget,
        t.is_closed,
        t.notes,
        COALESCE(SUM(CASE WHEN tr.debit_credit = 'Debit' THEN tr.amount ELSE 0 END), 0) AS total_spent,
        COALESCE(SUM(CASE WHEN tr.debit_credit = 'Credit' THEN tr.amount ELSE 0 END), 0) AS total_received,
        COUNT(tr.id)::int AS transaction_count,
        MIN(tr.date_str) AS first_transaction,
        MAX(tr.date_str) AS last_transaction
      FROM public.${tag_table} t
      LEFT JOIN public.${transaction_tag_table} tt ON tt.tag_id = t.id
      LEFT JOIN public.${transaction_table} tr ON tr.id = tt.transaction_id
      WHERE t.id = $1
      GROUP BY t.id;
    `;

    // Where the money went within the event, and how it spreads over months.
    const byCategoryQuery = `
      SELECT
        tr.category,
        COALESCE(SUM(CASE WHEN tr.debit_credit = 'Debit' THEN tr.amount ELSE -tr.amount END), 0) AS total_amount
      FROM public.${transaction_tag_table} tt
      JOIN public.${transaction_table} tr ON tr.id = tt.transaction_id
      WHERE tt.tag_id = $1
      GROUP BY tr.category
      ORDER BY total_amount DESC;
    `;

    const byMonthQuery = `
      SELECT
        TO_CHAR(DATE_TRUNC('month', tr.date_str), 'YYYY-MM') AS month,
        COALESCE(SUM(CASE WHEN tr.debit_credit = 'Debit' THEN tr.amount ELSE -tr.amount END), 0) AS total_amount
      FROM public.${transaction_tag_table} tt
      JOIN public.${transaction_table} tr ON tr.id = tt.transaction_id
      WHERE tt.tag_id = $1
      GROUP BY 1
      ORDER BY 1 ASC;
    `;

    try {
      const [totals, byCategory, byMonth] = await Promise.all([
        client.query(totalsQuery, [id]),
        client.query(byCategoryQuery, [id]),
        client.query(byMonthQuery, [id]),
      ]);

      if (totals.rows.length === 0) return null;

      return {
        ...totals.rows[0],
        by_category: byCategory.rows,
        by_month: byMonth.rows,
      };
    } finally {
      client.release();
    }
  }

}

export default new FinanceManager();
