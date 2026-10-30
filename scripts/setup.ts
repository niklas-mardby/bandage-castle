/* eslint-disable no-console */
// npm run setup: check the environment, apply migrations, load seed data.
// Safe to run again and again.
import { execSync } from 'child_process'
import path from 'path'
import { checkDatabase } from './check-db'

const root = path.resolve(__dirname, '..')
const MIN_NODE_MAJOR = 22
const RECOMMENDED_NODE_MAJOR = 26

function run(title: string, command: string) {
  console.log(`\n${title}`)
  execSync(command, { cwd: root, stdio: 'inherit', env: { ...process.env, PRISMA_HIDE_UPDATE_MESSAGE: '1' } })
}

async function main() {
  console.log('🩹🏰 Setting up Bandage Castle...\n')

  const major = Number(process.versions.node.split('.')[0])
  if (major < MIN_NODE_MAJOR) {
    console.error(`🚨 Node ${process.versions.node} is too old. Please install Node ${RECOMMENDED_NODE_MAJOR} LTS from https://nodejs.org/`)
    process.exit(1)
  }
  if (major !== RECOMMENDED_NODE_MAJOR) {
    console.warn(`⚠️  You are running Node ${process.versions.node}. Bandage Castle is developed and tested on Node ${RECOMMENDED_NODE_MAJOR} LTS.`)
    console.warn(`   It will probably work, but if anything looks odd, install Node ${RECOMMENDED_NODE_MAJOR} LTS from https://nodejs.org/\n`)
  }

  await checkDatabase()
  run('🗄️  Applying database migrations...', 'npx prisma migrate deploy')
  try {
    run('🧬 Generating the Prisma client...', 'npx prisma generate')
  } catch {
    console.error('\n🪟 Could not generate the Prisma client. On Windows this usually means the app is still running')
    console.error('   (`npm run dev` keeps a file locked). Stop it with Ctrl+C and run `npm run setup` again.\n')
    process.exit(1)
  }
  run('🌱 Loading seed data...', 'npx prisma db seed')

  console.log('\n✨ All done! Start the castle with: npm run dev\n')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
