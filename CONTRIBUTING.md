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

The schema lives in `server/migrations/`, applied by the server as it starts. The
bootstrap directory of the postgres image is not used: it only ever runs against
an empty data volume, and production's volume is a bind mount that outlives the
container.

To change the schema, add a file — never edit one that has already shipped, since
applied migrations are recorded by filename and are not re-run:

```
server/migrations/004_add_something.sql
```

Rules that matter:

- **Number sequentially, no gaps, no duplicates.** CI fails on a duplicate
  number. Two branches both adding `004_` merge cleanly in git and then collide
  in production, where one is recorded as applied and the other silently never
  runs.
- **Write it idempotently** (`IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`). CI
  applies every migration twice and the second run must be a no-op.
- **Additive, wherever possible.** A column the previous version still selects
  cannot be dropped without breaking a rollback.
- **Schema only.** Reference data belongs in `seed_categories.sql`, run
  deliberately with `npm run seed`.

CI applies the migrations to a fresh Postgres on every change, so a broken one
fails before it reaches main.

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
