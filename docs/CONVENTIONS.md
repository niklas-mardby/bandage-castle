# 📏 Bandage Castle Coding Conventions

Welcome, brave developer! 🧙 These are the house rules for the Bandage Castle codebase. They keep the castle tidy, the monsters happy and the code reviews short. 🏰✨

> 💡 **Golden rule:** when you touch a file, leave it a little cleaner than you found it. Even trolls wipe their feet. 🧌

---

## 🗂️ Project layout

| Path | What lives there |
| --- | --- |
| `apps/api/src/modules/<name>/` | 🧩 One folder per feature module |
| `apps/api/src/middleware/` | 🛡️ Express middleware (`requireRole`, `validate`, `errorHandler`) |
| `apps/api/src/legacy/` | 🦴 Pre-2023 code. **Read-only museum.** Do not add new features here |
| `apps/web/src/pages/<module>/` | 🖼️ One folder of pages per module |
| `packages/shared/` | 🤝 Types, enums and helpers used by both API and web |
| `prisma/` | 🗄️ Schema, migrations and seed |

Each API module has the same three files:

```
modules/lairs/
  lairs.routes.ts    ← HTTP only: parse, call service, respond
  lairs.service.ts   ← business logic, talks to Prisma
  lairs.schema.ts    ← zod schemas for input validation
```

---

## 🟦 TypeScript

- ✅ The whole codebase is **strict**. `strict: true` is set in `tsconfig.base.json`.
- 🚫 **No `any`.** If you really don't know the type, use `unknown` and narrow it.
- 🚫 No `// @ts-ignore` or `// @ts-nocheck`. If the compiler is wrong, write a comment explaining why and use `// @ts-expect-error`.
- 🚫 No non-null assertions (`!`). Handle the `undefined` case.
- ✅ Prefer `type` over `interface` unless you need declaration merging.

---

## 🗄️ Data access

- ✅ **Always use Prisma.** See [ADR-004](adr/004-prisma-everywhere.md). Raw SQL with `mysql2` only exists in `legacy/` and is being migrated away by the end of 2023.
- ✅ Database tables are `snake_case` and plural (`lair_assignments`). Prisma models are `PascalCase` and singular (`LairAssignment`). Use `@@map` and `@map`.
- ✅ Wrap multi-step writes in `prisma.$transaction(...)`.
- 🚫 Never build SQL with string concatenation. Ever. 🐍

---

## 🛡️ Routes, validation and errors

- ✅ **All routes use `requireRole(...)`.** The old `checkAuth` + `user.role === 'STAFF'` pattern is deprecated.
- ✅ **Always validate input with zod** using the `validate(schema)` middleware. Never trust `req.body`.
- ✅ Throw `HttpError` subclasses (`NotFoundError`, `ForbiddenError`, `BadRequestError`) and let the central `errorHandler` respond. Never `res.status(500).send(...)` by hand.
- ✅ Route handlers are `async` and errors propagate via `asyncHandler`.

```ts
router.post(
  '/',
  requireRole('KEEPER', 'ADMIN'),
  validate(createLairSchema),
  asyncHandler(async (req, res) => {
    const lair = await lairService.create(req.body)
    res.status(201).json(lair)
  }),
)
```

---

## 💰 Money

- ✅ **Money is always an integer number of copper pieces.** 1 gold piece (gp) = 100 copper pieces (cp). See [ADR-006](adr/006-money-as-copper.md).
- ✅ Columns are named `*_copper` and are `INT`.
- ✅ Convert to gold only at the edge, for display, with `formatCopper()` from `packages/shared/src/money.ts`.
- 🚫 Never do arithmetic on floating-point gold. A dragon will notice the missing copper. 🐉

---

## 📅 Dates

- ✅ Use the helpers in `packages/shared/src/dates.ts`.
- ✅ Dates without a time (birth dates, pickup dates) are sent over the wire as `YYYY-MM-DD` strings.

---

## 🏷️ Naming

- ✅ `camelCase` for variables and properties (`monsterId`), `PascalCase` for types and components, `SCREAMING_SNAKE_CASE` for constants.
- ✅ JSON responses use `camelCase`. (Legacy endpoints return `snake_case` columns; don't copy that.)

---

## 🧪 Tests

- ✅ Every service gets unit tests next to it: `lairs.service.test.ts`.
- ✅ Run `npm test` before you push.
- 🚫 Don't commit `it.only`. Skipped tests (`it.skip`) need a reason and an issue number.

---

## ⚛️ Front end

- ✅ Function components and hooks. No new class components.
- ✅ Data fetching with **React Query**. Put query hooks in `hooks/queries.ts`; include everything the data depends on in the query key.
- 🚫 `useApi` and `apiFetch` in `useEffect` are legacy. Don't add new uses.
- ✅ Every page lives in `pages/<module>/` and is registered in `App.tsx`.

---

Questions? Ask Priya in #castle-dev 🦉 or open a `question` issue. Happy coding! 🩹🏰
