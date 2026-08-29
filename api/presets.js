import { newId, newShareCode, normalizeUsername, userFromRequest, validUsername } from '../server/auth.js'
import { databaseConfigured, many, one, run } from '../server/db.js'
import { mapGroup, mapPreset, methodNotAllowed, readJson, send } from '../server/http.js'
import { parseShareCodes } from '../server/shareCodes.js'

export default async function handler(req, res) {
  try {
    if (!databaseConfigured()) {
      return send(res, 503, {
        error: 'Accounts need a Neon database. Add DATABASE_URL in Vercel (or .env.local for local).',
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
    const exists = await one(
      `SELECT share_code FROM presets WHERE share_code = ?
       UNION ALL
       SELECT share_code FROM preset_groups WHERE share_code = ?`,
      [code, code],
    )
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

function gifJsonFromRow(row) {
  if (row.gif_json) return row.gif_json
  return null
}

async function insertPreset(user, fields, groupId = null) {
  const gifJson =
    fields.gifJson !== undefined
      ? fields.gifJson
      : fields.gif
        ? JSON.stringify(fields.gif)
        : null
  const preset = {
    id: newId(),
    share_code: await uniqueShareCode(),
    created_at: new Date().toISOString(),
    group_id: groupId,
    name: fields.name,
    query: fields.query,
    time: fields.time || '',
    repeat: fields.repeat === 'once' ? 'once' : 'daily',
    gif_json: gifJson,
  }
  await run(
    `INSERT INTO presets (id, user_id, name, share_code, time, query, gif_json, repeat, created_at, group_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      preset.id,
      user.id,
      preset.name,
      preset.share_code,
      preset.time,
      preset.query,
      preset.gif_json,
      preset.repeat,
      preset.created_at,
      preset.group_id,
    ],
  )
  return preset
}

async function insertGroup(user, name) {
  const group = {
    id: newId(),
    name: String(name || 'Imported').trim().slice(0, 40) || 'Imported',
    share_code: await uniqueShareCode(),
    created_at: new Date().toISOString(),
  }
  await run(
    `INSERT INTO preset_groups (id, user_id, name, share_code, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [group.id, user.id, group.name, group.share_code, group.created_at],
  )
  return group
}

async function ownedGroup(userId, groupId) {
  if (!groupId) return null
  return one('SELECT * FROM preset_groups WHERE id = ? AND user_id = ?', [groupId, userId])
}

async function libraryPayload(user) {
  const groups = await many(
    `SELECT * FROM preset_groups WHERE user_id = ? ORDER BY created_at DESC`,
    [user.id],
  )
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
  const mapped = mine.map(mapPreset)
  return {
    presets: mapped.filter((item) => !item.groupId),
    groups: groups.map((group) =>
      mapGroup(
        group,
        mapped.filter((item) => item.groupId === group.id),
      ),
    ),
    inbox: inbox.map(mapPreset),
  }
}

async function listPresets(_req, res, user) {
  return send(res, 200, await libraryPayload(user))
}

async function lookupByCode(code) {
  const group = await one(
    `SELECT preset_groups.*, users.username AS owner_username
     FROM preset_groups
     JOIN users ON users.id = preset_groups.user_id
     WHERE preset_groups.share_code = ?`,
    [code],
  )
  if (group) {
    const items = await many(
      `SELECT presets.*, users.username AS owner_username
       FROM presets
       JOIN users ON users.id = presets.user_id
       WHERE presets.group_id = ?
       ORDER BY presets.created_at ASC`,
      [group.id],
    )
    return { kind: 'group', group, items }
  }
  const preset = await one(
    `SELECT presets.*, users.username AS owner_username
     FROM presets
     JOIN users ON users.id = presets.user_id
     WHERE presets.share_code = ?`,
    [code],
  )
  if (preset) return { kind: 'preset', items: [preset] }
  return null
}

function importGroupName(found, extraCount) {
  const named = found.find((item) => item.kind === 'group' && item.group?.name)
  if (named && found.length === 1) return named.group.name
  if (named) return named.group.name
  const owner = found[0]?.items?.[0]?.owner_username
  if (owner) return `From @${owner}`
  return extraCount > 1 ? 'Imported' : 'Imported'
}

async function importByCodes(user, codes) {
  const found = []
  for (const code of codes) {
    const match = await lookupByCode(code)
    if (match) found.push(match)
  }
  if (found.length === 0) return { error: 'No template with that code', status: 404 }

  const pending = []
  const seen = new Set()
  for (const match of found) {
    for (const row of match.items) {
      if (!row?.id || seen.has(row.id)) continue
      seen.add(row.id)
      if (row.user_id === user.id) continue
      pending.push(row)
    }
  }
  if (pending.length === 0) {
    return { error: 'Those templates are already yours', status: 409 }
  }

  const groupId =
    pending.length > 1 ? (await insertGroup(user, importGroupName(found, pending.length))).id : null
  const copies = []
  for (const row of pending) {
    const copy = await insertPreset(
      user,
      {
        name: row.name,
        query: row.query,
        time: row.time || '',
        repeat: row.repeat,
        gifJson: gifJsonFromRow(row),
      },
      groupId,
    )
    copies.push(
      mapPreset({
        ...copy,
        owner_username: user.username,
      }),
    )
  }

  const group = groupId ? await one('SELECT * FROM preset_groups WHERE id = ?', [groupId]) : null
  return {
    status: 200,
    presets: copies,
    group: group ? mapGroup(group, copies) : null,
  }
}

async function mutatePresets(req, res, user) {
  const body = await readJson(req)
  const action = body.action || 'create'

  if (action === 'create') {
    const fields = presetFromBody(body)
    let groupId = body.groupId || null
    if (groupId && !(await ownedGroup(user.id, groupId))) {
      return send(res, 404, { error: 'Group not found' })
    }
    const preset = await insertPreset(user, fields, groupId)
    return send(res, 201, {
      preset: mapPreset({
        ...preset,
        owner_username: user.username,
      }),
    })
  }

  if (action === 'createGroup') {
    const name = String(body.name || '').trim().slice(0, 40)
    if (name.length < 1) return send(res, 400, { error: 'Name the group' })
    const group = await insertGroup(user, name)
    return send(res, 201, { group: mapGroup(group, []) })
  }

  if (action === 'move') {
    const preset = await one('SELECT * FROM presets WHERE id = ? AND user_id = ?', [
      body.presetId,
      user.id,
    ])
    if (!preset) return send(res, 404, { error: 'Template not found' })
    const groupId = body.groupId || null
    if (groupId && !(await ownedGroup(user.id, groupId))) {
      return send(res, 404, { error: 'Group not found' })
    }
    await run('UPDATE presets SET group_id = ? WHERE id = ?', [groupId, preset.id])
    return send(res, 200, await libraryPayload(user))
  }

  if (action === 'deleteGroup') {
    const group = await ownedGroup(user.id, body.groupId)
    if (!group) return send(res, 404, { error: 'Group not found' })
    await run('UPDATE presets SET group_id = NULL WHERE group_id = ? AND user_id = ?', [
      group.id,
      user.id,
    ])
    await run('DELETE FROM preset_groups WHERE id = ?', [group.id])
    return send(res, 200, await libraryPayload(user))
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
    const codes = parseShareCodes(body.code)
    if (codes.length === 0) return send(res, 400, { error: 'Paste a share code' })
    const result = await importByCodes(user, codes)
    if (result.error) return send(res, result.status, { error: result.error })
    return send(res, 200, {
      presets: result.presets,
      group: result.group,
      library: await libraryPayload(user),
    })
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
