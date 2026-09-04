# Graph Report - FinanceApp  (2026-09-04)

## Corpus Check
- 56 files · ~23,917 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 267 nodes · 347 edges · 23 communities (15 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a9b89af1`
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
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]

## God Nodes (most connected - your core abstractions)
1. `FinanceManager` - 26 edges
2. `useDateRange()` - 9 edges
3. `Belangrijk, niet blokkerend` - 8 edges
4. `formatDate()` - 7 edges
5. `FinanceApp — doorlichting` - 7 edges
6. `predictCategory()` - 6 edges
7. `Opruimwerk` - 6 edges
8. `runMigrations()` - 5 edges
9. `identityKey()` - 5 edges
10. `preprocessText()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `start()` --calls--> `runMigrations()`  [EXTRACTED]
  server/src/index.ts → server/src/context/migrations.ts
- `ThemedApp()` --calls--> `useColorMode()`  [EXTRACTED]
  client/src/App.tsx → client/src/theme/ColorModeContext.tsx
- `DateRange()` --calls--> `useDateRange()`  [EXTRACTED]
  client/src/scenes/dateRange/index.tsx → client/src/scenes/dateRange/DateRangeContext.tsx
- `ThemeModeToggle()` --calls--> `useColorMode()`  [EXTRACTED]
  client/src/components/ThemeModeToggle.tsx → client/src/theme/ColorModeContext.tsx
- `classifyWith()` --calls--> `matchMerchantRule()`  [EXTRACTED]
  server/src/machineLearningModels/categoryModel.ts → server/src/machineLearningModels/dutchMerchantRules.ts

## Communities (23 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (17): filter, TagOption, TagPickerProps, style, UploadButtonProps, Investment, style, Transaction (+9 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (19): ArrowButton, ExchangeType, IncomeExpenseItem, PeriodSummary(), Props, splitIncomeExpense(), SortableSpendingTableProps, categorizeItems() (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (30): 10. De rekeningtabel is met placeholder-IBAN's gevuld, 11. De transactietabel bouwt kolommen op uit `Object.keys(row)`, 12. Twee formatCurrency-definities, zeven keer gekopieerd, 13. Het `Transaction`-type staat vier keer opnieuw gedeclareerd, 14. De `Transactions`-klasse is een lege huls, 15. `getCategorySums` gebruikt vaste parameterindexen, 16. Ongebruikte parameters en dode routes, 1. Overboekingen tussen eigen rekeningen tellen dubbel mee (+22 more)

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (18): entries, entry, idList, merchant, reformatDate(), router, upload, classifyWith() (+10 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (15): ThemeModeToggle(), DateRangeProvider(), Props, App(), ThemedApp(), darkBackground, darkGrey, themeSettings() (+7 more)

### Community 6 - "Community 6"
Cohesion: 0.31
Nodes (7): ensureMigrationsTable(), MIGRATIONS_DIR, readMigrationFiles(), runMigrations(), errorHandler(), app, start()

### Community 7 - "Community 7"
Cohesion: 0.2
Nodes (9): code:block1 (server/migrations/004_add_something.sql), code:bash (cp .env.example .env      # fill in DB_PASSWORD), code:bash (docker compose exec server npm run seed), Database changes, Local development, Rolling back, Versioning is automatic, What happens after you merge to main (+1 more)

### Community 8 - "Community 8"
Cohesion: 0.31
Nodes (5): formatCurrency(), TagProgress(), formatCurrency(), formatMonth(), TagDetails()

### Community 9 - "Community 9"
Cohesion: 0.22
Nodes (4): DashboardBox, DeletePopupProps, style, Props

### Community 10 - "Community 10"
Cohesion: 0.22
Nodes (8): Cosmetics, Palette, PaletteColor, PaletteOptions, TypeBackground, TypographyPropsVariantOverrides, TypographyVariants, TypographyVariantsOptions

### Community 12 - "Community 12"
Cohesion: 0.46
Nodes (5): ImportResult, computeImportHash(), HashableEntry, identityKey(), normalise()

### Community 14 - "Community 14"
Cohesion: 0.67
Nodes (3): AccountCategory, AccountsOverview(), groupByAccountType()

### Community 15 - "Community 15"
Cohesion: 0.5
Nodes (3): code:js (export default {), Expanding the ESLint configuration, React + TypeScript + Vite

## Knowledge Gaps
- **85 isolated node(s):** `app`, `MIGRATIONS_DIR`, `ImportResult`, `DUTCH_STOP_WORDS`, `MerchantRule` (+80 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `FinanceManager` connect `Community 4` to `Community 11`, `Community 12`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `app`, `MIGRATIONS_DIR`, `ImportResult` to the rest of the system?**
  _85 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._