import dbContext from '@/context/dbContext';
import Transactions from '@/models/financeModel';
import { computeImportHash, identityKey, HashableEntry } from '@/utils/importHash';

const category_table = "categories"
const transaction_table = "transactions";
const account_table = "accounts";
const investment_table = "investments";
const tag_table = "tags";
const transaction_tag_table = "transaction_tags";
const transfer_table = "transfers";

export interface ImportResult {
  createdIds: number[];
  imported: number;
  skipped: number;
}

class FinanceManager {
  /**
   * Import a batch of transactions, skipping rows already stored.
   *
   * Bank exports overlap: asking for "the last three months" twice delivers the
   * same rows again. Each row therefore carries an import_hash over its
   * identifying fields, and a unique index turns a repeat into a no-op instead
   * of a second copy that silently doubles every total.
   */
  public async addTransactions(entries: {
    date_str: string,
    name_description: string,
    account: string,
    counterparty: string | null,
    category: string | null,
    debit_credit: string | undefined,
    amount: number,
    notifications: string | null,
  }[]): Promise<ImportResult> {
    const client = await dbContext.connect();
    const createdIds: number[] = [];
    let skipped = 0;

    try {
      await client.query('BEGIN');

      // Two identical payments on one day are both genuine, so a row's hash
      // includes how many identical rows precede it. The count starts at what
      // is already stored, which makes the numbering stable across re-imports
      // of the same file.
      const occurrences = new Map<string, number>();

      for (const entry of entries) {
        entry.category = entry.category === 'null' ? null : entry.category;

        const hashable: HashableEntry = {
          date_str: entry.date_str,
          account: entry.account,
          amount: entry.amount,
          debit_credit: entry.debit_credit ?? null,
          name_description: entry.name_description,
          notifications: entry.notifications,
        };
        const key = identityKey(hashable);

        const occurrence = occurrences.get(key) ?? 0;
        occurrences.set(key, occurrence + 1);

        // Rows stored before import_hash existed carry none, so the unique
        // index cannot catch them. Match those on their identifying fields
        // instead, counting how many the file has already claimed, so a genuine
        // pair of identical payments still imports both halves.
        const legacy = await client.query(
          `SELECT COUNT(*)::int AS n FROM public.${transaction_table}
           WHERE import_hash IS NULL
             AND date_str = $1 AND account IS NOT DISTINCT FROM $2
             AND amount = $3 AND debit_credit IS NOT DISTINCT FROM $4
             AND name_description IS NOT DISTINCT FROM $5`,
          [entry.date_str, entry.account, entry.amount, entry.debit_credit ?? null, entry.name_description],
        );

        if (legacy.rows[0].n > occurrence) {
          skipped++;
          continue;
        }

        const importHash = computeImportHash(hashable, occurrence);

        const result = await client.query(
          // The unique index is partial (rows predating the column have a NULL
          // hash and must not collide), and Postgres only accepts a partial
          // index as a conflict target when the predicate is restated here.
          `INSERT INTO ${transaction_table} (date_str, name_description, account, counterparty, category, debit_credit, amount, notifications, import_hash)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (import_hash) WHERE import_hash IS NOT NULL DO NOTHING
          RETURNING id`,
          [entry.date_str, entry.name_description, entry.account, entry.counterparty, entry.category, entry.debit_credit, entry.amount, entry.notifications, importHash]
        );

        if (result.rows.length === 0) {
          skipped++;
          continue;
        }

        createdIds.push(result.rows[0].id);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return { createdIds, imported: createdIds.length, skipped };
  }

  /**
   * Transactions in a date range, or by id.
   *
   * `limit` caps the result: without one an unfiltered call returns the entire
   * history, which grows without bound and is loaded into memory whole.
   */
  public async getTransactions(
    startDate?: string,
    endDate?: string,
    ids?: number[],
    limit = 5000,
    offset = 0,
  ): Promise<Transactions[]> {
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
      paramIndex += ids.length;
    }

    // A stable order is what makes offset paging meaningful; id breaks ties
    // between rows sharing a date.
    query += ` ORDER BY date_str DESC, id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    try {
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Search transactions.
   *
   * One query behind every list of transactions in the app: the review screen is
   * this with `uncategorised: true`, a category drill-down is this with a
   * category, and the search screen is this with whatever the user typed. Having
   * a single source avoids two tables that drift apart in what they can show.
   *
   * Returns the page plus the total, so the client can page without guessing how
   * many rows there are.
   */
  public async searchTransactions(filters: {
    query?: string,
    startDate?: string,
    endDate?: string,
    categories?: string[],
    accounts?: string[],
    tagIds?: number[],
    debitCredit?: string,
    minAmount?: number,
    maxAmount?: number,
    uncategorised?: boolean,
    includeInternal?: boolean,
    sortBy?: string,
    sortDir?: 'asc' | 'desc',
    limit?: number,
    offset?: number,
  }): Promise<{ rows: any[], total: number }> {
    const client = await dbContext.connect();
    const params: any[] = [];
    const where: string[] = ['1=1'];

    const add = (value: any) => {
      params.push(value);
      return `$${params.length}`;
    };

    if (filters.query) {
      // One parameter matched against the three free-text columns: a merchant
      // may be named in the description on one bank's export and only in the
      // remittance text on another's.
      const term = add(`%${filters.query}%`);
      where.push(`(
        t.name_description ILIKE ${term}
        OR t.notifications ILIKE ${term}
        OR t.counterparty ILIKE ${term}
        OR t.account ILIKE ${term}
      )`);
    }

    if (filters.startDate) where.push(`t.date_str >= ${add(filters.startDate)}`);
    if (filters.endDate) where.push(`t.date_str <= ${add(filters.endDate)}`);

    if (filters.categories && filters.categories.length > 0) {
      where.push(`t.category = ANY(${add(filters.categories)}::text[])`);
    }

    if (filters.accounts && filters.accounts.length > 0) {
      where.push(`t.account = ANY(${add(filters.accounts)}::text[])`);
    }

    if (filters.tagIds && filters.tagIds.length > 0) {
      where.push(`EXISTS (
        SELECT 1 FROM public.${transaction_tag_table} tt
        WHERE tt.transaction_id = t.id AND tt.tag_id = ANY(${add(filters.tagIds)}::int[])
      )`);
    }

    if (filters.debitCredit) where.push(`t.debit_credit = ${add(filters.debitCredit)}`);
    if (filters.minAmount !== undefined) where.push(`t.amount >= ${add(filters.minAmount)}`);
    if (filters.maxAmount !== undefined) where.push(`t.amount <= ${add(filters.maxAmount)}`);

    // The review list: rows the classifier was not confident enough to label.
    if (filters.uncategorised) where.push('t.category IS NULL');

    // Confirmed transfers are money moved rather than spent. They stay out of
    // the default view for the same reason they stay out of the summaries, but
    // remain findable when explicitly asked for.
    if (!filters.includeInternal) where.push('t.is_internal IS NOT TRUE');

    const whereClause = where.join(' AND ');

    // Whitelisted: a sort column cannot be parameterised, so it is matched
    // against known names rather than interpolated.
    const SORTABLE = new Set(['date_str', 'name_description', 'account', 'category', 'amount', 'debit_credit']);
    const sortBy = filters.sortBy && SORTABLE.has(filters.sortBy) ? filters.sortBy : 'date_str';
    const sortDir = filters.sortDir === 'asc' ? 'ASC' : 'DESC';

    const limit = Math.min(filters.limit ?? 100, 1000);
    const offset = filters.offset ?? 0;

    // The count runs on the filter parameters only; limit and offset are added
    // after this snapshot so the two queries cannot drift apart.
    const filterParams = [...params];

    const rowsQuery = `
      SELECT
        t.*,
        COALESCE(
          (SELECT JSON_AGG(JSON_BUILD_OBJECT('id', tg.id, 'tag_name', tg.tag_name, 'color', tg.color)
                           ORDER BY tg.tag_name)
           FROM public.${transaction_tag_table} tt
           JOIN public.${tag_table} tg ON tg.id = tt.tag_id
           WHERE tt.transaction_id = t.id),
          '[]'::json
        ) AS tags
      FROM public.${transaction_table} t
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortDir}, t.id ${sortDir}
      LIMIT ${add(limit)} OFFSET ${add(offset)};
    `;

    // Counted with the same filters but without paging, so the client can show
    // "showing 100 of 1,432" rather than inferring it from a short page.
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM public.${transaction_table} t
      WHERE ${whereClause};
    `;

    try {
      const [rows, count] = await Promise.all([
        client.query(rowsQuery, params),
        client.query(countQuery, filterParams),
      ]);

      return { rows: rows.rows, total: count.rows[0].total };
    } finally {
      client.release();
    }
  }

