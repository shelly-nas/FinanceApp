-- Create the categories table
CREATE TABLE public.categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(255) UNIQUE NOT NULL,
    color VARCHAR(7),
    category_type VARCHAR(50)
);

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

-- Create the investments table
CREATE TABLE public.investments (
    id SERIAL PRIMARY KEY,
    date_str DATE NOT NULL,
    name_description VARCHAR(255),
    account VARCHAR(255),
    balance NUMERIC(10, 2),
    FOREIGN KEY (account) REFERENCES public.accounts(details)
);