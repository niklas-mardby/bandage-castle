/* eslint-disable no-console */
// Checks that the database in DATABASE_URL is reachable and explains what to do if not.
// Used by `npm run setup`, and handy on its own: `npm run db:check`.
import fs from 'fs'
import path from 'path'
import { config } from 'dotenv'
import mysql from 'mysql2/promise'

const root = path.resolve(__dirname, '..')
config({ path: path.join(root, '.env') })

function fail(title: string, lines: string[]): never {
  console.error('')
  console.error(`🚨 ${title}`)
  console.error('')
  for (const line of lines) console.error(`   ${line}`)
  console.error('')
  console.error('   📖 More help: README.md → "Troubleshooting"')
  console.error('')
  process.exit(1)
}

export async function checkDatabase(): Promise<void> {
  if (!fs.existsSync(path.join(root, '.env'))) {
    fail('No .env file found 🗝️', [
      'Copy the example file and edit the DATABASE_URL line:',
      '',
      '   macOS / Linux:       cp .env.example .env',
      '   Windows PowerShell:  Copy-Item .env.example .env',
    ])
  }

  const url = process.env.DATABASE_URL
  if (!url) {
    fail('DATABASE_URL is missing from .env 🗝️', ['Add a line like:', '', '   DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/bandage_castle"'])
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    fail('DATABASE_URL is not a valid URL 🤔', [`Got: ${url}`, 'Expected: mysql://USER:PASSWORD@HOST:PORT/DATABASE'])
  }
  const host = `${parsed.hostname}:${parsed.port || 3306}`
  const user = decodeURIComponent(parsed.username)
  const database = parsed.pathname.replace(/^\//, '')

  try {
    const conn = await mysql.createConnection({ uri: url, connectTimeout: 5000 })
    const [rows] = await conn.query('SELECT VERSION() AS version')
    const version = (rows as { version: string }[])[0]?.version ?? '?'
    await conn.end()
    if (!version.startsWith('8.')) {
      console.warn(`⚠️  You are running MySQL ${version}. Bandage Castle is tested on MySQL 8.`)
    }
    console.log(`✅ Database "${database}" on ${host} is reachable (MySQL ${version}).`)
  } catch (err) {
    const code = (err as { code?: string }).code ?? ''
    const message = (err as Error).message
    switch (code) {
      case 'ECONNREFUSED':
        fail(`Can't reach MySQL at ${host} 🔌`, [
          'Is MySQL running?',
          '   Windows: open "Services" and start "MySQL80" (or run: net start MySQL80 as admin)',
          '   macOS:   brew services start mysql   (or System Settings → MySQL)',
          '   Linux:   sudo systemctl start mysql',
          `Also check the host and port in DATABASE_URL (currently ${host}).`,
        ])
      case 'ER_ACCESS_DENIED_ERROR':
        fail(`MySQL said no to user "${user}" 🔐`, [
          'The username or password in DATABASE_URL is wrong.',
          'Special characters in the password must be URL-encoded, e.g. @ → %40, # → %23.',
        ])
      case 'ER_BAD_DB_ERROR':
        fail(`The database "${database}" doesn't exist yet 🏗️`, [
          'Create it once in the MySQL client or Workbench:',
          '',
          `   CREATE DATABASE ${database};`,
        ])
      case 'ER_NOT_SUPPORTED_AUTH_MODE':
      case 'AUTH_SWITCH_PLUGIN_ERROR':
        fail('MySQL authentication plugin problem 🧩', [
          'Your MySQL user uses an authentication plugin the driver cannot handle.',
          'In the MySQL client, run:',
          '',
          `   ALTER USER '${user}'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'your-password';`,
        ])
      case 'ETIMEDOUT':
      case 'ENOTFOUND':
        fail(`Can't find a MySQL server at ${host} 🗺️`, ['Check the host name in DATABASE_URL. For a local install it is usually localhost.'])
      default:
        fail('Could not connect to the database 😵', [`${code || 'Error'}: ${message}`])
    }
  }
}

if (require.main === module) {
  checkDatabase()
}
