# Changelog

## [1.2.0](https://github.com/shelly-nas/FinanceApp/compare/v1.1.0...v1.2.0) (2026-10-10)


### Features

* **client:** adopt the shelly-nas design guidelines ([ffa8c56](https://github.com/shelly-nas/FinanceApp/commit/ffa8c56794a72215963dad21ade2c49aa518bc45))
* **client:** adopt the shelly-nas design guidelines ([0634aa6](https://github.com/shelly-nas/FinanceApp/commit/0634aa6f0be7c5354d96e666dc319b2fc6c1de4f))
* **client:** give export everything its own button in the sidebar ([e3b300a](https://github.com/shelly-nas/FinanceApp/commit/e3b300a191a60894246b57903602fc001d2d3dc2))
* **client:** show the month's key figures as tiles above the dashboard ([f2d4063](https://github.com/shelly-nas/FinanceApp/commit/f2d4063033af294b5dfa2e7ad4681f0a2ffdc3c9))


### Documentation

* describe acc teardown and NAS cleanup ([11f35a7](https://github.com/shelly-nas/FinanceApp/commit/11f35a720bbef270e66a5f184bbd9105007f6bae))
* describe the design system FinanceApp now follows ([e31e9fc](https://github.com/shelly-nas/FinanceApp/commit/e31e9fcc8428d39b5acac4539904abbebb33f681))


### Build & Deployment

* allow building and deploying an already-released version ([b366928](https://github.com/shelly-nas/FinanceApp/commit/b3669285181f01dc2280244b2d4fbbc30b6cd92b))
* allow building and deploying an already-released version ([b39fab0](https://github.com/shelly-nas/FinanceApp/commit/b39fab0da0c5b63b5dcac8added366821b9ee085))
* run CI through the shared ci-node-postgres workflow ([be76121](https://github.com/shelly-nas/FinanceApp/commit/be76121e0ced0a61ebc127227f03b57aa1ddc04c))
* shared CI workflow, renamed shared workflows and acc teardown ([a886439](https://github.com/shelly-nas/FinanceApp/commit/a886439147109ecb8afb8de2e544b54317cdb655))
* tear down acc through the shared teardown-acceptance workflow ([8fd35f3](https://github.com/shelly-nas/FinanceApp/commit/8fd35f31598a3240808cb5817abf84499a05e070))
* tear down acc when its pull request is merged or closed ([0539f8e](https://github.com/shelly-nas/FinanceApp/commit/0539f8eb55934d21845b4b8842d9bf351600977e))
* tear down acc when pull request closes ([4537c11](https://github.com/shelly-nas/FinanceApp/commit/4537c11c320df0d8c2fa55688e300716d14dd815))
* use the renamed shared workflows and tear down acc once released ([066d7ac](https://github.com/shelly-nas/FinanceApp/commit/066d7acc60ecb75673651a7c6d40735554a719fd))

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
