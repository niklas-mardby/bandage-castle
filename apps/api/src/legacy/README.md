# 🦴 legacy/

The original Bandage Castle API, written by Gorm in 2022 and moved here in February 2023.

## What's in here

| Folder | What | Still used? |
| --- | --- | --- |
| `monsters/` | monster list, search, detail, photo placeholders | ✅ yes |
| `customers/` | customer CRUD | ✅ yes |
| `stays/` | booking, check-in, check-out, cancel | ✅ yes |
| `billing/` | invoices, payments, late fees (gold as floats) + the Billing v2 bridge | ✅ yes |
| `ravenPost/` | Raven Post notifications | ⚠️ deprecated, still called |
| `reports/` | occupancy, revenue, CSV export | ✅ yes |
| `tournament/` | Monster Arena | ❌ on hold since 2022 |
| `db.ts` | the `mysql2` pool (callbacks *and* promises) | ✅ yes |
| `middleware/checkAuth.ts` | adapter from the new session to the old `req.user.role` | ✅ yes |

## Rules of the museum 🏛️

- No new features here. New code goes in `../modules`.
- Bug fixes are fine. Keep them small.
- When you move a module to Prisma, delete it here and update [ADR-004](../../../../docs/adr/004-prisma-everywhere.md).
- `tsconfig.legacy.json` is loose on purpose. Don't copy its settings.
