-- Production schema bootstrap.
--
-- Runs via /docker-entrypoint-initdb.d on FIRST start of an empty data volume.
-- The database, owner role and password are created by the postgres image from
-- POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD, so this file must NOT create
-- databases, roles or credentials - it only defines the schema.

-- Create the categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(255) UNIQUE NOT NULL,
    color VARCHAR(7),
    category_type VARCHAR(50),
    -- 'Inkomsten' or 'Uitgaven'; getIncomeExpensesSum() splits on this.
    income_outcome VARCHAR(50)
);

-- Fill categories table
INSERT INTO categories (category_name, color, category_type, income_outcome) VALUES
('Bankkosten', '#b0a4c2', 'Vast', 'Uitgaven'),
('Belastingen', '#f8c47c', 'Vast', 'Uitgaven'),
('Boodschappen', '#8cc2b3', 'Vast', 'Uitgaven'),
('Cadeaus, Verjaardagen', '#f1ac95', 'Variabel', 'Uitgaven'),
('Inboedel, Huishouden', '#d4aa7e', 'Variabel', 'Uitgaven'),
('Kleding, Shoppen, Elektronica', '#c8d1c7', 'Variabel', 'Uitgaven'),
('Overboekingen', '#c2b2d1', 'Variabel', 'Uitgaven'),
('Sparen, Beleggen', '#88a2a6', 'Variabel', 'Uitgaven'),
('Uiteten, Drankjes', '#dba47e', 'Variabel', 'Uitgaven'),
('Utiliteiten', '#d2c1c2', 'Vast', 'Uitgaven'),
('Vakanties', '#e69050', 'Variabel', 'Uitgaven'),
('Variabel Inkomen', '#80bfb4', 'Variabel', 'Inkomsten'),
('Vast Inkomen', '#8fc069', 'Vast', 'Inkomsten'),
('Verzekeringen', '#f1b6a7', 'Vast', 'Uitgaven'),
('Verzorging', '#a7b8a4', 'Variabel', 'Uitgaven'),
('Vrijetijdsbesteding, Hobby''s', '#b99c77', 'Variabel', 'Uitgaven'),
('Woonlasten', '#d55e8a', 'Vast', 'Uitgaven');

-- Create the transactions table
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

-- Create the accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
    id SERIAL PRIMARY KEY,
    account_type VARCHAR(50),
    account_name VARCHAR(255),
    details VARCHAR(255) UNIQUE,
    balance_when_created NUMERIC(10, 2)
);

-- Fill accounts table
INSERT INTO accounts (account_type, account_name, details, balance_when_created) VALUES
('Checking Account', 'Ashley''s Betaalrekening', 'unique1', 0),
('Checking Account', 'Ashley''s Credit Card', 'unique2', 0),
('Checking Account', 'Jelle''s Betaalrekening', 'NL61RABO0128050403', 0),
('Checking Account', 'Jelle''s Credit Card', 'unique3', 0),
('Investments', 'Coinbase', 'unique4', 0),
('Investments', 'DEGIRO', 'unique5', 0),
('Investments', 'ING Beleggen', 'unique6', 0),
('Investments', 'Peaks', 'unique7', 0),
('Savings Account', 'Ashley''s Spaarrekening', 'unique8', 0),
('Savings Account', 'Jelle''s Spaarrekening', 'unique9', 0);

-- Create the investments table
CREATE TABLE IF NOT EXISTS public.investments (
    id SERIAL PRIMARY KEY,
    date_str DATE NOT NULL,
    name_description VARCHAR(255),
    account VARCHAR(255),
    balance NUMERIC(10, 2),
    FOREIGN KEY (account) REFERENCES public.accounts(details)
);

-- Create the tags table
-- A tag groups spending for an event that spans multiple months (a holiday, a
-- renovation), independent of the monthly category breakdown. Categories answer
-- "what kind of spending"; tags answer "which event".
CREATE TABLE IF NOT EXISTS public.tags (
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

-- Join table: a transaction may carry several tags (a holiday dinner that is
-- also a birthday), and a tag spans many transactions.
CREATE TABLE IF NOT EXISTS public.transaction_tags (
    transaction_id INTEGER NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (transaction_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_transaction_tags_tag_id ON public.transaction_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_transaction_id ON public.transaction_tags(transaction_id);
