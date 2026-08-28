import {
  checkPassword,
  createSession,
  hashPassword,
  newId,
  normalizeUsername,
  userFromRequest,
  validUsername,
} from '../server/auth.js'
import { databaseConfigured, databaseMissingError, one, run } from '../server/db.js'
import { methodNotAllowed, publicUser, readJson, send } from '../server/http.js'

export default async function handler(req, res) {
  try {
    if (!databaseConfigured()) {
      return send(res, 503, {
        error: databaseMissingError(),
      })
    }
    if (req.method === 'GET') return getMe(req, res)
    if (req.method === 'POST') return postAuth(req, res)
    if (req.method === 'PATCH') return patchMe(req, res)
    return methodNotAllowed(res, 'GET, POST, PATCH')
  } catch (error) {
    console.error(error)
    return send(res, 500, { error: 'Account request missed.' })
  }
}

async function getMe(req, res) {
  const user = await userFromRequest(req)
  if (!user) return send(res, 401, { error: 'Not signed in' })
  return send(res, 200, { user: publicUser(user) })
}

async function postAuth(req, res) {
  const body = await readJson(req)
  const action = body.action
  if (action === 'logout') {
    return send(res, 200, { ok: true })
  }
  const username = normalizeUsername(body.username)
  const password = String(body.password || '')
  if (!validUsername(username)) {
    return send(res, 400, { error: 'Username: 3–20 letters, numbers, or _' })
  }
  if (password.length < 4) {
    return send(res, 400, { error: 'Password needs at least 4 characters' })
  }

  if (action === 'register') {
    const exists = await one('SELECT id FROM users WHERE lower(username) = lower(?)', [
      username,
    ])
    if (exists) return send(res, 409, { error: 'That username is taken' })
    const user = {
      id: newId(),
      username,
      password_hash: await hashPassword(password),
      avatar: null,
      created_at: new Date().toISOString(),
    }
    await run(
      'INSERT INTO users (id, username, password_hash, avatar, created_at) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.username, user.password_hash, user.avatar, user.created_at],
    )
    const session = await createSession(user.id)
    return send(res, 201, { user: publicUser(user), token: session.token })
  }

  if (action === 'login') {
    const found = await one('SELECT * FROM users WHERE lower(username) = lower(?)', [
      username,
    ])
    if (!found || !(await checkPassword(password, found.password_hash))) {
      return send(res, 401, { error: 'Wrong username or password' })
    }
    const session = await createSession(found.id)
    return send(res, 200, { user: publicUser(found), token: session.token })
  }

  return send(res, 400, { error: 'Unknown action' })
}

async function patchMe(req, res) {
  const user = await userFromRequest(req)
  if (!user) return send(res, 401, { error: 'Not signed in' })
  const body = await readJson(req)
  let username = user.username
  let avatar = user.avatar

  if (body.username != null) {
    username = normalizeUsername(body.username)
    if (!validUsername(username)) {
      return send(res, 400, { error: 'Username: 3–20 letters, numbers, or _' })
    }
    const taken = await one(
      'SELECT id FROM users WHERE lower(username) = lower(?) AND id != ?',
      [username, user.id],
    )
    if (taken) return send(res, 409, { error: 'That username is taken' })
  }

  if (body.avatar !== undefined) {
    if (body.avatar === null || body.avatar === '') {
      avatar = null
    } else if (typeof body.avatar !== 'string' || !body.avatar.startsWith('data:image/')) {
      return send(res, 400, { error: 'Profile pic must be an image' })
    } else if (body.avatar.length > 180_000) {
      return send(res, 400, { error: 'Profile pic is too large' })
    } else {
      avatar = body.avatar
    }
  }

  await run('UPDATE users SET username = ?, avatar = ? WHERE id = ?', [
    username,
    avatar,
    user.id,
  ])
  return send(res, 200, { user: { id: user.id, username, avatar } })
}
