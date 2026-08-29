import { useEffect, useState } from 'react'
import { isNativeApp } from '../lib/native.js'
import { CHROME_STORE_URL } from '../lib/pinger.js'

function isDesktopChromium() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/Android|iPhone|iPod/i.test(ua)) return false
  return /Chrome|Chromium|Edg/i.test(ua)
}

function isLocalDev() {
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

function StoreLink({ children }) {
  return (
    <a
      href={CHROME_STORE_URL}
      target="_blank"
      rel="noreferrer"
      className="text-accent underline decoration-accent/30 underline-offset-2"
    >
      {children}
    </a>
  )
}

export function PingerHint() {
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (isNativeApp() || !isDesktopChromium()) return undefined
    const sync = () => {
      setInstalled(document.documentElement.dataset.deskPinger === '1')
    }
    sync()
    const timer = window.setInterval(sync, 1500)
    return () => window.clearInterval(timer)
  }, [])

  if (isNativeApp() || !isDesktopChromium()) return null

  if (installed) {
    return (
      <p className="text-center text-sm text-muted">
        Pinger is on. You can close this tab; Chrome will still toast. Click the
        extension for your name and ping count.
      </p>
    )
  }

  return (
    <p className="text-center text-sm text-muted">
      Optional Chrome pinger: toasts after you close this tab. Chrome itself has to
      stay running.{' '}
      {isLocalDev() ? (
        <span>
          The published build only syncs on{' '}
          <span className="text-fg">dumbtimer.vercel.app</span>. Install it from the{' '}
          <StoreLink>Chrome Web Store</StoreLink>, or load unpacked from the{' '}
          <code>extension</code> folder for local work.
        </span>
      ) : (
        <>
          <StoreLink>Add to Chrome</StoreLink> from the store.
        </>
      )}{' '}
      The popup is just your name, pic, and ping count — tap it to come back here.
    </p>
  )
}
