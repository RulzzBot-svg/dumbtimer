import { useEffect, useState } from 'react'
import { isStandaloneApp } from '../lib/device.js'

const DISMISS_KEY = 'nightstand.installHint.v1'

function isIos() {
  return /iPhone|iPod/i.test(navigator.userAgent)
}

export function InstallHint() {
  const [standalone, setStandalone] = useState(isStandaloneApp)
  const [deferred, setDeferred] = useState(null)
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const sync = () => setStandalone(isStandaloneApp())
    const media = window.matchMedia('(display-mode: standalone)')
    media.addEventListener?.('change', sync)
    const onPrompt = (event) => {
      event.preventDefault()
      setDeferred(event)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => {
      media.removeEventListener?.('change', sync)
      window.removeEventListener('beforeinstallprompt', onPrompt)
    }
  }, [])

  if (standalone || hidden) return null

  async function install() {
    if (!deferred) return
    deferred.prompt()
    try {
      await deferred.userChoice
    } catch {
      // User dismissed the browser sheet.
    }
    setDeferred(null)
  }

  function dismiss() {
    setHidden(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Ignore quota errors.
    }
  }

  return (
    <section className="phone-install rounded-3xl border border-line bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">
            Home screen
          </p>
          <h2 className="mt-1 font-serif text-xl text-fg">Install Desk</h2>
          <p className="mt-1 text-sm text-muted">
            {deferred
              ? 'Add it like any other app. Pings still need the app left open.'
              : isIos()
                ? 'Share → Add to Home Screen. Then open it from the icon. Keep it open for pings.'
                : 'Open this site in Chrome, then Add to Home screen from the menu. Keep the app open for pings.'}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-full border border-line px-3 py-1 text-sm text-muted"
        >
          Later
        </button>
      </div>
      {deferred ? (
        <button
          type="button"
          onClick={install}
          className="mt-3 h-11 w-full rounded-2xl bg-fg font-semibold text-bg"
        >
          Install app
        </button>
      ) : null}
    </section>
  )
}
