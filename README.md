# 🩹🏰 Bandage Castle

> *We patch them up, you pick them up.* 🐉

**Bandage Castle** is a care facility for monsters, run out of a draughty old castle. Our customers are dungeon lords, evil wizards, necromancers and other villains who bring their monsters to us when they can't look after them themselves:

- 🏖️ **Boarding** — "I'm going on holiday, look after my wyvern for two weeks."
- 🩹 **Treatment** — the monster was injured by adventurers and needs patching up.
- 🛋️ **Therapy** — afraid of adventurers, won't guard treasure any more, scared of torchlight...
- 🦴 **Surrender** — the owner gives the monster up for good.

When a stay ends, the owner picks the monster up, or the monster finds a new villain through the 🏛️ **Hiring Hall**, or it stays with us until someone hires it.

This repository is the castle's management app: a React front end and an Express API on top of MySQL. 🧙

---

## 🗺️ Quick tour

| Area | What it does |
| --- | --- |
| 🏰 Dashboards | A different home page for every role |
| 🐉 Monsters & 📖 Species | Every resident, plus the compendium (diet, danger level, habitat, compatibility rules) |
| 🚪 Intake & 🛏️ Stays | Bookings, check-in forms, extensions, check-out |
| 🏚️ Lairs & 🍖 Feeding | Who sleeps where, and the daily feeding schedule |
| 🩺 Medical & 🛋️ Therapy | Records, treatments, prescriptions, therapy plans and sessions |
| 🏛️ Hiring Hall | Listings, applications from overlords, contracts |
| 💰 Billing | Invoices and payments in gold pieces |
| 🎫 Tickets & 📦 Supplies | Broken portcullises, escaped slimes, running out of bandages |
| 📜 Bulletin | Internal news and how-to pages |
| 🔔 Notifications, 🕵️ Audit log, ⚙️ Settings | The plumbing |

## 🧰 Tech stack

- **TypeScript** everywhere, ✅ **fully strict** (`strict: true`)
- **Node.js** + **Express** API (`apps/api`)
- **React** + **Vite** + **React Router** + **React Query** (`apps/web`)
- **MySQL 8** with **Prisma** (plus some older raw SQL with `mysql2`)
- **Vitest** + **Supertest** for tests
- **npm workspaces** monorepo with shared code in `packages/shared`

---

## 🚀 Getting started

### 1. Install the tools 🛠️

- 🟢 **Node.js 22 LTS** or newer: <https://nodejs.org/>
- 🐬 **MySQL 8**: <https://dev.mysql.com/downloads/mysql/> (Windows users: the *MySQL Installer* is easiest). Remember the `root` password you choose!

Check that Node works:

```bash
node --version
```

### 2. Create an empty database 🗄️

Open the MySQL command-line client (or MySQL Workbench) and run:

```sql
CREATE DATABASE bandage_castle;
```

### 3. Create your `.env` file 🗝️

macOS / Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Then open `.env` and change **only** the `DATABASE_URL` line to use your MySQL user and password:

```
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/bandage_castle"
```

> 💡 If your password contains special characters, URL-encode them: `@` → `%40`, `#` → `%23`, `/` → `%2F`.

### 4. Install dependencies 📦

```bash
npm install
```

### 5. Set up the database 🌱

```bash
npm run setup
```

This checks your database connection, applies all migrations and loads the demo data. It is safe to run again at any time.

### 6. Start the castle 🏰

```bash
npm run dev
```

This starts the API on <http://localhost:3001> and the web app on <http://localhost:5173>.

### 7. Log in 🔐

