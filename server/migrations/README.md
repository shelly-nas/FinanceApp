# Migrations

Production runs with data in it, and `database/init.sql` is never re-run
against an existing data volume. Every schema change is therefore a numbered
file here:

```
server/migrations/002_add_something.sql
```

`001_align_with_init_schema.sql` is the catch-up: production was created from
the old `initProd.sql`, and the schema was later rewritten in `init.sql` without
migrations. 001 adds what was missing. On a database built from `init.sql` it is
a no-op.

The server applies pending files here on startup, in filename order, recording
what it has run in `schema_migrations`. Rules: number sequentially without gaps
or duplicates (CI fails on a duplicate), write them idempotently (CI applies
every migration twice and the second run must be a no-op), and keep changes
additive so an older version can still run against the newer schema.

`database/init.sql` and the migrations must agree: a fresh install runs the init
script alone, so anything added as a migration belongs in the init script too.

Note that acc and CI build their database from `init.sql`, so they only prove a
migration is harmless on the new schema. To test one against the production
shape, build a database from the previous schema first and start the server
against it.
