-- Transfers between the user's own accounts.
--
-- Moving 500 euro from checking to savings produces two rows: a Debit on one
-- account and a Credit on the other. Counted naively both sides land in the
-- monthly totals, inflating income and expenses by 500 each and skewing the
-- savings rate. Neither side is income or spending - the money never left.
--
-- Detection is a suggestion, never a silent rewrite: a pair is proposed on the
-- review screen and only excluded from the summaries once confirmed, because
-- two unrelated payments of the same amount on the same day look identical to
-- any matcher.

-- NULL = not yet assessed, FALSE = explicitly rejected as internal,
-- TRUE = confirmed internal and excluded from income/expense summaries.
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_internal BOOLEAN;

-- Only the confirmed rows are ever filtered out, so the index covers those.
CREATE INDEX IF NOT EXISTS idx_transactions_is_internal
  ON public.transactions(is_internal)
  WHERE is_internal IS TRUE;

-- The two sides of one transfer, so the pair can be shown as a single movement
-- and a missing counterpart is visible.
CREATE TABLE IF NOT EXISTS public.transfers (
    id SERIAL PRIMARY KEY,
    -- The Debit side: the account the money left.
    from_transaction_id INTEGER NOT NULL UNIQUE
      REFERENCES public.transactions(id) ON DELETE CASCADE,
    -- The Credit side: the account it arrived on.
    to_transaction_id INTEGER NOT NULL UNIQUE
      REFERENCES public.transactions(id) ON DELETE CASCADE,
    -- 'iban' when both accounts are known in the accounts table (certain),
    -- 'amount' when matched on amount and date proximity alone (suggested).
    match_basis VARCHAR(20) NOT NULL,
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (from_transaction_id <> to_transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_transfers_from ON public.transfers(from_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to ON public.transfers(to_transaction_id);
