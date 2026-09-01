# Graph Report - FinanceApp  (2026-09-01)

## Corpus Check
- 46 files · ~16,133 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 192 nodes · 262 edges · 17 communities (11 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9181e028`
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

## God Nodes (most connected - your core abstractions)
1. `FinanceManager` - 20 edges
2. `useDateRange()` - 9 edges
3. `formatDate()` - 7 edges
4. `predictCategory()` - 6 edges
5. `preprocessText()` - 5 edges
6. `trainModel()` - 5 edges
7. `classifyWith()` - 5 edges
8. `useColorMode()` - 5 edges
9. `bankMappings` - 4 edges
10. `SpendingBreakdown()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `ThemedApp()` --calls--> `useColorMode()`  [EXTRACTED]
  client/src/App.tsx → client/src/theme/ColorModeContext.tsx
- `DateRange()` --calls--> `useDateRange()`  [EXTRACTED]
  client/src/scenes/dateRange/index.tsx → client/src/scenes/dateRange/DateRangeContext.tsx
- `ThemeModeToggle()` --calls--> `useColorMode()`  [EXTRACTED]
  client/src/components/ThemeModeToggle.tsx → client/src/theme/ColorModeContext.tsx
- `classifyWith()` --calls--> `matchMerchantRule()`  [EXTRACTED]
  server/src/machineLearningModels/categoryModel.ts → server/src/machineLearningModels/dutchMerchantRules.ts
- `TransactionDetails()` --calls--> `useDateRange()`  [EXTRACTED]
  client/src/scenes/dashboard/TransactionDetails.tsx → client/src/scenes/dateRange/DateRangeContext.tsx

## Communities (17 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.1
Nodes (21): ArrowButton, ExchangeType, IncomeExpenseItem, PeriodSummary(), Props, splitIncomeExpense(), SortableSpendingTableProps, SortableTransactionTableProps (+13 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (15): ThemeModeToggle(), DateRangeProvider(), Props, App(), ThemedApp(), darkBackground, darkGrey, themeSettings() (+7 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (11): filter, TagOption, TagPickerProps, Investment, style, Transaction, api, Tag (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.16
Nodes (11): entries, entry, idList, merchant, reformatDate(), router, upload, asnCategoryMap (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.24
Nodes (8): classifyWith(), DUTCH_STOP_WORDS, predictCategory(), preprocessText(), trainModel(), dutchMerchantRules, matchMerchantRule(), MerchantRule

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (5): style, UploadButtonProps, AccountCategory, AccountsOverview(), groupByAccountType()

### Community 7 - "Community 7"
Cohesion: 0.22
Nodes (8): Cosmetics, Palette, PaletteColor, PaletteOptions, TypeBackground, TypographyPropsVariantOverrides, TypographyVariants, TypographyVariantsOptions

### Community 8 - "Community 8"
Cohesion: 0.31
Nodes (5): formatCurrency(), TagProgress(), formatCurrency(), formatMonth(), TagDetails()

### Community 9 - "Community 9"
Cohesion: 0.22
Nodes (4): DashboardBox, DeletePopupProps, style, Props

### Community 11 - "Community 11"
Cohesion: 0.5
Nodes (3): code:js (export default {), Expanding the ESLint configuration, React + TypeScript + Vite

## Knowledge Gaps
- **52 isolated node(s):** `app`, `DUTCH_STOP_WORDS`, `MerchantRule`, `dutchMerchantRules`, `merchant` (+47 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `FinanceManager` connect `Community 3` to `Community 10`, `Community 5`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `app`, `DUTCH_STOP_WORDS`, `MerchantRule` to the rest of the system?**
  _52 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._