Open the web app URL shown in the terminal (normally <http://localhost:5173>) and log in with any account below. **Every password is `castle123`.**

| Email | Role | Who |
| --- | --- | --- |
| `admin@bandage.castle` | ADMIN | Castellan Brumhilde, runs the place |
| `frontdesk@bandage.castle` | FRONT_DESK | Pip Gatewarden, bookings and invoices |
| `keeper@bandage.castle` | KEEPER | Old Hobb, daily care |
| `vet@bandage.castle` | VET | Dr. Ingrid Splintmoor |
| `therapist@bandage.castle` | THERAPIST | Dr. Hilda Couchworth |
| `scribe@bandage.castle` | SCRIBE | Quillon Inkwell, writes the Bulletin |
| `owner@bandage.castle` | OWNER | Lady Morwenna Grimsby, a demanding necromancer |
| `overlord@bandage.castle` | OVERLORD + OWNER | Baron Aldric Vexmoor, hires monsters (and owns a hydra) |

There are a few more accounts in the demo data (`bryony@`, `grizelda@` and `igor@bandage.castle`), also with password `castle123`.

---

## 📜 Scripts

Run these from the repository root.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start API and web app together |
| `npm run setup` | Check the database, apply migrations, load demo data (safe to re-run) |
| `npm run db:reset` | ⚠️ Wipe the database and start fresh (migrations + demo data) |
| `npm run db:check` | Check that the database in `.env` is reachable |
| `npm run db:migrate` | Apply new migrations |
| `npm test` | Run all tests (needs `npm run setup` first) |
| `npm run typecheck` | Type-check all workspaces |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run build` | Production build of all workspaces |

## 🗂️ Project layout

```
bandage-castle/
├── apps/
│   ├── api/            🧠 Express API (modules/ = new code, legacy/ = 2022 code)
│   └── web/            🖼️ React app
├── packages/
│   └── shared/         🤝 types, roles, money and date helpers
├── prisma/             🗄️ schema, migrations, demo data (seed/)
├── docs/               📚 architecture, conventions, glossary, ADRs
└── scripts/            🛠️ setup and maintenance scripts
```

More reading: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/CONVENTIONS.md](docs/CONVENTIONS.md), [docs/GLOSSARY.md](docs/GLOSSARY.md), [docs/adr/](docs/adr/) and [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 🆘 Troubleshooting

`npm run setup` and `npm run db:check` explain most database problems themselves. Here are the usual suspects.

### 🔌 "Can't reach MySQL" / `ECONNREFUSED`

MySQL isn't running.

- **Windows:** open *Services*, find **MySQL80** and click *Start* (or in an administrator terminal: `net start MySQL80`).
- **macOS (Homebrew):** `brew services start mysql`
- **Linux:** `sudo systemctl start mysql`

### 🔐 "MySQL said no" / `ER_ACCESS_DENIED_ERROR`

The username or password in `DATABASE_URL` is wrong. Check `.env`. Remember to URL-encode special characters in the password.

### 🏗️ "The database doesn't exist yet" / `ER_BAD_DB_ERROR`

You skipped step 2. Run `CREATE DATABASE bandage_castle;` in the MySQL client.

### 🧩 Authentication plugin errors

Older MySQL users can use an authentication plugin the driver doesn't support. In the MySQL client, run (with your own password):

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'YOUR_PASSWORD';
```

### 🚪 Port already in use (`EADDRINUSE`, port 3001 or 5173)

Another program, often a second copy of `npm run dev`, is using the port. Close the other terminal, or find the process:

- **Windows:** `netstat -ano | findstr :3001` then `taskkill /PID <pid> /F`
- **macOS / Linux:** `lsof -i :3001` then `kill <pid>`

(If 5173 is taken, Vite simply picks the next free port and prints it.)

### 🟢 Wrong Node version

Run `node --version`. If it's older than the version in step 1, install the current LTS from <https://nodejs.org/>. With nvm: `nvm install --lts` and `nvm use --lts`.

### 🪟 `EPERM: operation not permitted, rename ... query_engine` (Windows)

`npm run setup` or `npm install` can't update Prisma while the app is running. Stop `npm run dev` (Ctrl+C) and run the command again.

### 🌱 The demo data looks old or half-empty

`npm run setup` never overwrites existing data. For a fresh castle: `npm run db:reset`.

---

Made with 🩹 and a lot of ☕ by the Bandage Castle team.
