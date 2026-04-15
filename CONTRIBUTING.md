# 🤝 Contributing to Bandage Castle

Thank you for helping look after the monsters! 🐉🩹 This page explains how we work.

## 🌿 Branches

Branch off `main` and name the branch after what you're doing:

| Prefix | For | Example |
| --- | --- | --- |
| `feat/` | new features | `feat/therapy-reminders` |
| `fix/` | bug fixes | `fix/late-fee-on-pickup-day` |
| `docs/` | documentation | `docs/glossary-hiring` |
| `chore/` | tooling, dependencies | `chore/bump-prisma` |
| `refactor/` | no behaviour change | `refactor/stays-to-prisma` |

## ✍️ Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(hiring): let overlords withdraw applications

Explain *why* in the body, not just what. Reference issues as #123.
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `perf`, `build`. Use the module name as the scope.

## ✅ Pull request checklist

Before you ask for a review:

- [ ] `npm test` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` has no new errors in files you touched
- [ ] New code follows [docs/CONVENTIONS.md](docs/CONVENTIONS.md) (Prisma, zod, `requireRole`, copper for money)
- [ ] New endpoints have at least one test
- [ ] Database changes come with a Prisma migration (`npm run db:migrate:dev -- --name your_change`)
- [ ] User-visible changes are in [CHANGELOG.md](CHANGELOG.md)
- [ ] Screenshots in the PR description for UI changes 📸

## 🗄️ Database changes

1. Edit `prisma/schema.prisma`
2. `npm run db:migrate:dev -- --name describe_the_change`
3. Commit the schema **and** the new folder in `prisma/migrations`
4. If the demo data needs to know about it, update `prisma/seed/`

Never edit an existing migration that has been merged.

## 🦴 Legacy code

`apps/api/src/legacy` and the class components in `apps/web/src/pages/*.tsx` are from 2022. When you need to change them:

- keep the change small, or
- better: move the module to `apps/api/src/modules` with Prisma (see [ADR-004](docs/adr/004-prisma-everywhere.md))

## 👀 Code review

- Be kind. Everyone here was new once (even Gorm).
- Review the code, not the person.
- Approve when it's better than before, not when it's perfect.

## 🙋 Questions

Open an issue with the `question` label. 🦉
