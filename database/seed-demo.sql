-- Demo data for local testing and acceptance. NEVER loaded in production.
--
-- Mounted as 03-demo.sql by docker-compose.yml locally, and loaded into the
-- freshly reset acc database by .github/workflows/acc.yml. The database image
-- (database/Dockerfile) copies init.sql and seed.sql by name and deliberately
-- does not copy this file, so there is no path by which it can reach the
-- production database.
--
-- Runs after seed.sql on the first start of an empty data volume, so the
-- categories the transactions reference already exist.
--
-- Guarded: the whole file is a no-op if any transaction is already present.
-- An empty volume is the only situation this is meant for, and skipping rather
-- than failing means the script can be replayed by hand against a live
-- database without touching real rows.
DO $demo$
BEGIN

IF EXISTS (SELECT 1 FROM public.transactions LIMIT 1) THEN
  RAISE NOTICE 'seed-demo.sql: transactions already present, skipping demo data.';
  RETURN;
END IF;

-- ---------------------------------------------------------------------------
-- Accounts
--
-- `details` is what a bank export writes and what transactions.account is
-- matched against, so the values below are reused verbatim further down.
-- Investments appear in no export, which is why that one carries its worth as
-- snapshots in the investments table instead.
-- ---------------------------------------------------------------------------
INSERT INTO public.accounts (account_type, account_name, details, balance_when_created) VALUES
  ('Checking Account', 'Betaalrekening',  'NL01DEMO0000000001', 1850.00),
  ('Savings Account',  'Spaarrekening',   'NL01DEMO0000000002', 12000.00),
  ('Investments',      'Beleggingen',     'DEMO-BROKER-0001',   8000.00)
ON CONFLICT (details) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Transactions
--
-- Six months to the end of last month, so the dashboard's month filter and the
-- Reports charts both have a series to draw rather than a single point. Dates
-- are relative to the current month: the data stays recent however long after
-- this file was written the volume is created.
--
-- date_trunc('month', CURRENT_DATE) is month 0; the generated series walks back
-- from month 6 to month 1, so the newest rows land in last month and nothing is
-- dated in the future.
--
-- import_hash is left NULL throughout. The partial unique index only covers
-- non-null hashes, so these rows never collide with each other, and a later
-- real import computes its own hashes and is unaffected.
-- ---------------------------------------------------------------------------

-- Salary, rent, utilities, insurance: the fixed monthly frame. One row per
-- month for each, which is what makes 'Vast' vs 'Variabel' visibly different
-- in the period summary.
INSERT INTO public.transactions
  (date_str, name_description, account, counterparty, category, debit_credit, amount, notifications)
SELECT
  d.month_start + t.day_offset,
  t.description,
  'NL01DEMO0000000001',
  t.counterparty,
  t.category,
  t.debit_credit,
  -- A little month-to-month drift, deterministic so a rebuild is identical.
  ROUND((t.amount + (m.n * t.drift))::numeric, 2),
  t.notifications
FROM generate_series(1, 6) AS m(n)
CROSS JOIN LATERAL (
  -- Cast after the subtraction: date_trunc returns a timestamp, so casting it
  -- first leaves a timestamp that cannot take `+ integer` for the day offset.
  SELECT (date_trunc('month', CURRENT_DATE) - (m.n || ' months')::interval)::date AS month_start
) AS d
-- The day offset is a column rather than a filter over a generated series, so
-- each item lands on its own day of the month and salary can sit on the 25th.
CROSS JOIN (VALUES
  ('Salaris Demo Werkgever BV', 'NL01DEMO9000000001', 'Vast Inkomen',   'Credit', 3250.00,  12.00, 'Salaris',      24),
  ('Huur Demo Verhuur',         'NL01DEMO9000000002', 'Woonlasten',     'Debit',  1150.00,   0.00, 'Maandhuur',     0),
  ('Demo Energie',              'NL01DEMO9000000003', 'Utiliteiten',    'Debit',   142.50,  -1.50, 'Termijnbedrag', 4),
  ('Demo Zorgverzekering',      'NL01DEMO9000000004', 'Verzekeringen',  'Debit',   138.00,   0.00, 'Premie',        2),
  ('Demo Internet',             'NL01DEMO9000000005', 'Utiliteiten',    'Debit',    45.00,   0.00, 'Abonnement',    5),
  ('Bankkosten Demo Bank',      'NL01DEMO9000000006', 'Bankkosten',     'Debit',     3.35,   0.00, 'Maandkosten',   3)
) AS t(description, counterparty, category, debit_credit, amount, drift, notifications, day_offset);

