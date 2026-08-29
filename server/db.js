import { neon } from '@neondatabase/serverless'
import { loadEnv } from './env.js'

loadEnv()

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    avatar TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS presets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    share_code TEXT NOT NULL UNIQUE,
    time TEXT,
    query TEXT NOT NULL,
    gif_json TEXT,
    repeat TEXT NOT NULL DEFAULT 'daily',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS shares (
    id TEXT PRIMARY KEY,
    preset_id TEXT NOT NULL,
    from_user_id TEXT NOT NULL,
    to_username TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS preset_groups (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    share_code TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  )`,
  `ALTER TABLE presets ADD COLUMN IF NOT EXISTS group_id TEXT`,
]

let sql
let migrated = false

export function databaseUrl() {
  return String(process.env.DATABASE_URL || '').trim()
}

export function databaseConfigured() {
  const url = databaseUrl()
  return url.startsWith('postgres://') || url.startsWith('postgresql://')
}

export function toPg(sqlText) {
  let n = 0
  return String(sqlText).replace(/\?/g, () => `$${++n}`)
}

function getSql() {
  if (sql) return sql
  if (!databaseConfigured()) {
    throw new Error('DATABASE_URL is missing. Add the Neon pooled connection string.')
  }
  sql = neon(databaseUrl(), {
    fetchOptions: { cache: 'no-store' },
  })
  return sql
}

async function exec(sqlText, args = []) {
  const client = getSql()
  const result = await client.query(toPg(sqlText), args)
  if (Array.isArray(result)) return result
  if (result && Array.isArray(result.rows)) return result.rows
  return []
}

export async function migrate() {
  if (migrated) return
  for (const statement of SCHEMA) {
    await exec(statement)
  }
  migrated = true
}

export async function one(sqlText, args = []) {
  const rows = await many(sqlText, args)
  return rows[0] || null
}

export async function many(sqlText, args = []) {
  await migrate()
  return exec(sqlText, args)
}

export async function run(sqlText, args = []) {
  await migrate()
  return exec(sqlText, args)
}
