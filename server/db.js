import { createClient } from '@libsql/client'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  avatar TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS presets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  share_code TEXT NOT NULL UNIQUE,
  time TEXT,
  query TEXT NOT NULL,
  gif_json TEXT,
  repeat TEXT NOT NULL DEFAULT 'daily',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY,
  preset_id TEXT NOT NULL,
  from_user_id TEXT NOT NULL,
  to_username TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`

let client
let migrated = false

function databaseUrl() {
  return process.env.LIBSQL_URL || process.env.DATABASE_URL || ''
}

export function databaseConfigured() {
  if (process.env.VERCEL) return Boolean(databaseUrl() && !databaseUrl().startsWith('file:'))
  return true
}

export function getDb() {
  if (client) return client
  let url = databaseUrl()
  if (!url) {
    const file = path.join(process.cwd(), 'data', 'desk.db')
    mkdirSync(path.dirname(file), { recursive: true })
    url = `file:${file}`
  } else if (url.startsWith('file:')) {
    const file = url.slice(5)
    mkdirSync(path.dirname(path.resolve(file)), { recursive: true })
  }
  client = createClient({
    url,
    authToken: process.env.LIBSQL_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN,
  })
  return client
}

export async function migrate() {
  if (migrated) return getDb()
  const db = getDb()
  for (const statement of SCHEMA.split(';').map((part) => part.trim()).filter(Boolean)) {
    await db.execute(statement)
  }
  migrated = true
  return db
}

export async function one(sql, args = []) {
  const db = await migrate()
  const result = await db.execute({ sql, args })
  return result.rows[0] || null
}

export async function many(sql, args = []) {
  const db = await migrate()
  const result = await db.execute({ sql, args })
  return result.rows
}

export async function run(sql, args = []) {
  const db = await migrate()
  return db.execute({ sql, args })
}
