# Graph Report - FinanceApp  (2026-09-17)

## Corpus Check
- 72 files · ~48,160 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 450 nodes · 632 edges · 22 communities (15 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7d1dc792`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]

## God Nodes (most connected - your core abstractions)
1. `FinanceManager` - 44 edges
2. `useDateRange()` - 11 edges
3. `runMigrations()` - 9 edges
4. `Belangrijk, niet blokkerend` - 8 edges
5. `formatDate()` - 8 edges
6. `parseBankRow()` - 7 edges
7. `FinanceApp — doorlichting` - 7 edges
8. `Voorstel: een rapportagetab voor historisch verloop` - 7 edges
9. `predictCategory()` - 6 edges
10. `Functioneel` - 6 edges

## Surprising Connections (you probably didn't know these)
- `start()` --calls--> `runMigrations()`  [EXTRACTED]
  server/src/index.ts → server/src/context/migrations.ts
- `ThemedApp()` --calls--> `useColorMode()`  [EXTRACTED]
  client/src/App.tsx → client/src/theme/ColorModeContext.tsx
- `DateRange()` --calls--> `useDateRange()`  [EXTRACTED]
  client/src/scenes/dateRange/index.tsx → client/src/scenes/dateRange/DateRangeContext.tsx
- `ThemeModeToggle()` --calls--> `useColorMode()`  [EXTRACTED]
  client/src/components/ThemeModeToggle.tsx → client/src/theme/ColorModeContext.tsx
- `ensureSchema()` --calls--> `runMigrations()`  [EXTRACTED]
  server/src/__tests__/schema.ts → server/src/context/migrations.ts

## Communities (22 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (42): ArrowButton, formatCurrency(), groupByType(), NetWorthBanner(), TYPE_ORDER, Props, AccountCategory, AccountsOverview() (+34 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (30): ACCOUNT_TYPES, Accounts(), DraftAccount, emptyDraft(), filter, TagOption, TagPickerProps, Column (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (35): ensureMigrationsTable(), MIGRATIONS_DIR, readMigrationFiles(), runMigrations(), ImportResult, errorHandler(), app, start() (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (29): ACCOUNT_TYPES, CATEGORY_TYPES, entries, entry, idList, INCOME_OUTCOME, invalid, merchant (+21 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (37): 10. De rekeningtabel is met placeholder-IBAN's gevuld, 11. De transactietabel bouwt kolommen op uit `Object.keys(row)`, 12. Twee formatCurrency-definities, zeven keer gekopieerd, 13. Het `Transaction`-type staat vier keer opnieuw gedeclareerd, 14. De `Transactions`-klasse is een lege huls, 15. `getCategorySums` gebruikt vaste parameterindexen, 16. Ongebruikte parameters en dode routes, 1. Overboekingen tussen eigen rekeningen tellen dubbel mee (+29 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (21): Categories(), CATEGORY_TYPES, emptyDraft(), INCOME_OUTCOME, ThemeModeToggle(), DateRangeProvider(), Props, TABS (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (19): Props, ACCOUNT_TYPE_COLORS, ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_ORDER, formatCompact(), formatCurrency(), formatMonth(), formatMonthShort() (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.1
Nodes (9): style, UploadButtonProps, Investment, style, UploadInvestButtonProps, Props, api, TransactionsQueryParams (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.19
Nodes (12): code:bash (docker compose down -v && docker compose up --build), code:block2 (server/migrations/001_add_something.sql), code:bash (cd server && npm test    # 67 tests; the database ones skip ), code:bash (cp .env.example .env      # fill in DB_PASSWORD), code:bash (docker compose exec server npm run seed), Database changes, Local development, Rolling back (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.22
Nodes (8): Cosmetics, Palette, PaletteColor, PaletteOptions, TypeBackground, TypographyPropsVariantOverrides, TypographyVariants, TypographyVariantsOptions

### Community 11 - "Community 11"
Cohesion: 0.31
Nodes (5): formatCurrency(), TagProgress(), formatCurrency(), formatMonth(), TagDetails()

### Community 12 - "Community 12"
Cohesion: 0.22
Nodes (4): DashboardBox, DeletePopupProps, style, Props

### Community 14 - "Community 14"
Cohesion: 0.5
Nodes (3): Changing the schema, code:bash (docker compose down -v && docker compose up --build), Database

### Community 15 - "Community 15"
Cohesion: 0.5
Nodes (3): code:js (export default {), Expanding the ESLint configuration, React + TypeScript + Vite

## Knowledge Gaps
- **150 isolated node(s):** `app`, `MIGRATIONS_DIR`, `ImportResult`, `ParsedRow`, `DATABASE_DIR` (+145 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `FinanceManager` connect `Community 4` to `Community 2`, `Community 13`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **What connects `app`, `MIGRATIONS_DIR`, `ImportResult` to the rest of the system?**
  _150 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._