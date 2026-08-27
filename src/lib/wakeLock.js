let sentinel = null
let watching = false

async function requestLock() {
  if (!('wakeLock' in navigator)) return
  try {
    sentinel = await navigator.wakeLock.request('screen')
    sentinel.addEventListener('release', () => {
      sentinel = null
    })
  } catch {
    // Unsupported, denied, or the page is in the background.
  }
}

function onVisibility() {
  if (document.visibilityState === 'visible') requestLock()
}

export async function keepAwake(enabled) {
  if (!enabled) {
    if (watching) {
      document.removeEventListener('visibilitychange', onVisibility)
      watching = false
    }
    try {
      await sentinel?.release()
    } catch {
      // Already released.
    }
    sentinel = null
    return
  }

  await requestLock()
  if (!watching) {
    document.addEventListener('visibilitychange', onVisibility)
    watching = true
  }
}
