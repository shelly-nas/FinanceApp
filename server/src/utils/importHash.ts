import crypto from 'crypto';

// A bank CSV carries no stable transaction id, so a row is identified by the
// fields that describe it. Two exports covering an overlapping period then
// produce the same hash for the same transaction, and the second import skips it.
//
// Normalisation matters more than it looks: the same transaction re-exported by
// the same bank can differ in whitespace and casing between one download and the
// next, and an unnormalised hash would treat those as new rows - exactly the
// duplication this is meant to prevent.
export interface HashableEntry {
  date_str: string;
  account: string | null;
  amount: number;
  debit_credit: string | null;
  name_description: string | null;
  notifications: string | null;
}

function normalise(value: string | null | undefined): string {
  return (value ?? '').toString().replace(/\s+/g, ' ').trim().toLowerCase();
}

/** The identifying fields of a row, without the repeat counter. */
export function identityKey(entry: HashableEntry): string {
  return [
    normalise(entry.date_str),
    normalise(entry.account),
    Number(entry.amount).toFixed(2),
    normalise(entry.debit_credit),
    normalise(entry.name_description),
    normalise(entry.notifications),
  ].join('|');
}

/**
 * Identity hash for one imported row.
 *
 * `occurrence` distinguishes genuine repeats: two identical card payments at the
 * same shop on the same day are both real transactions, so they are numbered
 * 0 and 1 and hash differently. Numbering is derived from the rows already
 * stored plus the ones earlier in the same file, so re-importing that file
 * reproduces the same numbers and both rows are recognised as duplicates.
 */
export function computeImportHash(entry: HashableEntry, occurrence: number): string {
  return crypto
    .createHash('sha256')
    .update(`${identityKey(entry)}|${occurrence}`)
    .digest('hex');
}
