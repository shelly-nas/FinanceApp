-- Create database
CREATE DATABASE finance;

-- Create user
CREATE USER financier WITH ENCRYPTED PASSWORD 'm0n3y';
CREATE ROLE admin WITH LOGIN SUPERUSER PASSWORD 'Buvpe_74';

-- Create the categories table
CREATE TABLE public.categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(255) UNIQUE NOT NULL,
    color VARCHAR(7),
    category_type VARCHAR(50)
);

-- Fill categories table
INSERT INTO categories (category_name, color, category_type) VALUES
('Bankkosten', '#b0a4c2', 'Vast'),
('Belastingen', '#f8c47c', 'Vast'),
('Boodschappen', '#8cc2b3', 'Vast'),
('Cadeaus, Verjaardagen', '#f1ac95', 'Variabel'),
('Inboedel, Huishouden', '#d4aa7e', 'Variabel'),
('Kleding, Shoppen, Elektronica', '#c8d1c7', 'Variabel'),
('Overboekingen', '#c2b2d1', 'Variabel'),
('Sparen, Beleggen', '#88a2a6', 'Variabel'),
('Uiteten, Drankjes', '#dba47e', 'Variabel'),
('Utiliteiten', '#d2c1c2', 'Vast'),
('Vakanties', '#e69050', 'Variabel'),
('Variabel Inkomen', '#80bfb4', 'Variabel'),
('Vast Inkomen', '#8fc069', 'Vast'),
('Verzekeringen', '#f1b6a7', 'Vast'),
('Verzorging', '#a7b8a4', 'Variabel'),
('Vrijetijdsbesteding, Hobby''s', '#b99c77', 'Variabel'),
('Woonlasten', '#d55e8a', 'Vast');

-- Create the transactions table
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
    FOREIGN KEY (category) REFERENCES public.categories(category_name)
);

-- Create the accounts table
CREATE TABLE public.accounts (
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
CREATE TABLE public.investments (
    id SERIAL PRIMARY KEY,
    date_str DATE NOT NULL,
    name_description VARCHAR(255),
    account VARCHAR(255),
    balance NUMERIC(10, 2),
    FOREIGN KEY (account) REFERENCES public.accounts(details)
);

-- Grant rights to financier
GRANT ALL PRIVILEGES ON DATABASE finance TO financier;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO financier;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO financier;