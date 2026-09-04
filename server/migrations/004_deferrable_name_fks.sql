-- Allow a category to be renamed.
--
-- transactions.category references categories.category_name by value, so a
-- rename has to update both tables. The foreign key rejected the first of those
-- two statements before the second could run, which made renaming a category
-- impossible - the only route was deleting and recreating it, losing the history.
--
-- Deferring the check to commit time lets the pair be applied together: within
-- the transaction the rows may point at a name that does not exist yet, and the
-- constraint is verified once both statements have run.

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_category_fkey;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_category_fkey
  FOREIGN KEY (category) REFERENCES public.categories(category_name)
  DEFERRABLE INITIALLY IMMEDIATE;

-- Same problem, same fix: investments.account references accounts.details by
-- value, so correcting an account identifier that an investment points at was
-- rejected before the investments could be rewritten.
ALTER TABLE public.investments
  DROP CONSTRAINT IF EXISTS investments_account_fkey;

ALTER TABLE public.investments
  ADD CONSTRAINT investments_account_fkey
  FOREIGN KEY (account) REFERENCES public.accounts(details)
  DEFERRABLE INITIALLY IMMEDIATE;
