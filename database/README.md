# Database

The schema lives in `init.sql`, the category reference data in `seed.sql`. Both
run via `/docker-entrypoint-initdb.d` on the **first start of an empty data
volume**, in filename order.

- **Development** mounts them from this directory (see `docker-compose.yml`).
- **Production** gets them baked into an image (`Dockerfile`), because the deploy
  workflow copies only `docker-compose.prod.yml` to the host - a bind mount to a
  path that does not exist there would silently produce an empty directory and a
  database with no schema.

## Demo data (local only)

`seed-demo.sql` fills an empty database with six months of transactions across
three accounts, so the dashboard, the charts and the review flows have something
to show without importing a real bank export. It covers the cases that are easy
to forget when testing by hand: uncategorised rows for the review badge, an
account seen in transactions but not registered, a confirmed transfer pair, an
unconfirmed one, a one-sided transfer into an investment account, and two event
tags.

It is mounted as `03-seed-demo.sql` by `docker-compose.yml` **only**. `Dockerfile`
copies `init.sql` and `seed.sql` by name and deliberately leaves this file out,
so there is no path by which demo data reaches production.

The script skips itself if any transaction already exists, so it does nothing on
a volume that already holds data. To get it, start from an empty volume:

```bash
docker compose down -v && docker compose up --build
```

**`down -v` destroys the database volume and everything imported into it.** On a
volume with real data, take a dump first (`docker compose exec db pg_dump ...`).

Roles and passwords come from `POSTGRES_USER` / `POSTGRES_PASSWORD` on the
postgres image. They are not defined in SQL.

## Changing the schema

Version 1.0.0 has not shipped, so there is no installed database to migrate from
and a change goes straight into `init.sql`. Wipe the volume and start again:

```bash
docker compose down -v && docker compose up --build
```

**That stops working the moment 1.0.0 runs somewhere with data in it.** The
entrypoint scripts are never re-run against an existing volume, so from then on a
schema change has to be a numbered migration under `server/migrations/`, which
the server applies on startup — and `init.sql` has to be updated alongside it, so
a fresh install and a migrated one end up identical.
