# ADR-004: All data access moves to Prisma by end of 2023 🗄️

- **Status:** ✅ Accepted
- **Date:** 2023-02-14
- **Deciders:** Priya Valdez, Gorm Ashby

## Context

The legacy modules build SQL strings by hand with `mysql2`, mixing callbacks and promises. Types are `any` everywhere, column names leak into the front end, and there is no migration history: the schema lives in a single `schema.sql`.

## Decision

1. Adopt **Prisma** as the only data-access layer.
2. Create a baseline migration from the existing tables and map them to camelCase models.
3. All **new** modules use Prisma from day one.
4. Legacy modules are migrated one at a time. **Target: no `mysql2` imports left by 31 December 2023.**
5. When the last legacy module is migrated, remove `mysql2` and `legacy/db.ts`.

## Consequences

- 👍 Typed queries, migrations in git, no string-built SQL.
- 👎 For a while there are two ways to reach the database. Don't add new code to the old way.

## Migration tracker

- [ ] Auth
- [x] Customers (2026-05, Priya)
- [ ] Monsters
- [ ] Stays
- [ ] Billing
- [ ] Raven Post
- [ ] Reports
