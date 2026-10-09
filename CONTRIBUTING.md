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

### Reviewing a pull request on acc

Every pull request to `main` is built and deployed to
**http://finance-acc.shelly-nas.nl** by `.github/workflows/acc.yml`, and again on
every push to it. Check the change there, then merge. There is one acc
environment, so it shows whichever pull request was pushed last; to put another
branch back on it, use *Actions → Deploy to Acceptance → Run workflow*.

Acc gets a fresh database on every deploy: the schema and seed from the image,
plus `database/seed-demo.sql`. It never holds production data, and anything you
enter there is gone after the next deploy. The pull request's migrations run on
that fresh database too.

Release PRs from release-please are not deployed to acc.

Acc is taken down by the production deploy once the change on it has been
released: its containers, data and directory are removed. If acc holds a pull
request that is not in the release yet, it stays up. Every deploy, acc and
production, then removes images no container uses, dangling anonymous volumes
and build cache from the NAS.

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

All images are published per version, so nothing needs rebuilding. The deploy
deletes the `.env` in `/volume1/docker/finance-app` after every run (it holds
secrets), so recreate it first: the same values the deploy workflow writes, with
`IMAGE_TAG` set to the earlier version. Then `docker compose up -d` there, and
delete the `.env` again.

Note that a rollback does **not** undo database migrations: an older server
against a newer schema works as long as the change was additive (a new column, a
new table), which is what migrations here should be. A destructive change needs a
deliberate down-migration, so avoid dropping or renaming columns that a running
version still selects.

## Database changes

The schema lives in `database/init.sql` and reference data in
`database/seed.sql`. Both run only on the first start of an empty data volume,
so they build fresh databases (local, CI, acc) but never touch production,
which already holds data. Locally you can always start clean:

```bash
docker compose down -v && docker compose up --build
```

**Every schema change is therefore also a migration**: a numbered file under
`server/migrations/`, which the server applies on startup and records in
`schema_migrations`. Leaving out the migration is what broke the first 1.1.0
release candidate - see `server/migrations/001_align_with_init_schema.sql`:

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
