import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { one, run } from './db.js'
import { bearerToken } from './http.js'

const USERNAME = /^[a-zA-Z0-9_]{3,20}$/

export function normalizeUsername(value) {
  return String(value || '').trim()
}

export function validUsername(value) {
  return USERNAME.test(normalizeUsername(value))
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export async function checkPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export function newId() {
  return randomBytes(16).toString('hex')
}

export function newShareCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

export async function createSession(userId) {
  const token = randomBytes(24).toString('hex')
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
  await run('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)', [
    token,
    userId,
    expires,
  ])
  return { token, expiresAt: expires }
}

export async function userFromRequest(req) {
  const token = bearerToken(req)
  if (!token) return null
  const row = await one(
    `SELECT users.id, users.username, users.avatar
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.token = ? AND sessions.expires_at > ?`,
    [token, new Date().toISOString()],
  )
  return row || null
}
