import { newId, newShareCode, normalizeUsername, userFromRequest, validUsername } from '../server/auth.js'
import { databaseConfigured, many, one, run } from '../server/db.js'
import { mapPreset, methodNotAllowed, readJson, send } from '../server/http.js'

export default async function handler(req, res) {
  try {
    if (!databaseConfigured()) {
      return send(res, 503, {
        error: 'Accounts need a database URL. Add LIBSQL_URL in Vercel env.',
      })
    }
    const user = await userFromRequest(req)
    if (!user) return send(res, 401, { error: 'Sign in to save and share templates' })

    if (req.method === 'GET') return listPresets(req, res, user)
    if (req.method === 'POST') return mutatePresets(req, res, user)
    return methodNotAllowed(res, 'GET, POST')
  } catch (error) {
    console.error(error)
    return send(res, 500, { error: 'Preset request missed.' })
  }
}

async function uniqueShareCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = newShareCode()
    const exists = await one('SELECT id FROM presets WHERE share_code = ?', [code])
    if (!exists) return code
  }
  return newShareCode() + newShareCode().slice(0, 2)
}

function presetFromBody(body) {
  const name = String(body.name || body.query || 'Untitled').trim().slice(0, 40)
  const query = String(body.query || '').trim().slice(0, 80) || 'time to leave work'
  const time = String(body.time || '').trim()
  const repeat = body.repeat === 'once' ? 'once' : 'daily'
  const gif = body.gif && typeof body.gif === 'object' ? body.gif : null
  return { name, query, time, repeat, gif }
}

async function listPresets(_req, res, user) {
  const mine = await many(
    `SELECT presets.*, users.username AS owner_username
     FROM presets
     JOIN users ON users.id = presets.user_id
     WHERE presets.user_id = ?
     ORDER BY presets.created_at DESC`,
    [user.id],
  )
  const inbox = await many(
    `SELECT presets.*, users.username AS owner_username, shares.created_at AS shared_at
     FROM shares
     JOIN presets ON presets.id = shares.preset_id
     JOIN users ON users.id = presets.user_id
     WHERE lower(shares.to_username) = lower(?)
     ORDER BY shares.created_at DESC`,
    [user.username],
  )
  return send(res, 200, {
    presets: mine.map(mapPreset),
    inbox: inbox.map(mapPreset),
  })
}

async function mutatePresets(req, res, user) {
  const body = await readJson(req)
  const action = body.action || 'create'

  if (action === 'create') {
    const fields = presetFromBody(body)
    const preset = {
      id: newId(),
      share_code: await uniqueShareCode(),
      created_at: new Date().toISOString(),
      ...fields,
    }
    await run(
      `INSERT INTO presets (id, user_id, name, share_code, time, query, gif_json, repeat, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        preset.id,
        user.id,
        fields.name,
        preset.share_code,
        fields.time,
        fields.query,
        fields.gif ? JSON.stringify(fields.gif) : null,
        fields.repeat,
        preset.created_at,
      ],
    )
    return send(res, 201, {
      preset: mapPreset({
        ...preset,
        gif_json: fields.gif ? JSON.stringify(fields.gif) : null,
        owner_username: user.username,
      }),
    })
  }

  if (action === 'share') {
    const toUsername = normalizeUsername(body.username)
    if (!validUsername(toUsername)) {
      return send(res, 400, { error: 'Need a valid username to share with' })
    }
    if (toUsername.toLowerCase() === user.username.toLowerCase()) {
      return send(res, 400, { error: 'Share it with someone else' })
    }
    const target = await one('SELECT id, username FROM users WHERE lower(username) = lower(?)', [
      toUsername,
    ])
    if (!target) return send(res, 404, { error: 'No user with that name' })
    const preset = await one('SELECT * FROM presets WHERE id = ? AND user_id = ?', [
      body.presetId,
      user.id,
    ])
    if (!preset) return send(res, 404, { error: 'Template not found' })
    const already = await one(
      'SELECT id FROM shares WHERE preset_id = ? AND lower(to_username) = lower(?)',
      [preset.id, target.username],
    )
    if (!already) {
      await run(
        'INSERT INTO shares (id, preset_id, from_user_id, to_username, created_at) VALUES (?, ?, ?, ?, ?)',
        [newId(), preset.id, user.id, target.username, new Date().toISOString()],
      )
    }
    return send(res, 200, {
      ok: true,
      to: target.username,
      shareCode: preset.share_code,
    })
  }

  if (action === 'import') {
    const code = String(body.code || '')
      .trim()
      .toUpperCase()
    if (code.length < 4) return send(res, 400, { error: 'Paste a share code' })
    const preset = await one(
      `SELECT presets.*, users.username AS owner_username
       FROM presets
       JOIN users ON users.id = presets.user_id
       WHERE presets.share_code = ?`,
      [code],
    )
    if (!preset) return send(res, 404, { error: 'No template with that code' })
    if (preset.user_id !== user.id) {
      const already = await one(
        'SELECT id FROM shares WHERE preset_id = ? AND lower(to_username) = lower(?)',
        [preset.id, user.username],
      )
      if (!already) {
        await run(
          'INSERT INTO shares (id, preset_id, from_user_id, to_username, created_at) VALUES (?, ?, ?, ?, ?)',
          [newId(), preset.id, preset.user_id, user.username, new Date().toISOString()],
        )
      }
    }
    return send(res, 200, { preset: mapPreset(preset) })
  }

  if (action === 'delete') {
    const preset = await one('SELECT id FROM presets WHERE id = ? AND user_id = ?', [
      body.presetId,
      user.id,
    ])
    if (!preset) return send(res, 404, { error: 'Template not found' })
    await run('DELETE FROM shares WHERE preset_id = ?', [preset.id])
    await run('DELETE FROM presets WHERE id = ?', [preset.id])
    return send(res, 200, { ok: true })
  }

  return send(res, 400, { error: 'Unknown action' })
}
