-- Mark transactions whose counterparty is one of the user's own accounts as
-- transfers, filed under Overboekingen.
--
-- The app recognised these only while importing, and only for the rows of
-- that import. Transactions imported before their counterparty was added as an
-- account were never looked at again, so a payment from one own account to
-- another kept counting as spending and income. Adding or changing an account
-- now marks them; this catches up on the accounts that already exist.
--
-- Same rule as markCounterpartyTransfers: only rows never assessed
-- (is_internal IS NULL). A row the user marked "not a transfer" (FALSE) is
-- left as it is. Data only, idempotent. Skipped when the category does not
-- exist, since the foreign key would reject the update.
UPDATE public.transactions t
SET is_internal = TRUE,
    category = 'Overboekingen'
FROM public.accounts a
WHERE a.details = t.counterparty
  AND t.counterparty IS NOT NULL
  AND t.is_internal IS NULL
  AND EXISTS (SELECT 1 FROM public.categories WHERE category_name = 'Overboekingen');