-- Groceries: several per month, so the breakdown chart has a category with
-- real weight and the transaction list has volume to page through.
INSERT INTO public.transactions
  (date_str, name_description, account, counterparty, category, debit_credit, amount, notifications)
SELECT
  d.month_start + w.week_offset,
  s.shop,
  'NL01DEMO0000000001',
  NULL,
  'Boodschappen',
  'Debit',
  -- Deterministic pseudo-variation between 38 and 96 euro.
  ROUND((38 + ((m.n * 7 + w.week_offset + s.seed) % 59))::numeric, 2),
  NULL
FROM generate_series(1, 6) AS m(n)
CROSS JOIN LATERAL (
  -- Cast after the subtraction: date_trunc returns a timestamp, so casting it
  -- first leaves a timestamp that cannot take `+ integer` for the day offset.
  SELECT (date_trunc('month', CURRENT_DATE) - (m.n || ' months')::interval)::date AS month_start
) AS d
CROSS JOIN (VALUES (1), (6), (11), (16), (21), (26)) AS w(week_offset)
CROSS JOIN (VALUES ('Demo Albert Heijn', 3), ('Demo Jumbo', 11)) AS s(shop, seed)
-- Two shops but not on every one of the six dates, so the rows do not look
-- mechanically paired.
WHERE (m.n + w.week_offset + s.seed) % 3 <> 0;

-- Variable spending: the discretionary categories, thinner than groceries.
INSERT INTO public.transactions
  (date_str, name_description, account, counterparty, category, debit_credit, amount, notifications)
SELECT
  d.month_start + v.day_offset,
  v.description,
  'NL01DEMO0000000001',
  NULL,
  v.category,
  'Debit',
  ROUND((v.amount + ((m.n * 5 + v.day_offset) % 23))::numeric, 2),
  NULL
FROM generate_series(1, 6) AS m(n)
CROSS JOIN LATERAL (
  -- Cast after the subtraction: date_trunc returns a timestamp, so casting it
  -- first leaves a timestamp that cannot take `+ integer` for the day offset.
  SELECT (date_trunc('month', CURRENT_DATE) - (m.n || ' months')::interval)::date AS month_start
) AS d
CROSS JOIN (VALUES
  ('Demo Restaurant',        'Uiteten, Drankjes',              42.00,  7),
  ('Demo Cafe',              'Uiteten, Drankjes',              18.50, 19),
  ('Demo Bol',               'Kleding, Shoppen, Elektronica',  64.00, 13),
  ('Demo Drogist',           'Verzorging',                     22.75,  9),
  ('Demo Sportschool',       'Vrijetijdsbesteding, Hobby''s',  32.50,  6),
  ('Demo Bouwmarkt',         'Inboedel, Huishouden',           78.00, 17)
) AS v(description, category, amount, day_offset)
-- Not every item every month: variable spending should look variable.
WHERE (m.n + v.day_offset) % 4 <> 0;

-- One-off income, so 'Variabel Inkomen' is not empty.
INSERT INTO public.transactions
  (date_str, name_description, account, counterparty, category, debit_credit, amount, notifications)
