# Graph Report - FinanceApp  (2026-08-31)

## Corpus Check
- 40 files · ~10,462 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 135 nodes · 152 edges · 20 communities (8 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a2f04431`
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

## God Nodes (most connected - your core abstractions)
1. `FinanceManager` - 12 edges
2. `useDateRange()` - 9 edges
3. `formatDate()` - 7 edges
4. `predictCategory()` - 4 edges
5. `SpendingBreakdown()` - 4 edges
6. `PeriodSummary()` - 4 edges
7. `DbContext` - 3 edges
8. `preprocessText()` - 3 edges
9. `trainModel()` - 3 edges
10. `TransactionDetails()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `DateRange()` --calls--> `useDateRange()`  [EXTRACTED]
  client/src/scenes/dateRange/index.tsx → client/src/scenes/dateRange/DateRangeContext.tsx
- `TransactionDetails()` --calls--> `useDateRange()`  [EXTRACTED]
  client/src/scenes/dashboard/TransactionDetails.tsx → client/src/scenes/dateRange/DateRangeContext.tsx
- `SpendingBreakdown()` --calls--> `useDateRange()`  [EXTRACTED]
  client/src/scenes/dashboard/SpendingBreakdown.tsx → client/src/scenes/dateRange/DateRangeContext.tsx
- `PeriodSummary()` --calls--> `useDateRange()`  [EXTRACTED]
  client/src/scenes/dashboard/PeriodSummary.tsx → client/src/scenes/dateRange/DateRangeContext.tsx
- `TransactionDetails()` --calls--> `formatDate()`  [EXTRACTED]
  client/src/scenes/dashboard/TransactionDetails.tsx → client/src/scenes/dateRange/DateRangeContext.tsx

## Communities (20 total, 12 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.14
Nodes (17): ArrowButton, ExchangeType, IncomeExpenseItem, PeriodSummary(), Props, splitIncomeExpense(), categorizeItems(), SpendingBreakdown() (+9 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (10): entries, entry, idList, router, upload, predictCategory(), preprocessText(), trainModel() (+2 more)

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (6): Investment, style, DateRangeProvider(), api, TransactionsQueryParams, store

### Community 4 - "Community 4"
Cohesion: 0.17
Nodes (10): Cosmetics, Palette, PaletteColor, PaletteOptions, TypeBackground, TypographyPropsVariantOverrides, TypographyVariants, TypographyVariantsOptions (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (4): DashboardBox, DeletePopupProps, style, Props

### Community 10 - "Community 10"
Cohesion: 0.67
Nodes (3): AccountCategory, AccountsOverview(), groupByAccountType()

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (3): code:js (export default {), Expanding the ESLint configuration, React + TypeScript + Vite

## Knowledge Gaps
- **44 isolated node(s):** `app`, `router`, `upload`, `entries`, `entry` (+39 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DateRangeProvider()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `themeSettings` connect `Community 4` to `Community 2`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `FinanceManager` connect `Community 3` to `Community 1`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `app`, `router`, `upload` to the rest of the system?**
  _44 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._