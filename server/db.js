import { neon } from '@neondatabase/serverless'
import { loadEnv } from './env.js'

if (!process.env.VERCEL) loadEnv()

const URL_KEYS = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'DATABASE_URL_UNPOOLED',
  'POSTGRES_URL_NON_POOLING',
]

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
]

let sql
let migrated = false

export function normalizeDatabaseUrl(raw) {
  let url = String(raw ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
  if (!url) return ''
  const assign = url.match(
    /^(?:export\s+)?(?:DATABASE_URL|POSTGRES_URL|POSTGRES_PRISMA_URL)\s*=\s*([\s\S]+)$/i,
  )
  if (assign) url = assign[1].trim()
  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1).trim()
  }
  if (url.startsWith('jdbc:postgresql://')) url = url.slice('jdbc:'.length)
  return url
}

export function databaseUrl() {
  for (const key of URL_KEYS) {
    const url = normalizeDatabaseUrl(process.env[key])
    if (url) return url
  }
  return ''
}

export function databaseConfigured() {
  const url = databaseUrl()
  return url.startsWith('postgres://') || url.startsWith('postgresql://')
}

export function databaseMissingError() {
  const url = databaseUrl()
  if (url && !databaseConfigured()) {
    const scheme = url.split(':')[0].slice(0, 24) || 'unknown'
    return `DATABASE_URL is set but it is not a postgres URL (starts with “${scheme}”). Paste the Neon pooled connection string that starts with postgresql:// — no quotes. You do not need to create tables.`
  }
  return 'No DATABASE_URL on this deploy. In Vercel open the dumbtimer project → Settings → Environment Variables. Name it DATABASE_URL, paste the Neon pooled string (starts with postgresql://, no quotes), enable Production and Preview, Save, then Redeploy. You do not need to create tables.'
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
