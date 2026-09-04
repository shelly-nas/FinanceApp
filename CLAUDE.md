## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- ALWAYS read graphify-out/GRAPH_REPORT.md before reading any source files, running grep/glob searches, or answering codebase questions. The graph is your primary map of the codebase.
- IF graphify-out/wiki/index.md EXISTS, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

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