VALUES
  ((date_trunc('month', CURRENT_DATE)::date - INTERVAL '3 months')::date + 14,
   'Demo Belastingteruggaaf', 'NL01DEMO0000000001', 'NL01DEMO9000000007',
   'Variabel Inkomen', 'Credit', 412.00, 'Teruggaaf'),
  ((date_trunc('month', CURRENT_DATE)::date - INTERVAL '5 months')::date + 8,
   'Demo Marktplaats verkoop', 'NL01DEMO0000000001', NULL,
   'Variabel Inkomen', 'Credit', 85.00, NULL);

-- Uncategorised rows, so the review screen and the badge on the Transactions
-- tab have something to count. category is nullable and the classifier leaves a
-- row blank below its confidence threshold, which is exactly this state - an
-- import that categorised everything would hide the whole review flow.
INSERT INTO public.transactions
  (date_str, name_description, account, counterparty, category, debit_credit, amount, notifications)
VALUES
  ((date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::date + 12,
   'DEMO ONBEKEND 7742', 'NL01DEMO0000000001', NULL, NULL, 'Debit', 27.40, NULL),
  ((date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::date + 18,
   'Demo Incasso Onbekend', 'NL01DEMO0000000001', 'NL01DEMO9000000099', NULL, 'Debit', 64.99, 'Incasso'),
  ((date_trunc('month', CURRENT_DATE) - INTERVAL '2 months')::date + 9,
   'DEMO POS 1188', 'NL01DEMO0000000001', NULL, NULL, 'Debit', 12.25, NULL);

-- An account seen in the data but deliberately NOT in the accounts table, so
-- the "seen in your transactions, not yet added" panel on the Accounts tab has
-- a row to adopt.
INSERT INTO public.transactions
  (date_str, name_description, account, counterparty, category, debit_credit, amount, notifications)
VALUES
  ((date_trunc('month', CURRENT_DATE) - INTERVAL '2 months')::date + 15,
   'Demo Overboeking onbekende rekening', 'NL01DEMO0000000003', NULL,
   'Overboekingen', 'Debit', 150.00, 'Niet-geregistreerde rekening');

-- ---------------------------------------------------------------------------
-- Internal transfers
--
-- Three shapes on purpose, because each drives a different screen:
--
--   1. A confirmed two-sided pair (checking -> savings). Both rows internal and
--      recorded in `transfers`, which is what the Reports transfer list reads.
--   2. An UNCONFIRMED two-sided pair, left is_internal NULL with no transfers
--      row, so it surfaces as a suggestion in getTransferCandidates() with
--      match_basis 'iban' - the review screen has something to confirm.
--   3. A one-sided transfer into the investment account, which files no export.
--      Marked internal on its counterparty alone, so OneSidedTransfers has a
--      row and the deposit is not counted as the month's largest expense.
-- ---------------------------------------------------------------------------

-- 1 + 2: monthly savings deposit, both sides, months 6 down to 1.
INSERT INTO public.transactions
  (date_str, name_description, account, counterparty, category, debit_credit, amount, notifications, is_internal)
SELECT
  d.month_start + 25,
  CASE s.side WHEN 'out' THEN 'Naar Spaarrekening' ELSE 'Van Betaalrekening' END,
  CASE s.side WHEN 'out' THEN 'NL01DEMO0000000001' ELSE 'NL01DEMO0000000002' END,
  CASE s.side WHEN 'out' THEN 'NL01DEMO0000000002' ELSE 'NL01DEMO0000000001' END,
  'Overboekingen',
  CASE s.side WHEN 'out' THEN 'Debit' ELSE 'Credit' END,
  400.00,
  'Maandelijks sparen',
  -- The most recent month is left unassessed so the review screen has a
  -- candidate pair to confirm; the older ones are already confirmed below.
  CASE WHEN m.n = 1 THEN NULL ELSE TRUE END
FROM generate_series(1, 6) AS m(n)
CROSS JOIN LATERAL (
  -- Cast after the subtraction: date_trunc returns a timestamp, so casting it
  -- first leaves a timestamp that cannot take `+ integer` for the day offset.
  SELECT (date_trunc('month', CURRENT_DATE) - (m.n || ' months')::interval)::date AS month_start
) AS d
CROSS JOIN (VALUES ('out'), ('in')) AS s(side);

-- Pair up the confirmed ones. Matched on date and amount, which is unambiguous
-- here because one transfer exists per month.
INSERT INTO public.transfers (from_transaction_id, to_transaction_id, match_basis)
SELECT dbt.id, crd.id, 'iban'
FROM public.transactions dbt
JOIN public.transactions crd
  ON crd.date_str = dbt.date_str
 AND crd.amount = dbt.amount
 AND crd.debit_credit = 'Credit'
 AND crd.account = dbt.counterparty
 AND crd.counterparty = dbt.account
WHERE dbt.debit_credit = 'Debit'
  AND dbt.notifications = 'Maandelijks sparen'
  AND dbt.is_internal IS TRUE
ON CONFLICT DO NOTHING;

-- 3: quarterly deposit into the broker. One side only - no counterpart row,
-- because an investment account ships no CSV to import.
INSERT INTO public.transactions
  (date_str, name_description, account, counterparty, category, debit_credit, amount, notifications, is_internal)
SELECT
  (date_trunc('month', CURRENT_DATE)::date - (m.n || ' months')::interval)::date + 27,
  'Storting Beleggingen',
  'NL01DEMO0000000001',
  'DEMO-BROKER-0001',
  'Sparen, Beleggen',
  'Debit',
  500.00,
  'Inleg',
  TRUE
FROM (VALUES (2), (5)) AS m(n);

-- ---------------------------------------------------------------------------
-- Investments
--
-- Month-end snapshots rather than transactions, which is how the net worth
-- chart gets a line for this account. Rising overall with one down month, so
-- the chart is not a straight line.
-- ---------------------------------------------------------------------------
INSERT INTO public.investments (date_str, name_description, account, balance)
SELECT
  (date_trunc('month', CURRENT_DATE)::date - (m.n || ' months')::interval + INTERVAL '1 month - 1 day')::date,
  'Demo Broker waardering',
  'DEMO-BROKER-0001',
  ROUND((8000 + (6 - m.n) * 420 + CASE WHEN m.n = 3 THEN -260 ELSE 0 END)::numeric, 2)
FROM generate_series(1, 6) AS m(n);

-- ---------------------------------------------------------------------------
-- Tags (events)
--
-- One open event with a budget it is under, one closed and finished. The tagged
-- rows are existing transactions, so tag totals agree with the category
-- figures instead of being an independent set of numbers.
-- ---------------------------------------------------------------------------
INSERT INTO public.tags (tag_name, color, budget, is_closed, notes) VALUES
  ('Vakantie Italie',   '#e69050', 2500.00, FALSE, 'Demo-event: loopt nog'),
  ('Keuken verbouwing', '#d4aa7e', 1500.00, TRUE,  'Demo-event: afgerond')
ON CONFLICT (tag_name) DO NOTHING;

-- Restaurant and cafe rows in the two most recent months stand in for the
-- holiday; the bouwmarkt rows for the renovation.
INSERT INTO public.transaction_tags (transaction_id, tag_id)
SELECT t.id, g.id
FROM public.transactions t
JOIN public.tags g ON g.tag_name = 'Vakantie Italie'
WHERE t.name_description IN ('Demo Restaurant', 'Demo Cafe')
  AND t.date_str >= (date_trunc('month', CURRENT_DATE)::date - INTERVAL '2 months')
ON CONFLICT DO NOTHING;

INSERT INTO public.transaction_tags (transaction_id, tag_id)
SELECT t.id, g.id
FROM public.transactions t
JOIN public.tags g ON g.tag_name = 'Keuken verbouwing'
WHERE t.name_description = 'Demo Bouwmarkt'
ON CONFLICT DO NOTHING;

RAISE NOTICE 'seed-demo.sql: demo data loaded.';

END
$demo$;
