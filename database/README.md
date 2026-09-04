# Database

The schema is **not** defined here any more.

It lives in `server/migrations/` and is applied by the server on startup, so an
existing database picks up changes instead of only a freshly created one. The
bootstrap directory `/docker-entrypoint-initdb.d` runs exclusively against an
empty data volume, and the production volume is a bind mount that outlives the
container - anything placed there would never reach a running installation.

- `server/migrations/NNN_*.sql` - schema, applied in filename order, tracked in
  `schema_migrations`.
- `server/migrations/seed_categories.sql` - the category reference data. Run it
  once with `npm run seed`; it is safe to re-run and never overwrites edits.

Roles and passwords come from `POSTGRES_USER` / `POSTGRES_PASSWORD` on the
postgres image. They are not defined in SQL.
