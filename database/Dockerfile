# Production database image.
#
# The schema is baked in rather than bind-mounted: the deploy workflow copies
# only docker-compose.yaml to the runner, so a host path like
# ./database/initProd.sql cannot resolve there - Docker would silently create
# an empty directory in its place and Postgres would start with no schema.
FROM postgres:16-alpine

COPY initProd.sql /docker-entrypoint-initdb.d/01-init-schema.sql
