## shelly-nas standards

This repo follows the shelly-nas standards from the plugin
**`shelly-fundamentals@shelly-nas`** (repo `shelly-nas/shelly-fundamentals`,
enabled in `.claude/settings.json`). Use its skills for stack choices
(`stack-voorkeuren`), Docker and Traefik (`docker-traefik`), the release and
deploy pipeline (`release-deploy`), schema changes (`database-migraties`),
commit messages (`conventional-commits`) and UI (`design-richtlijnen`).
FinanceApp is the reference those standards were derived from; where this repo
already does something, keep doing it the way it does.

**Design:** `client/src/theme.ts` is the skill's theme (Figtree, blue, 4px
spacing - `sx={{ p: 6 }}` is 24px) plus a few FinanceApp additions, marked in
the file. Build screens from the shared pieces rather than restyling MUI per
page: `PageHeader` at the top of a page, `DashboardBox` for a card,
`WidgetHeader` for a card's heading, `CardTable` for a table in a card,
`Toast` for confirmations. One deliberate deviation from the guidelines:
debits are shown in red (the `debit` typography variant), always with a minus
sign, even though the guidelines reserve red for errors.

## Commit messages

Versioning is automated: `release-please` derives the next version from the
commit messages on `main`, so **every commit message must be a Conventional
Commit** — the prefix is what decides whether a release is a patch, a minor or a
major. A commit written in any other form contributes nothing to the version and
silently disappears from the changelog.

Write the title as `type(scope): summary`, where scope is optional:

| Prefix | Bump | Use for |
|---|---|---|
| `fix:` | patch | a defect in behaviour that reached the user |
| `feat:` | minor | new capability |
| `feat!:` / `BREAKING CHANGE:` in the body | major | anything that breaks an existing API, schema or deployment contract |
| `perf:` `refactor:` `docs:` `test:` `ci:` `build:` `chore:` | none | everything else |

Rules:
- One logical change per commit. A commit mixing a fix and a feature has to pick
  one prefix, and whichever it picks misreports the release.
- The summary is imperative and lowercase: `fix: skip duplicate rows on re-import`,
  not `Fixed duplicate rows.`
- A schema change carries its migration in the same commit as the code that
  needs it, so a rollback to any tag leaves the two consistent.
- Mark a breaking change with `!` **and** explain the migration path in the body.
  This is the only signal that produces a major bump.

The full flow — what happens after a merge, how the release PR works, and the
rules for migrations — is documented in CONTRIBUTING.md.
