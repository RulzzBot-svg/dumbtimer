const KEY = 'desk.pinger.v1'
const EVENT = 'desk-pinger-sync'

try {
  document.documentElement.dataset.deskPinger = '1'
} catch {
  // Ignore.
}

function readSnapshot() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      return {
        v: 1,
        origin: location.origin,
        profile: null,
        pingCount: 0,
        alarms: [],
        mode: 'desk',
        updatedAt: Date.now(),
      }
    }
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function push() {
  const snapshot = readSnapshot()
  if (!snapshot || !chrome.runtime?.id) return
  chrome.runtime.sendMessage({ type: 'desk:sync', snapshot }, () => {
    void chrome.runtime.lastError
  })
}

push()
window.addEventListener(EVENT, push)
window.addEventListener('storage', (event) => {
  if (event.key === KEY) push()
})
setInterval(push, 12_000)
