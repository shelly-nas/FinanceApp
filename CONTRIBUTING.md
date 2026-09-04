# Working on this repo

## Versioning is automatic

You never edit a version number. The version is derived from your commit
messages, and a merge to `main` is what publishes it.

Write commit titles in [Conventional Commits](https://www.conventionalcommits.org)
form. The prefix decides the bump:

| Prefix | Bump | Example |
|---|---|---|
| `fix:` | patch — 1.0.0 → 1.0.1 | `fix: skip duplicate rows on re-import` |
| `feat:` | minor — 1.0.0 → 1.1.0 | `feat: suggest transfers between own accounts` |
| `feat!:` or `BREAKING CHANGE:` in the body | major — 1.0.0 → 2.0.0 | `feat!: drop the legacy upload endpoint` |
| `docs:` `chore:` `ci:` `test:` `refactor:` | none on their own | `docs: explain the migration flow` |

An optional scope narrows it: `fix(import): …`, `feat(tags): …`.

### What happens after you merge to main

1. `release-please` reads the commits since the last tag and opens (or updates) a
   pull request titled **chore(main): release x.y.z**. It contains the changelog
   entry and the bumped versions in both `package.json` files. Nothing is
   deployed at this point.
2. You merge that release PR when you want the release to go out. That merge
   creates the tag `vx.y.z` and the GitHub Release.
3. Only then do the images build, tagged `x.y.z` and `latest`, and the deploy
   runs with `IMAGE_TAG=x.y.z`.

So an ordinary merge is safe: it queues a release rather than shipping one. The
release PR is the single button, and it is the only manual step in the flow.

### Rolling back

Set `IMAGE_TAG` in production's `.env` to an earlier version and bring the stack
up. Both images are published per version, so nothing needs rebuilding.

Note that a rollback does **not** undo database migrations: an older server
against a newer schema works as long as the change was additive (a new column, a
new table), which is what migrations here should be. A destructive change needs a
deliberate down-migration, so avoid dropping or renaming columns that a running
version still selects.

## Database changes

**Until 1.0.0 ships**, the schema lives in `database/init.sql` and reference data
in `database/seed.sql`. Both run on the first start of an empty data volume.
There is no installed database to migrate from, so a change goes straight into
those files - wipe the volume and start again:

```bash
docker compose down -v && docker compose up --build
```

**After 1.0.0 is running somewhere with data in it**, that stops being enough:
the entrypoint scripts are never re-run against an existing volume. From that
point a schema change is a numbered file under `server/migrations/`, which the
server applies on startup and records in `schema_migrations`:

```
server/migrations/001_add_something.sql
```

Rules that matter from then on:

- **Update `database/init.sql` alongside every migration**, so a fresh install
  and a migrated one end up with the same schema.
- **Number sequentially, no gaps, no duplicates.** CI fails on a duplicate
  number. Two branches both adding `001_` merge cleanly in git and then collide
  in production, where one is recorded as applied and the other silently never
  runs.
- **Write it idempotently** (`IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`). CI
  applies every migration twice and the second run must be a no-op.
- **Additive, wherever possible.** A column the previous version still selects
  cannot be dropped without breaking a rollback.

CI applies the schema to a fresh Postgres on every change, so a broken one fails
before it reaches main.

## Tests

```bash
cd server && npm test    # 67 tests; the database ones skip without DB_HOST
cd client && npm test    # 16 tests
```

Three areas are covered, chosen because a mistake there produces a wrong figure
rather than an error:

- **CSV parsing per bank** (`server/src/utils/parseBankRow.ts`) - five column
  mappings, three date formats, two amount conventions. A misread date files a
  transaction in the wrong month; a misread sign turns spending into income.
- **The summary queries** - the debit/credit sign logic is restated in three
  separate SQL statements, and the transfer exclusion has to hold in the
  summaries while *not* holding in the account balances.
- **Month arithmetic** (`client/src/utils/monthRange.ts`) - stepping across
  month lengths and year boundaries.

The server's database tests need Postgres. Point `DB_HOST`/`DB_PORT`/... at a
throwaway instance; without one they skip rather than fail, so `npm test` works
anywhere. CI provides a service container.

## Local development


```bash
cp .env.example .env      # fill in DB_PASSWORD
docker compose up --build
```

The server applies migrations on startup. Seed the categories once — the
transactions table has a foreign key onto them, so imports fail without:

```bash
docker compose exec server npm run seed
```

`GET /api/health` reports the running version.
