import './env'
import { createApp } from './app'
import { startRavenLoop } from './legacy'
import { startJobs } from './modules/jobs/jobs'

const port = Number(process.env.PORT) || 3001

const server = createApp().listen(port, () => {
  console.log(`🏰 Bandage Castle API listening on http://localhost:${port}`)
  startRavenLoop()
  startJobs()
})

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n🚨 Port ${port} is already in use. Is Bandage Castle already running in another terminal?`)
    console.error('   Stop the other process (see README → Troubleshooting → "Port already in use") and try again.\n')
    process.exit(1)
  }
  throw err
})
