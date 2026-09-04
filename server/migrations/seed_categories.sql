-- Reference data, not schema.
--
-- The categories are seeded rather than left to the user because
-- transactions.category is a foreign key onto this table: without rows here no
-- transaction can be categorised at all, and the classifier has no label set to
-- predict from.
--
-- Run separately from the migrations (npm run seed). ON CONFLICT DO NOTHING
-- makes it safe to re-run and keeps any colour or type the user has since
-- changed - it only ever fills gaps.

INSERT INTO public.categories (category_name, color, category_type, income_outcome) VALUES
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
('Woonlasten', '#d55e8a', 'Vast', 'Uitgaven')
ON CONFLICT (category_name) DO NOTHING;
