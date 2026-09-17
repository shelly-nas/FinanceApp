# Migrations

Empty on purpose.

Version 1.0.0 has not shipped, so there is no installed database to migrate
from: the schema lives in `database/init.sql`, which the postgres image runs on
the first start of an empty data volume.

**That stops being enough the moment 1.0.0 runs somewhere with data in it.** The
entrypoint script is never re-run against an existing volume, so from that point
a schema change has to be a migration:

```
server/migrations/001_add_something.sql
```

The server applies pending files here on startup, in filename order, recording
what it has run in `schema_migrations`. Rules: number sequentially without gaps
or duplicates (CI fails on a duplicate), write them idempotently (CI applies
every migration twice and the second run must be a no-op), and keep changes
additive so an older version can still run against the newer schema.

`database/init.sql` and the migrations must agree: a fresh install runs the init
script alone, so anything added as a migration belongs in the init script too.
