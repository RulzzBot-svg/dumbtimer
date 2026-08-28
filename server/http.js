export async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body
  }
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  if (!raw) return {}
  return JSON.parse(raw)
}

export function send(res, status, payload) {
  const body = JSON.stringify(payload)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(body)
}

export function methodNotAllowed(res, allow) {
  res.setHeader('Allow', allow)
  send(res, 405, { error: 'Method not allowed' })
}

export function bearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || ''
  const match = String(header).match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : ''
}

export function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    avatar: row.avatar || null,
  }
}

export function mapPreset(row) {
  let gif = null
  try {
    gif = row.gif_json ? JSON.parse(row.gif_json) : null
  } catch {
    gif = null
  }
  return {
    id: row.id,
    name: row.name,
    shareCode: row.share_code,
    time: row.time || '',
    query: row.query,
    gif,
    repeat: row.repeat === 'once' ? 'once' : 'daily',
    owner: row.owner_username || undefined,
    createdAt: row.created_at,
  }
}
