import 'dotenv/config'
import express from 'express'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import { initDb } from './db.js'
import { createRouter } from './routes.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PORT = Number(process.env.PORT) || 3000
const DB_PATH = process.env.DB_PATH || join(ROOT, 'data', 'packtrack.db')
const DIST = join(ROOT, 'dist')

const db = initDb(DB_PATH)
const app = express()

app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, appUrl: process.env.APP_URL || null })
})

app.use('/api', createRouter(db))

if (existsSync(DIST)) {
  app.use(express.static(DIST, { maxAge: '1h' }))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(join(DIST, 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PackTrack server http://0.0.0.0:${PORT}`)
  console.log(`DB: ${DB_PATH}`)
  if (process.env.APP_URL) console.log(`APP_URL: ${process.env.APP_URL}`)
})