  /**
   * Apply one change to many transactions at once.
   *
   * Categorising an import row by row is the bulk of the work on this screen;
   * with filters in place, "everything matching this search" is usually the same
   * category.
   */
  public async bulkUpdateTransactions(ids: number[], updates: { [key: string]: any }): Promise<number> {
    if (ids.length === 0) return 0;

    const client = await dbContext.connect();

    // Column names cannot be parameterised - only allow known-safe ones.
    const allowedColumns = new Set(['category', 'debit_credit', 'account', 'counterparty', 'is_internal']);
    const entries = Object.entries(updates).filter(([key]) => allowedColumns.has(key));

    if (entries.length === 0) {
      client.release();
      throw new Error('No updatable columns supplied');
    }

    const setClause = entries.map(([key], index) => `${key} = $${index + 1}`).join(', ');
    const values = entries.map(([, value]) => value);

    try {
      const result = await client.query(
        `UPDATE public.${transaction_table}
         SET ${setClause}
         WHERE id = ANY($${values.length + 1}::int[])`,
        [...values, ids],
      );
      return result.rowCount ?? 0;
    } finally {
      client.release();
    }
  }

  /** Assign or clear one tag across many transactions in a single statement. */
  public async bulkSetTag(ids: number[], tagId: number, mode: 'add' | 'remove'): Promise<number> {
    if (ids.length === 0) return 0;

    const client = await dbContext.connect();

    try {
      if (mode === 'remove') {
        const result = await client.query(
          `DELETE FROM public.${transaction_tag_table}
           WHERE tag_id = $1 AND transaction_id = ANY($2::int[])`,
          [tagId, ids],
        );
        return result.rowCount ?? 0;
      }

      const result = await client.query(
        `INSERT INTO public.${transaction_tag_table} (transaction_id, tag_id)
         SELECT UNNEST($2::int[]), $1
         ON CONFLICT DO NOTHING`,
        [tagId, ids],
      );
      return result.rowCount ?? 0;
    } finally {
      client.release();
    }
  }

