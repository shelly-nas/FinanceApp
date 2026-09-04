-- Base schema.
--
-- Written idempotently so it is a no-op against a database that was bootstrapped
-- from the old initProd.sql, and creates everything from scratch on a fresh one.
-- Contains no data and no credentials: roles come from POSTGRES_USER/PASSWORD,
-- reference data from the seed script.

CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(255) UNIQUE NOT NULL,
    color VARCHAR(7),
    -- 'Vast' or 'Variabel'; splits the period summary into fixed and variable.
    category_type VARCHAR(50),
    -- 'Inkomsten' or 'Uitgaven'; getIncomeExpensesSum() splits on this.
    income_outcome VARCHAR(50)
);

-- Databases created by the pre-migration initProd.sql lack this column.
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS income_outcome VARCHAR(50);

CREATE TABLE IF NOT EXISTS public.accounts (
    id SERIAL PRIMARY KEY,
    account_type VARCHAR(50),
    account_name VARCHAR(255),
    -- The IBAN or account identifier as the bank writes it in its exports.
    -- transactions.account is matched against this, so it must be the real one.
    details VARCHAR(255) UNIQUE,
    balance_when_created NUMERIC(10, 2)
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id SERIAL PRIMARY KEY,
    date_str DATE NOT NULL,
    name_description VARCHAR(255),
    account VARCHAR(255),
    counterparty VARCHAR(255),
    category VARCHAR(255),
    debit_credit VARCHAR(10),
    amount NUMERIC(10, 2),
    notifications TEXT,
    FOREIGN KEY (category) REFERENCES public.categories(category_name)
);

CREATE TABLE IF NOT EXISTS public.investments (
    id SERIAL PRIMARY KEY,
    date_str DATE NOT NULL,
    name_description VARCHAR(255),
    account VARCHAR(255),
    balance NUMERIC(10, 2),
    FOREIGN KEY (account) REFERENCES public.accounts(details)
);

-- A tag groups spending for an event that spans multiple months (a holiday, a
-- renovation), independent of the monthly category breakdown. Categories answer
-- "what kind of spending"; tags answer "which event".
CREATE TABLE IF NOT EXISTS public.tags (
    id SERIAL PRIMARY KEY,
    tag_name VARCHAR(255) UNIQUE NOT NULL,
    color VARCHAR(7),
    budget NUMERIC(10, 2),
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transaction_tags (
    transaction_id INTEGER NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (transaction_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_transaction_tags_tag_id ON public.transaction_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_transaction_id ON public.transaction_tags(transaction_id);

-- Every summary query filters on a date range.
CREATE INDEX IF NOT EXISTS idx_transactions_date_str ON public.transactions(date_str);
