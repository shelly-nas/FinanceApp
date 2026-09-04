# Graph Report - FinanceApp  (2026-09-04)

## Corpus Check
- 63 files · ~31,360 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 332 nodes · 452 edges · 21 communities (16 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `21eb8ccd`
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

## God Nodes (most connected - your core abstractions)
1. `FinanceManager` - 31 edges
2. `useDateRange()` - 9 edges
3. `Belangrijk, niet blokkerend` - 8 edges
4. `runMigrations()` - 7 edges
5. `parseBankRow()` - 7 edges
6. `FinanceApp — doorlichting` - 7 edges
7. `formatDate()` - 7 edges
8. `predictCategory()` - 6 edges
9. `Opruimwerk` - 6 edges
10. `identityKey()` - 5 edges

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

## Communities (21 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (24): ACCOUNT_TYPES, Accounts(), DraftAccount, emptyDraft(), filter, TagOption, TagPickerProps, Investment (+16 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (6): FinanceManager, ImportResult, computeImportHash(), HashableEntry, identityKey(), normalise()

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (22): ensureMigrationsTable(), MIGRATIONS_DIR, readMigrationFiles(), runMigrations(), errorHandler(), app, start(), batch (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (30): 10. De rekeningtabel is met placeholder-IBAN's gevuld, 11. De transactietabel bouwt kolommen op uit `Object.keys(row)`, 12. Twee formatCurrency-definities, zeven keer gekopieerd, 13. Het `Transaction`-type staat vier keer opnieuw gedeclareerd, 14. De `Transactions`-klasse is een lege huls, 15. `getCategorySums` gebruikt vaste parameterindexen, 16. Ongebruikte parameters en dode routes, 1. Overboekingen tussen eigen rekeningen tellen dubbel mee (+22 more)

### Community 4 - "Community 4"
Cohesion: 0.1
Nodes (19): ArrowButton, ExchangeType, IncomeExpenseItem, PeriodSummary(), Props, splitIncomeExpense(), SortableSpendingTableProps, SortableTransactionTableProps (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.13
Nodes (18): ACCOUNT_TYPES, entries, entry, idList, merchant, reformatDate(), router, upload (+10 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (16): ThemeModeToggle(), DateRangeProvider(), Props, TABS, App(), ThemedApp(), darkBackground, darkGrey (+8 more)

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (10): DbContext, classifyWith(), DUTCH_STOP_WORDS, predictCategory(), preprocessText(), trainModel(), dutchMerchantRules, matchMerchantRule() (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (13): DateRangeContext, DateRangeContextProps, anchor, before, { firstDay, lastDay }, { lastDay }, march, now (+5 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (5): style, UploadButtonProps, style, UploadInvestButtonProps, Props

### Community 10 - "Community 10"
Cohesion: 0.2
Nodes (9): code:block1 (server/migrations/004_add_something.sql), code:bash (cp .env.example .env      # fill in DB_PASSWORD), code:bash (docker compose exec server npm run seed), Database changes, Local development, Rolling back, Versioning is automatic, What happens after you merge to main (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (8): Cosmetics, Palette, PaletteColor, PaletteOptions, TypeBackground, TypographyPropsVariantOverrides, TypographyVariants, TypographyVariantsOptions

### Community 12 - "Community 12"
Cohesion: 0.31
Nodes (5): formatCurrency(), TagProgress(), formatCurrency(), formatMonth(), TagDetails()

### Community 13 - "Community 13"
Cohesion: 0.22
Nodes (4): DashboardBox, DeletePopupProps, style, Props

### Community 14 - "Community 14"
Cohesion: 0.5
Nodes (3): code:js (export default {), Expanding the ESLint configuration, React + TypeScript + Vite

## Knowledge Gaps
- **114 isolated node(s):** `app`, `MIGRATIONS_DIR`, `ImportResult`, `ParsedRow`, `hasDatabase` (+109 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `FinanceManager` connect `Community 1` to `Community 7`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `DbContext` connect `Community 7` to `Community 2`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `app`, `MIGRATIONS_DIR`, `ImportResult` to the rest of the system?**
  _114 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._