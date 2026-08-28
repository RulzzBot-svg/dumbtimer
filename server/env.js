import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

let loaded = false

function applyFile(file) {
  if (!existsSync(file)) return
  const text = readFileSync(file, 'utf8')
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue
    if (process.env[key] !== undefined) continue
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

export function loadEnv() {
  if (loaded) return
  loaded = true
  const cwd = process.cwd()
  applyFile(path.join(cwd, '.env'))
  applyFile(path.join(cwd, '.env.local'))
}
