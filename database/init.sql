-- Schema bootstrap.
--
-- Runs via /docker-entrypoint-initdb.d on the FIRST start of an empty data
-- volume. The database, its owner and the password come from POSTGRES_DB /
-- POSTGRES_USER / POSTGRES_PASSWORD on the postgres image, so this file defines
-- no roles and no credentials - only structure.
--
-- Production runs with data in it, so this script is never re-run there: it
-- only builds fresh databases (local, CI, acc). Every schema change goes into
-- BOTH this file and a numbered migration in server/migrations/, which the
-- server applies on startup to existing databases. The two must end up with
-- the same schema. See CONTRIBUTING.md.

-- --------------------------------------------------------------------------
-- Categories
--
-- Reference data as much as structure: the colour drives the breakdown chart,
-- category_type splits fixed from variable spending, and income_outcome decides
-- which side of the period summary a category lands on.
-- --------------------------------------------------------------------------
CREATE TABLE public.categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(255) UNIQUE NOT NULL,
    color VARCHAR(7),
    -- 'Vast' or 'Variabel'
    category_type VARCHAR(50),
    -- 'Inkomsten' or 'Uitgaven'; getIncomeExpensesSum() splits on this.
    income_outcome VARCHAR(50)
);

-- --------------------------------------------------------------------------
-- Accounts
--
-- `details` is the identifier the bank writes in its exports - transactions are
-- matched to an account by that value, so it has to be exact. Investment
-- accounts appear in no export and are entered by hand.
-- --------------------------------------------------------------------------
CREATE TABLE public.accounts (
    id SERIAL PRIMARY KEY,
    account_type VARCHAR(50),
    account_name VARCHAR(255),
    details VARCHAR(255) UNIQUE,
    -- What the account held before the first imported transaction.
    balance_when_created NUMERIC(10, 2)
);

-- --------------------------------------------------------------------------
-- Transactions
-- --------------------------------------------------------------------------
CREATE TABLE public.transactions (
    id SERIAL PRIMARY KEY,
    date_str DATE NOT NULL,
    name_description VARCHAR(255),
    account VARCHAR(255),
    counterparty VARCHAR(255),
    category VARCHAR(255),
    debit_credit VARCHAR(10),
    amount NUMERIC(10, 2),
    notifications TEXT,

    -- Identity hash over the fields that describe a row, so a bank export
    -- covering a period already imported is skipped instead of duplicated.
    -- Banks ship no stable transaction id in these CSVs, which is why the
    -- natural key has to be derived.
    import_hash VARCHAR(64),

    -- Transfers between the user's own accounts: money moved, not earned or
    -- spent. NULL = not yet assessed, FALSE = explicitly rejected as internal,
    -- TRUE = internal and excluded from the income and expense summaries (but
    -- still counted in the account balances, because the money did move).
    is_internal BOOLEAN,

    -- Deferrable: renaming a category has to update this table and categories
    -- together, and neither statement is valid on its own. Without this the
    -- rename is rejected before the second statement can run.
    CONSTRAINT transactions_category_fkey
      FOREIGN KEY (category) REFERENCES public.categories(category_name)
      DEFERRABLE INITIALLY IMMEDIATE
);

-- Partial: rows without a hash must not collide with each other.
CREATE UNIQUE INDEX idx_transactions_import_hash
  ON public.transactions(import_hash)
  WHERE import_hash IS NOT NULL;

-- Only confirmed transfers are ever filtered out.
CREATE INDEX idx_transactions_is_internal
  ON public.transactions(is_internal)
  WHERE is_internal IS TRUE;

-- Every summary query filters on a date range.
CREATE INDEX idx_transactions_date_str ON public.transactions(date_str);

-- --------------------------------------------------------------------------
-- Investments
--
-- Balances rather than transactions: an investment account ships no export, so
-- its worth is recorded as a series of snapshots.
-- --------------------------------------------------------------------------
CREATE TABLE public.investments (
    id SERIAL PRIMARY KEY,
    date_str DATE NOT NULL,
    name_description VARCHAR(255),
    account VARCHAR(255),
    balance NUMERIC(10, 2),

    -- Deferrable for the same reason as above: correcting an account identifier
    -- updates this table and accounts together.
    CONSTRAINT investments_account_fkey
      FOREIGN KEY (account) REFERENCES public.accounts(details)
      DEFERRABLE INITIALLY IMMEDIATE
);

-- --------------------------------------------------------------------------
-- Transfers
--
-- The two sides of one internal transfer, so a pair reads as a single movement
-- and a missing counterpart is visible. A transfer with only one side - money
-- into an investment account, which files no export - has no row here; that row
-- carries is_internal on its own evidence.
-- --------------------------------------------------------------------------
CREATE TABLE public.transfers (
    id SERIAL PRIMARY KEY,
    -- The Debit side: the account the money left.
    from_transaction_id INTEGER NOT NULL UNIQUE
      REFERENCES public.transactions(id) ON DELETE CASCADE,
    -- The Credit side: the account it arrived on.
    to_transaction_id INTEGER NOT NULL UNIQUE
      REFERENCES public.transactions(id) ON DELETE CASCADE,
    -- 'iban' when the counterparty fields point at each other (certain),
    -- 'amount' when matched on amount and date proximity alone (a suggestion).
    match_basis VARCHAR(20) NOT NULL,
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (from_transaction_id <> to_transaction_id)
);

CREATE INDEX idx_transfers_from ON public.transfers(from_transaction_id);
CREATE INDEX idx_transfers_to ON public.transfers(to_transaction_id);

-- --------------------------------------------------------------------------
-- Tags
--
-- A tag groups spending for an event spanning several months - flights booked
-- in February and restaurants in September belong to the same holiday, which
-- the monthly category breakdown cannot express. Categories answer "what kind
-- of spending"; tags answer "which event".
-- --------------------------------------------------------------------------
CREATE TABLE public.tags (
    id SERIAL PRIMARY KEY,
    tag_name VARCHAR(255) UNIQUE NOT NULL,
    color VARCHAR(7),
    -- Optional planned spend, so an event can be tracked against a budget.
    budget NUMERIC(10, 2),
    -- Closed tags stay available for reporting but drop out of the picker.
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A transaction may carry several tags (a holiday dinner that is also a
-- birthday), and a tag spans many transactions.
CREATE TABLE public.transaction_tags (
    transaction_id INTEGER NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (transaction_id, tag_id)
);

CREATE INDEX idx_transaction_tags_tag_id ON public.transaction_tags(tag_id);
CREATE INDEX idx_transaction_tags_transaction_id ON public.transaction_tags(transaction_id);
