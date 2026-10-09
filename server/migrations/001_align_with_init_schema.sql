-- Bring a database created from the old database/initProd.sql up to the
-- schema in database/init.sql.
--
-- Production was first deployed (September 2026) with initProd.sql. The schema
-- was then rewritten as init.sql without migrations, on the assumption that no
-- installed database existed yet - but production did, and init.sql never runs
-- against an existing volume. This file adds what the code needs and
-- initProd.sql lacked:
--
--   transactions.import_hash   - duplicate detection on re-import
--   transactions.is_internal   - transfers between own accounts
--   transfers                  - the two sides of a matched transfer
--   deferrable foreign keys    - renaming a category or account identifier
--   indexes from init.sql
--
-- Every statement is idempotent: on a database created from init.sql (local,
-- CI, acc) all of it already exists and this file is a no-op.
--
-- Existing rows keep import_hash NULL. addTransactions() matches those on their
-- identifying fields instead, so a re-import still skips them; no backfill is
-- needed. is_internal NULL means "not yet assessed", which is correct for rows
-- that predate the feature.

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS import_hash VARCHAR(64);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_internal BOOLEAN;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_import_hash
  ON public.transactions(import_hash)
  WHERE import_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_is_internal
  ON public.transactions(is_internal)
  WHERE is_internal IS TRUE;

CREATE INDEX IF NOT EXISTS idx_transactions_date_str ON public.transactions(date_str);

CREATE TABLE IF NOT EXISTS public.transfers (
    id SERIAL PRIMARY KEY,
    from_transaction_id INTEGER NOT NULL UNIQUE
      REFERENCES public.transactions(id) ON DELETE CASCADE,
    to_transaction_id INTEGER NOT NULL UNIQUE
      REFERENCES public.transactions(id) ON DELETE CASCADE,
    match_basis VARCHAR(20) NOT NULL,
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (from_transaction_id <> to_transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_transfers_from ON public.transfers(from_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to ON public.transfers(to_transaction_id);

-- initProd.sql declared these foreign keys inline without a name or
-- DEFERRABLE. Find them by table and column rather than by name, and make
-- them deferrable like init.sql does. Re-running ALTER CONSTRAINT with the
-- same settings is harmless.
DO $$
DECLARE
  fk record;
BEGIN
  FOR fk IN
    SELECT c.conname, c.conrelid::regclass AS tbl
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.contype = 'f'
      AND (
        (c.conrelid = 'public.transactions'::regclass AND a.attname = 'category') OR
        (c.conrelid = 'public.investments'::regclass AND a.attname = 'account')
      )
  LOOP
    EXECUTE format('ALTER TABLE %s ALTER CONSTRAINT %I DEFERRABLE INITIALLY IMMEDIATE', fk.tbl, fk.conname);
  END LOOP;
END
$$;
