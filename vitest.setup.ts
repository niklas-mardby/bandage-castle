import path from 'path'
import { config } from 'dotenv'

config({ path: path.resolve(__dirname, '.env') })

// no background jobs during tests
process.env.JOBS = 'off'
