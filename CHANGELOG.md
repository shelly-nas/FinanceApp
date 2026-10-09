# Changelog

## [1.1.0](https://github.com/shelly-nas/FinanceApp/compare/v1.0.0...v1.1.0) (2026-10-09)


### Features

* add comprehensive tests for bank row parsing and summaries ([0bacbad](https://github.com/shelly-nas/FinanceApp/commit/0bacbaddb788d63b2dff19117603817e79672a11))
* add tagging functionality and improve ML model integration ([a5cb066](https://github.com/shelly-nas/FinanceApp/commit/a5cb0664c5aae05ceb3574bcc5dcddae63a16876))
* edit the event names ([5e9a1d8](https://github.com/shelly-nas/FinanceApp/commit/5e9a1d8f655c9e1bd96201db376bc106aae2cd29))
* enhance account overview and net worth history features ([a7a5f79](https://github.com/shelly-nas/FinanceApp/commit/a7a5f79e22890a186b2095c31e898fbcce2a50d8))
* enhance error handling and add pagination to transaction endpoints ([21eb8cc](https://github.com/shelly-nas/FinanceApp/commit/21eb8ccda5cdb31084af72f02840e848091e7a64))
* Enhance transaction upload handling for ASN bank statements ([e4dc9cc](https://github.com/shelly-nas/FinanceApp/commit/e4dc9ccb85c3223b6baa44a231b2550e8bee3eb2))
* Enhance transaction upload handling for ASN bank statements ([1e6980b](https://github.com/shelly-nas/FinanceApp/commit/1e6980b7cd2b9cc17c6c694e5c6c99d8df71fcdf))
* implement backup and restore functionality for financial data ([ae5d99a](https://github.com/shelly-nas/FinanceApp/commit/ae5d99ad1df36e1267f269f3e7a01f02c813dc96))
* implement category management with CRUD operations and foreign key handling ([afd8f53](https://github.com/shelly-nas/FinanceApp/commit/afd8f53c4402f7cb3736e0858cd0752f30bc2252))
* implement dark mode support with theme toggle functionality ([cac2911](https://github.com/shelly-nas/FinanceApp/commit/cac29110f7305d01f56e05507d1d2c1f79247109))
* implement dark mode support with theme toggle functionality ([26c94a1](https://github.com/shelly-nas/FinanceApp/commit/26c94a1c46fbcae430746a9c97a56af69e562cac))
* implement one-sided transfer handling and internal marking ([cda5584](https://github.com/shelly-nas/FinanceApp/commit/cda558428dbdf0d86759d98c10174857eeabe118))
* implement transaction search and bulk edit functionality ([57a672a](https://github.com/shelly-nas/FinanceApp/commit/57a672a4fb3fd95327f7df157975fa64084c51f0))
* **migrations:** add SQL migration files for schema and data seeding ([a9b89af](https://github.com/shelly-nas/FinanceApp/commit/a9b89af18be27db4b903053a31da0bc1a938187e))
* refactor header component to use buttons instead of menu for actions ([b262609](https://github.com/shelly-nas/FinanceApp/commit/b26260940f2deed04af7fdf948be6e33a3f03005))
* remove NetWorthBanner component and its usage from App ([7205dce](https://github.com/shelly-nas/FinanceApp/commit/7205dce85fb0f711d879de3462fd6461f4d13a00))
* update header tabs and remove unused menu items ([8dd5916](https://github.com/shelly-nas/FinanceApp/commit/8dd59161440f75c4d903cbe209a95e70f3f849dc))


### Bug Fixes

* align deploy env var names with compose interpolation ([e590458](https://github.com/shelly-nas/FinanceApp/commit/e590458e7aab2136a7c4c46b5e400aba1b85f082))
* bake prod schema into db image instead of bind-mounting ([9258888](https://github.com/shelly-nas/FinanceApp/commit/9258888db7f44a17001cd81490f3aff324d18e07))
* migrate the production schema to match init.sql ([b76a348](https://github.com/shelly-nas/FinanceApp/commit/b76a348a980a030ad576510f94450e2d763e563e))
* migrate the production schema to match init.sql ([c070462](https://github.com/shelly-nas/FinanceApp/commit/c070462368d9a21a1dd1e9d7c46324f62f726057))
* remove fallback values for database credentials in deploy workflow ([38a0d82](https://github.com/shelly-nas/FinanceApp/commit/38a0d821baaf618854a3707cf6c376d53fc1775c))
* tell Traefik which network reaches the containers ([c640129](https://github.com/shelly-nas/FinanceApp/commit/c6401295d229edb235d6eab47c737197935088c8))
* update environment variable references in docker-compose for consistency ([2d9c181](https://github.com/shelly-nas/FinanceApp/commit/2d9c181ef5002eeb8426598279567e42c35fde77))
* update PostgreSQL volume configuration to use bind mount ([97cf4da](https://github.com/shelly-nas/FinanceApp/commit/97cf4da97cbff4167e304954cc6fcd5f8153c904))
* update PostgreSQL volume configuration to use bind mount ([aac3cba](https://github.com/shelly-nas/FinanceApp/commit/aac3cbaa8fb7832fd611efe78a1b87db6c432d85))


### Documentation

* describe migrations as required for every schema change ([be01a52](https://github.com/shelly-nas/FinanceApp/commit/be01a523fb3a780a9f7f6fff89df353521184960))
* point CLAUDE.md at the shelly-fundamentals skills ([9d38cd0](https://github.com/shelly-nas/FinanceApp/commit/9d38cd03087b87c2d2bb33b03d8af0b941fb6812))


### Build & Deployment

* deploy pull requests to finance-acc.shelly-nas.nl ([2a05478](https://github.com/shelly-nas/FinanceApp/commit/2a05478702a441dc4d7df97f0c6f3718dddbca7d))
* deploy pull requests to finance-acc.shelly-nas.nl ([c6bb39e](https://github.com/shelly-nas/FinanceApp/commit/c6bb39e288ce9cecacca96a11d6bd3ff8ce51091))
* upgrade to node 22 ([19dea0d](https://github.com/shelly-nas/FinanceApp/commit/19dea0dce0f1605212ed9b6d0597060a95754683))
* upgrade to node 22 ([e95c795](https://github.com/shelly-nas/FinanceApp/commit/e95c795a655fbb05f3e2eac0a3e39dcc44f05d85))
