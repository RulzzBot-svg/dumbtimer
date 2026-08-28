export const PINGER_KEY = 'desk.pinger.v1'
export const PINGER_EVENT = 'desk-pinger-sync'

function compactGif(gif) {
  if (!gif || typeof gif !== 'object') return null
  return {
    url: gif.url || null,
    stillUrl: gif.stillUrl || null,
    previewUrl: gif.previewUrl || null,
  }
}

export function buildPingerSnapshot({ user, alarms, mode, origin }) {
  const list = Array.isArray(alarms) ? alarms : []
  return {
    v: 1,
    origin: origin || (typeof window !== 'undefined' ? window.location.origin : ''),
    profile: user?.username
      ? { username: user.username, avatar: user.avatar || null }
      : null,
    pingCount: list.length,
    mode: mode === 'nightstand' ? 'nightstand' : 'desk',
    alarms: list.map((alarm) => ({
      id: alarm.id,
      time: alarm.time,
      query: alarm.query,
      repeat: alarm.repeat === 'once' ? 'once' : 'daily',
      lastFiredDate: alarm.lastFiredDate || null,
      gif: compactGif(alarm.gif),
    })),
    updatedAt: Date.now(),
  }
}

export function writePingerSnapshot(input) {
  if (typeof window === 'undefined') return
  try {
    const snapshot = buildPingerSnapshot(input)
    localStorage.setItem(PINGER_KEY, JSON.stringify(snapshot))
    window.dispatchEvent(new CustomEvent(PINGER_EVENT))
  } catch {
    // Private mode / quota — the site still works without the pinger.
  }
}

export function deskPingerInstalled() {
  if (typeof document === 'undefined') return false
  return document.documentElement.dataset.deskPinger === '1'
}
