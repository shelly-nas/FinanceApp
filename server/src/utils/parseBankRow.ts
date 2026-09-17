import { bankMappings, bankCategoryColumns } from '@/models/bankTransactionModel';

/**
 * One row from a bank's CSV export, normalised to the shape the database uses.
 *
 * Extracted from the upload route so the per-bank quirks below can be tested
 * directly: three column mappings, three date formats and two amount conventions
 * are exactly the kind of logic that fails silently and produces wrong figures
 * rather than an error.
 */
export interface ParsedRow {
  date_str: string | null;
  name_description: string | null;
  account: string | null;
  counterparty: string | null;
  debit_credit: string | null;
  amount: number;
  notifications: string | null;
  /** The bank's own category, when it ships one. A hint for the classifier
   *  only - it uses the bank's taxonomy, not ours, and is never stored. */
  bankCategory?: string;
}

/** YYYYMMDD -> YYYY-MM-DD (ING). */
export const reformatDate = (dateStr: string) => {
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${year}-${month}-${day}`;
};

// ASN exports dates as DD-MM-YYYY. These already contain hyphens, so they skip
// the YYYYMMDD branch above and would otherwise reach Postgres ambiguously -
// 01-08-2026 is 1 August here but reads as 8 January under a US datestyle.
export const isDayFirstDate = (dateStr: string) => /^\d{2}-\d{2}-\d{4}$/.test(dateStr);

export const reformatDayFirstDate = (dateStr: string) => {
  const [day, month, year] = dateStr.split('-');
  return `${year}-${month}-${day}`;
};

// ASN wraps free-text columns (description, category) in literal single quotes,
// which are part of the value rather than CSV quoting and must be stripped.
export const stripWrappingQuotes = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 1 && trimmed.startsWith("'") && trimmed.endsWith("'")
    ? trimmed.slice(1, -1).trim()
    : trimmed;
};

/**
 * Map one raw CSV record onto a database row.
 *
 * `data` is the record as csv-parser yields it: keys are the bank's own column
 * headings. Returns null when the bank type is unknown.
 */
export function parseBankRow(data: Record<string, string>, bankType: string): ParsedRow | null {
  const mapping = bankMappings[bankType as keyof typeof bankMappings];
  if (!mapping) return null;

  const entry: any = {};

  // Map the csv headers onto the database keys
  for (const [csvKey, dbKey] of Object.entries(mapping)) {
    entry[dbKey] = data[csvKey] || null;
  }

  const categoryColumn = bankCategoryColumns[bankType];
  if (categoryColumn && data[categoryColumn]) {
    entry.bankCategory = data[categoryColumn];
  }

  // Date: YYYYMMDD has no separators, DD-MM-YYYY does.
  if (entry.date_str && !entry.date_str.includes('-')) {
    entry.date_str = reformatDate(entry.date_str);
  } else if (entry.date_str && isDayFirstDate(entry.date_str)) {
    entry.date_str = reformatDayFirstDate(entry.date_str);
  }

  for (const key of ['name_description', 'notifications', 'counterparty']) {
    if (typeof entry[key] === 'string') {
      entry[key] = stripWrappingQuotes(entry[key]) || null;
    }
  }

  // Dutch banks write the decimal separator as a comma.
  if (entry.amount) {
    entry.amount = parseFloat(String(entry.amount).replace(',', '.'));
  }

  // 'Af'/'Bij' is ING's wording for debit/credit.
  if (entry.debit_credit !== undefined && entry.debit_credit !== null) {
    if (entry.debit_credit === 'Af') {
      entry.debit_credit = 'Debit';
    } else if (entry.debit_credit === 'Bij') {
      entry.debit_credit = 'Credit';
    }
  }

  // Banks without a direction column signal it through the amount's sign.
  if (entry.debit_credit === undefined || entry.debit_credit === null) {
    entry.debit_credit = entry.amount < 0 ? 'Debit' : 'Credit';
  }

  entry.amount = Math.abs(entry.amount);

  // ASN leaves 'Naam' empty for card payments and direct debits - the merchant
  // only appears at the start of the description. Fall back to that leading
  // segment so the row is identifiable and can still be auto-categorised.
  if (!entry.name_description && entry.notifications) {
    const merchant = entry.notifications.split('>')[0].trim();
    if (merchant) {
      entry.name_description = merchant;
    }
  }

  if (entry.name_description) {
    entry.name_description = entry.name_description.replace(/\s+/g, ' ').trim();
  }

  // A bank whose mapping omits a column leaves the key undefined, which reaches
  // the database as a missing parameter rather than a NULL. Normalise the
  // optional text columns so every bank produces the same shape.
  for (const key of ['name_description', 'counterparty', 'notifications']) {
    if (entry[key] === undefined) entry[key] = null;
  }

  return entry as ParsedRow;
}