  /** Distinct account identifiers present in transactions, for the filter list. */
  public async getTransactionAccounts(): Promise<any[]> {
    const client = await dbContext.connect();

    const query = `
      SELECT
        t.account AS details,
        COALESCE(a.account_name, t.account) AS account_name,
        COUNT(*)::int AS transaction_count
      FROM public.${transaction_table} t
      LEFT JOIN public.${account_table} a ON a.details = t.account
      WHERE t.account IS NOT NULL
      GROUP BY t.account, a.account_name
      ORDER BY 2;
    `;

    try {
      const result = await client.query(query);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * The rows the classifier learns from: categorised transactions, and only the
   * three columns it reads.
   *
   * Training used to call getTransactions(), pulling every column of every row
   * including the uncategorised ones it discards - the bulk of the work on an
   * import, repeated on each one.
   */
  public async getTrainingData(): Promise<{ name_description: string; notifications: string; category: string }[]> {
    const client = await dbContext.connect();

    const query = `
      SELECT name_description, notifications, category
      FROM public.${transaction_table}
      WHERE category IS NOT NULL
      ORDER BY id DESC
      LIMIT 20000;
    `;

    try {
      const result = await client.query(query);
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
        -- Confirmed transfers between the user's own accounts are money moved,
        -- not money spent or earned, so they must not reach a breakdown.
        AND ja.is_internal IS NOT TRUE
    `;

    let paramIndex = 1;

    if (startDate) {
      query += ` AND ja.date_str >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND ja.date_str <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
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
          -- See getCategorySums: an internal transfer is neither income nor
          -- expense, and counting both its sides inflates each by the amount
          -- moved and distorts the savings rate.
          AND ja.is_internal IS NOT TRUE
    `;

    let paramIndex = 1;

    if (startDate) {
      query += ` AND ja.date_str >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND ja.date_str <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
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

    // Newest first and capped: this feeds a review screen, and a backlog of
    // thousands is worked through from the top rather than rendered whole.
    let query = `
      SELECT *
      FROM public.${transaction_table}
      WHERE category IS NULL
      ORDER BY date_str DESC, id DESC
      LIMIT 2000;
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

  /**
   * Balance per account, either as of today or as of a given date.
   *
   * `asOf` makes the figure historical: transactions after that date are left
   * out, and an investment account takes the last balance recorded on or before
   * it. Without it the query answers "right now".
   *
   * Internal transfers are deliberately included. They are excluded from income
   * and expenses because nothing was earned or spent, but the money genuinely
   * moved between accounts - leaving them out here would make both balances wrong.
   */
  public async getAccountOverview(asOf?: string): Promise<any> {
    const client = await dbContext.connect();
    const params: any[] = [];
    // The same bound is applied to transactions and investments, so a historical
    // net worth mixes figures from one moment rather than several.
    const dateFilter = asOf ? ` AND ${transaction_table}.date_str <= $1` : '';
    const investmentFilter = asOf ? ` AND ${investment_table}.date_str <= $1` : '';
    if (asOf) params.push(asOf);

    let query = `
      SELECT 
        ${account_table}.account_type, 
        ${account_table}.account_name, 
        ${account_table}.details,
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
            WHERE ${transaction_table}.account = ${account_table}.details${dateFilter}
          )
          WHEN ${account_table}.account_type = 'Investments' THEN (
            SELECT ${investment_table}.balance
            FROM public.${investment_table}
            WHERE ${investment_table}.account = ${account_table}.details${investmentFilter}
            ORDER BY ${investment_table}.date_str DESC
            LIMIT 1
          )
          ELSE ${account_table}.balance_when_created
        END,
        ${account_table}.balance_when_created
      ) AS current_balance
    FROM public.${account_table}
    ORDER BY ${account_table}.account_type, ${account_table}.account_name;
    `;
    
    try {
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Net worth at the end of each month over a period.
   *
   * Built for a chart: a running total per account carried forward month by
   * month, so a month in which an account saw no activity keeps its previous
   * balance rather than dropping to zero.
   */
  public async getNetWorthHistory(startDate: string, endDate: string): Promise<any[]> {
    const client = await dbContext.connect();

    const query = `
      WITH months AS (
        SELECT (DATE_TRUNC('month', d) + INTERVAL '1 month - 1 day')::date AS month_end
        FROM GENERATE_SERIES($1::date, $2::date, '1 month') AS d
      ),
      -- Every account's balance at each month end: the opening balance plus
      -- every movement up to that point, which is what carries a quiet month
      -- forward instead of showing a gap.
      balances AS (
        SELECT
          m.month_end,
          a.account_type,
          CASE
            WHEN a.account_type IN ('Checking Account', 'Savings Account') THEN
              a.balance_when_created + COALESCE((
                SELECT SUM(CASE WHEN t.debit_credit = 'Debit' THEN -t.amount ELSE t.amount END)
                FROM public.${transaction_table} t
                WHERE t.account = a.details AND t.date_str <= m.month_end
              ), 0)
            WHEN a.account_type = 'Investments' THEN
              COALESCE((
                SELECT i.balance
                FROM public.${investment_table} i
                WHERE i.account = a.details AND i.date_str <= m.month_end
                ORDER BY i.date_str DESC
                LIMIT 1
              ), a.balance_when_created)
            ELSE a.balance_when_created
          END AS balance
        FROM months m
        CROSS JOIN public.${account_table} a
      )
      SELECT
        TO_CHAR(month_end, 'YYYY-MM') AS month,
        SUM(balance)::numeric AS net_worth,
        SUM(balance) FILTER (WHERE account_type = 'Checking Account')::numeric AS checking,
        SUM(balance) FILTER (WHERE account_type = 'Savings Account')::numeric AS savings,
        SUM(balance) FILTER (WHERE account_type = 'Investments')::numeric AS investments
      FROM balances
      GROUP BY month_end
      ORDER BY month_end;
    `;

    try {
      const result = await client.query(query, [startDate, endDate]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // ---------------------------------------------------------------------------
  // Categories
  //
  // Reference data rather than a fixed list: the colour drives the breakdown
  // chart, category_type splits fixed from variable spending, and income_outcome
  // decides which side of the period summary a category lands on. All three are
  // judgement calls that belong to the user, not to the seed.
  // ---------------------------------------------------------------------------

  /** Categories with everything the management screen needs, plus usage. */
  public async getCategories(): Promise<any[]> {
    const client = await dbContext.connect();

    const query = `
      SELECT
        c.id,
        c.category_name,
        c.color,
        c.category_type,
        c.income_outcome,
        (SELECT COUNT(*)::int FROM public.${transaction_table} t
         WHERE t.category = c.category_name) AS transaction_count
      FROM public.${category_table} c
      ORDER BY c.income_outcome DESC, c.category_name ASC;
    `;

    try {
      const result = await client.query(query);
      return result.rows;
    } finally {
      client.release();
    }
  }

  public async createCategory(category: {
    category_name: string,
    color?: string | null,
    category_type?: string | null,
    income_outcome?: string | null,
  }): Promise<any> {
    const client = await dbContext.connect();

    const query = `
      INSERT INTO public.${category_table} (category_name, color, category_type, income_outcome)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    try {
      const result = await client.query(query, [
        category.category_name,
        category.color ?? null,
        category.category_type ?? 'Variabel',
        category.income_outcome ?? 'Uitgaven',
      ]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  public async updateCategory(id: string, updates: { [key: string]: any }): Promise<any> {
    const client = await dbContext.connect();

    // Column names cannot be parameterised - only allow known-safe ones.
    const allowedColumns = new Set(['category_name', 'color', 'category_type', 'income_outcome']);
    const entries = Object.entries(updates).filter(([key]) => allowedColumns.has(key));

    if (entries.length === 0) {
      client.release();
      throw new Error('No updatable columns supplied');
    }

    const setClause = entries.map(([key], index) => `${key} = $${index + 1}`).join(', ');
    const values = entries.map(([, value]) => value);

    try {
      await client.query('BEGIN');

      // transactions.category references the name, so a rename touches two
      // tables and neither statement is valid on its own. Deferring the check
      // to commit lets both run first and validates the result.
      await client.query('SET CONSTRAINTS public.transactions_category_fkey DEFERRED');

      const before = await client.query(
        `SELECT category_name FROM public.${category_table} WHERE id = $1`,
        [id],
      );

      if (before.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const result = await client.query(
        `UPDATE public.${category_table} SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`,
        [...values, id],
      );

      // transactions.category is a foreign key on the name, not the id, so a
      // rename has to carry the transactions with it - otherwise the update is
      // rejected outright, or the history is orphaned.
      const oldName = before.rows[0].category_name;
      const newName = result.rows[0].category_name;

      if (oldName !== newName) {
        await client.query(
          `UPDATE public.${transaction_table} SET category = $1 WHERE category = $2`,
          [newName, oldName],
        );
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Remove a category. Refuses while transactions still carry it: those would be
   * left pointing at a name that no longer exists, and their history would drop
   * out of every breakdown.
   */
  public async deleteCategory(id: string): Promise<{ deleted: any, blockedBy?: number }> {
    const client = await dbContext.connect();

    try {
      const existing = await client.query(
        `SELECT category_name FROM public.${category_table} WHERE id = $1`,
        [id],
      );

      if (existing.rows.length === 0) return { deleted: null };

      const inUse = await client.query(
        `SELECT COUNT(*)::int AS n FROM public.${transaction_table} WHERE category = $1`,
        [existing.rows[0].category_name],
      );

      if (inUse.rows[0].n > 0) {
        return { deleted: null, blockedBy: inUse.rows[0].n };
      }

      const removed = await client.query(
        `DELETE FROM public.${category_table} WHERE id = $1 RETURNING *`,
        [id],
      );
      return { deleted: removed.rows[0] };
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
  // Accounts
  //
  // Checking and savings accounts announce themselves: every imported row names
  // the account it belongs to, so the list can be derived rather than kept by
  // hand. Investment accounts cannot - they appear in no export, and are entered
  // through the investments dialog, which reads its dropdown from this table.
  //
  // The table therefore stays authoritative. What it gains is discovery: an
  // account seen in transactions but absent here is offered for review rather
  // than silently ignored, which is what leaves balances stuck at zero.
  // ---------------------------------------------------------------------------

  /** All accounts, with the number of transactions each one carries. */
  public async getAccounts(): Promise<any[]> {
    const client = await dbContext.connect();

    const query = `
      SELECT
        a.id,
        a.account_type,
        a.account_name,
        a.details,
        a.balance_when_created,
        (SELECT COUNT(*)::int FROM public.${transaction_table} t WHERE t.account = a.details) AS transaction_count
      FROM public.${account_table} a
      ORDER BY a.account_type, a.account_name;
    `;

    try {
      const result = await client.query(query);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Account identifiers seen in transactions that have no row in the accounts
   * table.
   *
   * Their transactions still import and still count towards the summaries, but
   * they have no name, no type and no opening balance, so they are missing from
   * the account overview and cannot take part in transfer detection.
   */
  public async getUnknownAccounts(): Promise<any[]> {
    const client = await dbContext.connect();

    const query = `
      SELECT
        t.account AS details,
        COUNT(*)::int AS transaction_count,
        MIN(t.date_str) AS first_seen,
        MAX(t.date_str) AS last_seen,
        -- A sample description helps identify whose account it is.
        (ARRAY_AGG(t.name_description ORDER BY t.date_str DESC))[1] AS last_description
      FROM public.${transaction_table} t
      LEFT JOIN public.${account_table} a ON a.details = t.account
      WHERE t.account IS NOT NULL
        AND a.id IS NULL
      GROUP BY t.account
      ORDER BY COUNT(*) DESC;
    `;

    try {
      const result = await client.query(query);
      return result.rows;
    } finally {
      client.release();
    }
  }

  public async createAccount(account: {
    account_type: string,
    account_name: string,
    details: string,
    balance_when_created?: number | null,
  }): Promise<any> {
    const client = await dbContext.connect();

    const query = `
      INSERT INTO public.${account_table} (account_type, account_name, details, balance_when_created)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    try {
      const result = await client.query(query, [
        account.account_type,
        account.account_name,
        account.details,
        account.balance_when_created ?? 0,
      ]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  public async updateAccount(id: string, updates: { [key: string]: any }): Promise<any> {
    const client = await dbContext.connect();

    // Column names cannot be parameterised - only allow known-safe ones.
    const allowedColumns = new Set(['account_type', 'account_name', 'details', 'balance_when_created']);
    const entries = Object.entries(updates).filter(([key]) => allowedColumns.has(key));

    if (entries.length === 0) {
      client.release();
      throw new Error('No updatable columns supplied');
    }

    const setClause = entries.map(([key], index) => `${key} = $${index + 1}`).join(', ');
    const values = entries.map(([, value]) => value);

    try {
      await client.query('BEGIN');

      // investments.account references details by value, so a rename touches
      // two tables and neither statement is valid alone. Deferring the check to
      // commit lets both run before the constraint is verified.
      await client.query('SET CONSTRAINTS public.investments_account_fkey DEFERRED');

      const before = await client.query(
        `SELECT details FROM public.${account_table} WHERE id = $1`,
        [id],
      );

      if (before.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const result = await client.query(
        `UPDATE public.${account_table} SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`,
        [...values, id],
      );

      // transactions.account and investments.account reference details by value,
      // not by key. Renaming an identifier without carrying those along would
      // orphan every row that used the old one - the balance would silently
      // revert to the opening figure.
      const oldDetails = before.rows[0].details;
      const newDetails = result.rows[0].details;

      if (oldDetails !== newDetails) {
        await client.query(
          `UPDATE public.${transaction_table} SET account = $1 WHERE account = $2`,
          [newDetails, oldDetails],
        );
        await client.query(
          `UPDATE public.${investment_table} SET account = $1 WHERE account = $2`,
          [newDetails, oldDetails],
        );
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Remove an account. Refuses while transactions or investments still point at
   * it, since those rows reference it by value and would be left orphaned.
   */
  public async deleteAccount(id: string): Promise<{ deleted: any, blockedBy?: number }> {
    const client = await dbContext.connect();

    try {
      const existing = await client.query(
        `SELECT details FROM public.${account_table} WHERE id = $1`,
        [id],
      );

      if (existing.rows.length === 0) return { deleted: null };

      const { details } = existing.rows[0];
      const inUse = await client.query(
        `SELECT
           (SELECT COUNT(*)::int FROM public.${transaction_table} WHERE account = $1) +
           (SELECT COUNT(*)::int FROM public.${investment_table} WHERE account = $1) AS n`,
        [details],
      );

      if (inUse.rows[0].n > 0) {
        return { deleted: null, blockedBy: inUse.rows[0].n };
      }

      const removed = await client.query(
        `DELETE FROM public.${account_table} WHERE id = $1 RETURNING *`,
        [id],
      );
      return { deleted: removed.rows[0] };
    } finally {
      client.release();
    }
  }

  // ---------------------------------------------------------------------------
  // Internal transfers
  //
  // Moving money between the user's own accounts produces two rows: a Debit on
  // one and a Credit on the other. Counted naively both land in the monthly
  // totals, inflating income and expenses by the same amount and skewing the
  // savings rate - yet nothing was earned or spent.
  //
  // Matching is a suggestion, never a silent rewrite. Two unrelated payments of
  // the same amount on the same day are indistinguishable from a transfer to
  // any matcher, so the pairs surface on the review screen and only take effect
  // once confirmed.
  // ---------------------------------------------------------------------------

  /**
   * Candidate transfer pairs: a Debit and a Credit of the same amount, close in
   * time, on two different accounts, neither already part of a confirmed pair.
   *
   * Restricted to the supplied transaction ids when given, so a fresh import
   * proposes pairs involving the rows just added rather than re-proposing the
   * user's whole history.
   */
  public async getTransferCandidates(ids?: number[], windowDays = 3): Promise<any[]> {
    const client = await dbContext.connect();
    const params: any[] = [windowDays];
    let scope = '';

    if (ids && ids.length > 0) {
      // Either side may be the new row: the counterpart often came in with an
      // earlier import of the other bank's export.
      const placeholders = ids.map((_, i) => `$${i + 2}`).join(', ');
      scope = `AND (d.id IN (${placeholders}) OR c.id IN (${placeholders}))`;
      params.push(...ids);
    }

    // match_basis records how sure we are. 'iban' means both accounts are known
    // in the accounts table and reference each other - that is a transfer by
    // definition. 'amount' means only the figures line up, which is a guess.
    const query = `
      SELECT
        d.id                AS from_transaction_id,
        d.date_str          AS from_date,
        d.account           AS from_account,
        da.account_name     AS from_account_name,
        d.name_description  AS from_description,
        c.id                AS to_transaction_id,
        c.date_str          AS to_date,
        c.account           AS to_account,
        ca.account_name     AS to_account_name,
        c.name_description  AS to_description,
        d.amount::numeric   AS amount,
        -- 'iban' is reserved for pairs whose counterparty fields actually point
        -- at each other's account. Both rows merely sitting on accounts the user
        -- owns is not enough: two unrelated payments of the same amount on the
        -- same day would qualify, and be presented as certain when they are not.
        CASE
          WHEN d.counterparty = c.account AND c.counterparty = d.account THEN 'iban'
          ELSE 'amount'
        END AS match_basis
      FROM public.${transaction_table} d
      JOIN public.${transaction_table} c
        ON c.amount = d.amount
       AND c.debit_credit = 'Credit'
       AND c.account IS DISTINCT FROM d.account
       AND ABS(c.date_str - d.date_str) <= $1
      LEFT JOIN public.${account_table} da ON da.details = d.account
      LEFT JOIN public.${account_table} ca ON ca.details = c.account
      WHERE d.debit_credit = 'Debit'
        AND d.is_internal IS DISTINCT FROM FALSE
        AND c.is_internal IS DISTINCT FROM FALSE
        AND NOT EXISTS (
          SELECT 1 FROM public.${transfer_table} t
          WHERE t.from_transaction_id IN (d.id, c.id)
             OR t.to_transaction_id IN (d.id, c.id)
        )
        ${scope}
      ORDER BY
        CASE WHEN d.counterparty = c.account AND c.counterparty = d.account THEN 0 ELSE 1 END,
        ABS(c.date_str - d.date_str),
        d.date_str DESC
      LIMIT 200;
    `;

    try {
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Confirm one pair as an internal transfer.
   *
   * Both rows are marked internal so the summaries drop them, and both are put
   * in the transfer category - which is also what takes them off the review
   * screen's uncategorised list, so confirming a transfer resolves the same row
   * the user was there to categorise.
   */
  public async confirmTransfer(
    fromId: number,
    toId: number,
    matchBasis: string,
    category = 'Overboekingen',
  ): Promise<any> {
    const client = await dbContext.connect();

    try {
      await client.query('BEGIN');

      const inserted = await client.query(
        `INSERT INTO public.${transfer_table} (from_transaction_id, to_transaction_id, match_basis)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING
         RETURNING *`,
        [fromId, toId, matchBasis],
      );

      if (inserted.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      await client.query(
        `UPDATE public.${transaction_table}
         SET is_internal = TRUE,
             category = COALESCE(category, $2)
         WHERE id = ANY($1::int[])`,
        [[fromId, toId], category],
      );

      await client.query('COMMIT');
      return inserted.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Reject a suggested pair. Marking both sides FALSE rather than leaving them
   * NULL is what stops the same pair being proposed again after every import.
   */
  public async rejectTransfer(fromId: number, toId: number): Promise<void> {
    const client = await dbContext.connect();

    try {
      await client.query(
        `UPDATE public.${transaction_table}
         SET is_internal = FALSE
         WHERE id = ANY($1::int[]) AND is_internal IS NULL`,
        [[fromId, toId]],
      );
    } finally {
      client.release();
    }
  }

  /** Undo a confirmation: the pair is removed and both rows count again. */
  public async unlinkTransfer(transferId: string): Promise<any> {
    const client = await dbContext.connect();

    try {
      await client.query('BEGIN');

      const removed = await client.query(
        `DELETE FROM public.${transfer_table} WHERE id = $1 RETURNING *`,
        [transferId],
      );

      if (removed.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const { from_transaction_id, to_transaction_id } = removed.rows[0];
      await client.query(
        `UPDATE public.${transaction_table} SET is_internal = NULL WHERE id = ANY($1::int[])`,
        [[from_transaction_id, to_transaction_id]],
      );

      await client.query('COMMIT');
      return removed.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /** Confirmed transfers, most recent first. */
  public async getTransfers(): Promise<any[]> {
    const client = await dbContext.connect();

    const query = `
      SELECT
        t.id,
        t.match_basis,
        t.confirmed_at,
        d.date_str AS from_date, d.account AS from_account, da.account_name AS from_account_name,
        c.date_str AS to_date,   c.account AS to_account,   ca.account_name AS to_account_name,
        d.amount::numeric AS amount
      FROM public.${transfer_table} t
      JOIN public.${transaction_table} d ON d.id = t.from_transaction_id
      JOIN public.${transaction_table} c ON c.id = t.to_transaction_id
      LEFT JOIN public.${account_table} da ON da.details = d.account
      LEFT JOIN public.${account_table} ca ON ca.details = c.account
      ORDER BY t.confirmed_at DESC
      LIMIT 500;
    `;

    try {
      const result = await client.query(query);
      return result.rows;
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
