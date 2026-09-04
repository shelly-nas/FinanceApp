-- Duplicate protection for imports.
--
-- Banks ship no stable transaction id in these CSV exports, so the natural key
-- is a hash over the fields that identify the row: date, account, amount,
-- direction and description. Overlapping export periods can then be imported
-- freely - rows already present are skipped instead of duplicated.
--
-- occurrence_index distinguishes genuinely repeated transactions: two identical
-- card payments at the same shop on the same day are both real, and get index
-- 0 and 1, so their hashes differ.

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS import_hash VARCHAR(64);

-- Partial index: rows predating this migration have a NULL hash and must not
-- collide with each other.
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_import_hash
  ON public.transactions(import_hash)
  WHERE import_hash IS NOT NULL;
