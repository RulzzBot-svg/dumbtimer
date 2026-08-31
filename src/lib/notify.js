const ICON_PATH = '/notify-icon.png'
export const PING_POPUP_MS = 8000

let lastNotification = null
let closeTimer = null

function iconUrl() {
  if (typeof window === 'undefined') return ICON_PATH
  return new URL(ICON_PATH, window.location.origin).href
}

function notificationImage(media) {
  return media?.stillUrl || media?.previewUrl || media?.url || undefined
}

export function closePingNotification() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  try {
    lastNotification?.close()
  } catch {
    // Already dismissed from the OS tray.
  }
  lastNotification = null
}

export function showPingNotification({ title, body, media, onClick }) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return
  }

  closePingNotification()

  const image = notificationImage(media)
  const options = {
    body,
    icon: iconUrl(),
    badge: iconUrl(),
    tag: 'desk-ping',
    renotify: true,
    requireInteraction: false,
  }
  if (image) options.image = image

  try {
    lastNotification = new Notification(title, options)
  } catch {
    try {
      const withoutImage = { ...options }
      delete withoutImage.image
      lastNotification = new Notification(title, withoutImage)
    } catch {
      // The in-page modal is still the real alarm.
      return
    }
  }

  lastNotification.onclick = () => {
    try {
      window.focus()
    } catch {
      // Some browsers block focus from a notification click.
    }
    onClick?.()
    closePingNotification()
  }

  closeTimer = setTimeout(() => closePingNotification(), PING_POPUP_MS)
}
