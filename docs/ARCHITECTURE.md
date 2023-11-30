# 🏰 Bandage Castle Architecture

A friendly tour of how the castle's software fits together. 🧭

> 📅 Last updated: November 2023 (Priya)

---

## 🗺️ The big picture

```
                   ┌──────────────────────────────┐
   🧙 Browser ───▶ │  apps/web  (React + Vite)    │
                   │  http://localhost:5173       │
                   └──────────────┬───────────────┘
                                  │  /api/*  (Vite proxy, cookie session)
                                  ▼
                   ┌──────────────────────────────┐        ┌──────────────┐
                   │  apps/api  (Express)         │ ─────▶ │  🔴 Redis     │
                   │  http://localhost:3001       │ cache  │  (optional)  │
                   │                              │        └──────────────┘
                   │  ┌──────────┐ ┌───────────┐  │
                   │  │ modules/ │ │  legacy/  │  │
                   │  │ (Prisma) │ │ (mysql2)  │  │
                   │  └────┬─────┘ └─────┬─────┘  │
                   └───────┼─────────────┼────────┘
                           ▼             ▼
                   ┌──────────────────────────────┐
                   │  🐬 MySQL 8                  │
                   │  tbl_* (2022) + new tables   │
                   └──────────────────────────────┘
```

## 🧩 Modules

| Module | Folder | Data access | Owner |
| --- | --- | --- | --- |
| 🔐 Auth | `modules/auth` | Prisma | Priya |
| 👥 Users & Roles | `modules/users` | Prisma | Priya |
| 📖 Species | `modules/species` | Prisma + 🔴 cache | Priya |
| 🏚️ Lairs | `modules/lairs` | Prisma | Priya |
| 🚪 Intake | `modules/intake` | Prisma | Tobias |
| 🩺 Medical | `modules/medical` | Prisma | Tobias |
| 🎫 Tickets | `modules/tickets` | Prisma | Tobias |
| 📦 Supplies | `modules/supplies` | Prisma | Tobias |
| 🍖 Feeding | `modules/feeding` | Prisma | Tobias |
| 🏛️ Hiring Hall | `modules/hiring` | Prisma | Priya, Tobias |
| 🐉 Monsters | `legacy/monsters` | mysql2 | (Gorm) |
| 🧾 Customers | `legacy/customers` | mysql2 | (Gorm) |
| 🛏️ Stays | `legacy/stays` + `modules/stays` (extensions) | mysql2 + Prisma | (Gorm), Tobias |
| 💰 Billing | `legacy/billing` | mysql2 | (Gorm) |
| 🐦 Raven Post | `legacy/ravenPost` | mysql2 | (Gorm) |
| 📊 Reports | `legacy/reports` | mysql2 | (Gorm) |

The `legacy/` modules are migrated to Prisma one by one, see [ADR-004](adr/004-prisma-everywhere.md). Target: end of 2023. 🎯

## 🔐 Requests and sessions

1. The browser sends the `bc_session` cookie with every `/api` request.
2. `authenticate` (runs for every request) verifies the JWT and loads the user and their roles into `req.user`.
3. Module routes guard themselves with `requireRole(...)`. Legacy routes use `checkAuth`, which just checks that `req.user` exists.
4. Errors thrown in modules end up in `errorHandler`, which turns them into JSON.

## 🗄️ Database

- One MySQL 8 database, configured by `DATABASE_URL` in the root `.env`. Prisma and mysql2 both read it.
- Schema and migrations live in `prisma/`. Never change the database by hand; add a migration.
- The `tbl_*` tables are from 2022 and have no foreign keys, which is why Prisma runs with `relationMode = "prisma"`.

## 🔴 Caching

Slow read endpoints (the species list) go through `cache.ts`. With `REDIS_URL` set it uses Redis, otherwise an in-memory map. Writes invalidate by key prefix.

## 🐦 Notifications

Customers are notified by **Raven Post** (`legacy/ravenPost`). Messages go into `tbl_raven` and a loop "sends" them every 15 seconds (it logs them, the ravens are imaginary).

## 🧪 Tests

Vitest for everything (`npm test`). Unit tests mock Prisma; a few tests talk to the real database.
