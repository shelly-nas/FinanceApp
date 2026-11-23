-- File every transfer between the user's own accounts under 'Overboekingen'.
--
-- Until now a transfer only got that category when it had none: a row the
-- classifier had already put under savings or a merchant category kept that
-- guess after being recognised as a transfer. The code now always files a
-- transfer under 'Overboekingen'; this brings the rows marked before that in
-- line.
--
-- Data only, no schema change. Idempotent: a second run finds nothing to
-- update. Skipped when the category does not exist (renamed or deleted by
-- the user), since the foreign key would reject the update.
UPDATE public.transactions
SET category = 'Overboekingen'
WHERE is_internal IS TRUE
  AND category IS DISTINCT FROM 'Overboekingen'
  AND EXISTS (SELECT 1 FROM public.categories WHERE category_name = 'Overboekingen');
