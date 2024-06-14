# 📜 Changelog

All notable changes to Bandage Castle. 🩹🏰

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/). Newest first.

---

## [2024.06] — June 2024

### ✨ Added
- 💰 **Billing v2** (behind `ENABLE_BILLING_V2`): copper-based invoice engine, v2 invoice list with payments, backfill script for old invoices. See ADR-006.
- 🚩 Feature flags (`feature_flags` table, `/api/flags`, `useFlags()`).
- 🔔 Notification bell and `NotificationService` (ADR-007).
- 🛏️ New stay page with intake summary, lair, extensions and invoices in one place.
- 📦 Add new supplies straight from the supplies page.

### ⚡ Changed
- 📖 Species list loads in 3 queries instead of ~120.
- ⚛️ React Query and date-fns introduced in the web app.

### 🗑️ Removed
- 🔴 Redis species cache (stale data, nobody ran Redis).

---

## [2023.12] — December 2023

### ✨ Added
- 🏛️ **Hiring Hall**: listings, applications with references, hire contracts, "available soon".
- 🍖 Daily feeding schedule generated from species and lair data.
- ⏳ Stay extensions.
- 📦 Supplies inventory with low-stock warnings.
- 🎫 Tickets with comments and assignees.
- 🩺 Medical records, treatments and prescriptions, vet dashboard.
- 🚪 Intake form.
- 🛠️ `npm run setup`, `npm run db:check`, `npm run db:reset`.
- 🧹 ESLint and Prettier.

### ⚡ Changed
- ⬆️ Prisma 5, Vite 5, Vitest 1, TypeScript 5.3. Node 18.17+.

---

## [2023.04] — April 2023

### ✨ Added
- 🏚️ Lairs with capacity, habitat settings and compatibility checks.
- 📖 Species compendium.
- 👥 Admin user management, multiple roles per user.

### ⚡ Changed
- 📦 Monorepo with npm workspaces (`apps/api`, `apps/web`, `packages/shared`).
- 🗄️ Prisma introduced (ADR-004). Legacy code moved to `apps/api/src/legacy`.
- 🍪 Sessions are httpOnly cookies now (ADR-005).

---

## [2022.12] — The Founding

- 🐉 Monsters, customers, stays, invoices, Raven Post and reports. Built by Gorm in one very long year.
