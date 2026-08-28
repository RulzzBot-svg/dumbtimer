const TOKEN_KEY = 'desk.session'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Ignore quota / private mode.
  }
}

async function request(path, { method = 'GET', body, token = getToken() } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  let payload = {}
  try {
    payload = await response.json()
  } catch {
    payload = {}
  }
  if (!response.ok) {
    const error = new Error(payload.error || 'Request missed')
    error.status = response.status
    throw error
  }
  return payload
}

export async function fetchMe() {
  const token = getToken()
  if (!token) return null
  try {
    const payload = await request('/api/auth')
    return payload.user
  } catch (error) {
    if (error.status === 401) setToken('')
    return null
  }
}

export async function registerAccount(username, password) {
  const payload = await request('/api/auth', {
    method: 'POST',
    body: { action: 'register', username, password },
  })
  setToken(payload.token)
  return payload.user
}

export async function loginAccount(username, password) {
  const payload = await request('/api/auth', {
    method: 'POST',
    body: { action: 'login', username, password },
  })
  setToken(payload.token)
  return payload.user
}

export function logoutAccount() {
  setToken('')
}

export async function updateProfile(fields) {
  const payload = await request('/api/auth', { method: 'PATCH', body: fields })
  return payload.user
}

export async function fetchPresets() {
  return request('/api/presets')
}

export async function createPreset(preset) {
  const payload = await request('/api/presets', {
    method: 'POST',
    body: { action: 'create', ...preset },
  })
  return payload.preset
}

export async function sharePreset(presetId, username) {
  return request('/api/presets', {
    method: 'POST',
    body: { action: 'share', presetId, username },
  })
}

export async function importPreset(code) {
  const payload = await request('/api/presets', {
    method: 'POST',
    body: { action: 'import', code },
  })
  return payload.preset
}

export async function deletePreset(presetId) {
  return request('/api/presets', {
    method: 'POST',
    body: { action: 'delete', presetId },
  })
}

export function resizeProfilePic(file) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 256
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      const min = Math.min(image.width, image.height)
      const sx = (image.width - min) / 2
      const sy = (image.height - min) / 2
      ctx.drawImage(image, sx, sy, min, min, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.72))
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that image'))
    }
    image.src = url
  })
}
