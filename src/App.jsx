import { useEffect, useRef, useState } from 'react'
import { AlarmDashboard } from './components/AlarmDashboard.jsx'
import { AlarmForm } from './components/AlarmForm.jsx'
import { AlarmModal } from './components/AlarmModal.jsx'
import { ClockDisplay } from './components/ClockDisplay.jsx'
import { ModeToggle } from './components/ModeToggle.jsx'
import { Toast } from './components/Toast.jsx'
import { playAlarmSound, stopAlarmSound, unlockAudio } from './lib/audio.js'
import { COPY } from './lib/copy.js'
import { fetchAlarmGif } from './lib/media.js'
import {
  addMinutesHHmm,
  formatDateKey,
  formatHHmm,
  plusMinutesFromNow,
  wasCreatedThisMinute,
} from './lib/time.js'

const ALARMS_KEY = 'nightstand.alarms.v1'
const GIPHY_KEY = 'nightstand.giphyKey'
const MODE_KEY = 'nightstand.mode'
const BUILT_IN_GIPHY_KEY = 'osWBE8w7riCgyADWwV02X47dMqVO2YkY'
const envGiphyKey = import.meta.env.VITE_GIPHY_API_KEY || BUILT_IN_GIPHY_KEY

function loadAlarms() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ALARMS_KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.map((alarm) => ({
      ...alarm,
      repeat: alarm.repeat === 'once' ? 'once' : 'daily',
      gif: alarm.gif || null,
    }))
  } catch {
    return []
  }
}

function loadGiphyKey() {
  try {
    const saved = localStorage.getItem(GIPHY_KEY)
    if (saved && saved.length >= 16) return saved
  } catch {
    // Fall through to the build key.
  }
  return envGiphyKey
}

function loadMode() {
  try {
    const saved = localStorage.getItem(MODE_KEY)
    if (saved === 'desk' || saved === 'nightstand') return saved
  } catch {
    // Use the office default.
  }
  return 'desk'
}

function createAlarm(time, query, { gif, repeat }) {
  return {
    id: crypto.randomUUID(),
    time,
    query: query.trim() || 'time to leave work',
    gif: gif || null,
    repeat: repeat === 'once' ? 'once' : 'daily',
    createdAt: new Date().toISOString(),
    lastFiredDate: null,
  }
}

function maybeNotify(alarm, media, copy) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return
  }
  try {
    new Notification(copy.notifyTitle(alarm.time), {
      body: alarm.query,
      icon: media?.url,
    })
  } catch {
    // Some browsers reject notification options; the modal is the real alarm.
  }
}

const STARS = [
  [8, 12],
  [18, 28],
  [27, 9],
  [41, 18],
  [55, 8],
  [68, 22],
  [79, 11],
  [91, 19],
  [12, 48],
  [33, 62],
  [61, 44],
  [84, 57],
  [6, 78],
  [48, 82],
  [73, 74],
  [94, 86],
]

function Starfield() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {STARS.map(([left, top], index) => (
        <span
          key={`${left}-${top}`}
          className="absolute h-0.5 w-0.5 rounded-full bg-fg"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            animation: `star-twinkle ${3 + (index % 4)}s ease-in-out ${index * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

export default function App() {
  const [now, setNow] = useState(() => new Date())
  const [mode, setMode] = useState(loadMode)
  const [alarms, setAlarms] = useState(loadAlarms)
  const [time, setTime] = useState(() => plusMinutesFromNow(1))
  const [query, setQuery] = useState('time to leave work')
  const [selectedGif, setSelectedGif] = useState(null)
  const [repeat, setRepeat] = useState('daily')
  const [giphyKey, setGiphyKey] = useState(loadGiphyKey)
  const [showKey, setShowKey] = useState(false)
  const [isRinging, setIsRinging] = useState(false)
  const [activeAlarm, setActiveAlarm] = useState(null)
  const [media, setMedia] = useState(null)
  const [loadingGif, setLoadingGif] = useState(false)
  const [toast, setToast] = useState('')

  const copy = COPY[mode]
  const alarmsRef = useRef(alarms)
  const ringingRef = useRef(false)
  const giphyKeyRef = useRef(giphyKey)
  const modeRef = useRef(mode)
  const skippedMinuteRef = useRef(new Map())
  const dismissRef = useRef(() => {})

  alarmsRef.current = alarms
  ringingRef.current = isRinging
  giphyKeyRef.current = giphyKey
  modeRef.current = mode

  function minuteStamp(date) {
    return `${formatDateKey(date)}:${formatHHmm(date)}`
  }

  useEffect(() => {
    document.documentElement.dataset.mode = mode
    const theme = mode === 'nightstand' ? '#120e18' : '#f3eee4'
    const themeMeta = document.querySelector('meta[name="theme-color"]')
    if (themeMeta) themeMeta.setAttribute('content', theme)
    localStorage.setItem(MODE_KEY, mode)
  }, [mode])

  useEffect(() => {
    localStorage.setItem(ALARMS_KEY, JSON.stringify(alarms))
  }, [alarms])

  useEffect(() => {
    if (giphyKey) localStorage.setItem(GIPHY_KEY, giphyKey)
    else localStorage.removeItem(GIPHY_KEY)
  }, [giphyKey])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    const tick = () => {
      const current = new Date()
      setNow(current)
      if (ringingRef.current) return

      const hhmm = formatHHmm(current)
      const today = formatDateKey(current)
      const match = alarmsRef.current.find((alarm) => {
        if (alarm.time !== hhmm) return false
        if (alarm.lastFiredDate === today) return false
        if (wasCreatedThisMinute(alarm, current)) return false
        if (skippedMinuteRef.current.get(alarm.id) === minuteStamp(current)) {
          return false
        }
        return true
      })

      if (match) {
        fireAlarm(match, { persist: true })
      }
    }

    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isRinging) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') dismissRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isRinging])

  async function fireAlarm(alarm, { persist }) {
    const activeCopy = COPY[modeRef.current]
    ringingRef.current = true
    setIsRinging(true)
    setActiveAlarm(alarm)
    setMedia(null)
    setLoadingGif(true)
    playAlarmSound({ loop: modeRef.current === 'nightstand' })
    setToast(activeCopy.toastFired(alarm.time, alarm.query))

    if (persist) {
      const today = formatDateKey(new Date())
      setAlarms((current) => {
        if (alarm.repeat === 'once') {
          return current.filter((item) => item.id !== alarm.id)
        }
        return current.map((item) =>
          item.id === alarm.id ? { ...item, lastFiredDate: today } : item,
        )
      })
    }

    if (alarm.gif?.url) {
      setMedia(alarm.gif)
      setLoadingGif(false)
      maybeNotify(alarm, alarm.gif, activeCopy)
      return
    }

    try {
      const nextMedia = await fetchAlarmGif(alarm.query, giphyKeyRef.current)
      setMedia(nextMedia)
      maybeNotify(alarm, nextMedia, activeCopy)
    } catch (error) {
      console.warn(error)
      setToast('Ping fired, but the GIF request missed.')
    } finally {
      setLoadingGif(false)
    }
  }

  function dismissAlarm() {
    if (activeAlarm) {
      skippedMinuteRef.current.set(activeAlarm.id, minuteStamp(new Date()))
    }
    ringingRef.current = false
    stopAlarmSound()
    setIsRinging(false)
    setActiveAlarm(null)
    setMedia(null)
    setLoadingGif(false)
  }

  dismissRef.current = dismissAlarm

  function snoozeAlarm() {
    if (!activeAlarm) return
    const snoozedTime = addMinutesHHmm(formatHHmm(new Date()), 1)
    const snoozed = {
      ...activeAlarm,
      time: snoozedTime,
      lastFiredDate: null,
      createdAt: new Date().toISOString(),
    }
    setAlarms((current) => {
      const without = current.filter((item) => item.id !== activeAlarm.id)
      return [...without, snoozed].sort((left, right) =>
        left.time.localeCompare(right.time),
      )
    })
    setToast(`Snoozed to ${snoozedTime}`)
    dismissAlarm()
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!time) return
    unlockAudio()
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
    const alarm = createAlarm(time, query, { gif: selectedGif, repeat })
    setAlarms((current) =>
      [...current, alarm].sort((left, right) => left.time.localeCompare(right.time)),
    )
    setToast(copy.toastSaved(alarm.time, alarm.query))
    setSelectedGif(null)
  }

  return (
    <div className="relative min-h-svh overflow-x-hidden bg-bg text-fg">
      {mode === 'nightstand' ? (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(240,184,110,0.16),_transparent_42%),radial-gradient(ellipse_at_bottom,_rgba(154,208,194,0.08),_transparent_46%)]" />
          <Starfield />
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(194,78,36,0.08),_transparent_40%)]" />
      )}

      <main className="relative mx-auto flex min-h-svh max-w-2xl flex-col gap-10 px-5 py-10 sm:py-16">
        <div className="flex justify-center">
          <ModeToggle mode={mode} onChange={setMode} />
        </div>

        <ClockDisplay now={now} mode={mode} kicker={copy.kicker} />

        <AlarmForm
          mode={mode}
          copy={copy}
          time={time}
          query={query}
          giphyKey={giphyKey}
          selectedGif={selectedGif}
          repeat={repeat}
          onTimeChange={setTime}
          onQueryChange={setQuery}
          onGifChange={setSelectedGif}
          onRepeatChange={setRepeat}
          onSubmit={handleSubmit}
        />

        <AlarmDashboard
          copy={copy}
          alarms={alarms}
          onDelete={(id) =>
            setAlarms((current) => current.filter((alarm) => alarm.id !== id))
          }
          onPreview={(alarm) => {
            unlockAudio()
            fireAlarm(alarm, { persist: false })
          }}
        />

        <section className="mt-auto rounded-3xl border border-line bg-card/70 p-4 text-sm text-muted">
          <button
            type="button"
            onClick={() => setShowKey((value) => !value)}
            className="flex w-full items-center justify-between text-left text-fg"
          >
            <span>Giphy</span>
            <span className="text-xs text-muted">
              {giphyKey ? 'connected' : 'optional'}
            </span>
          </button>
          {showKey ? (
            <div className="mt-3 space-y-2">
              <p>
                A Giphy dashboard key (SDK or API — same thing) unlocks search for
                pings like “time to leave work”. Without one, Wikimedia GIFs still
                show. Manage keys at{' '}
                <a
                  href="https://developers.giphy.com/dashboard/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline decoration-accent/30 underline-offset-2"
                >
                  developers.giphy.com
                </a>
                .
              </p>
              <input
                type="password"
                autoComplete="off"
                value={giphyKey}
                onChange={(event) => setGiphyKey(event.target.value.trim())}
                placeholder="Paste Giphy API key"
                className="h-11 w-full rounded-2xl border border-line bg-bg px-3 font-mono text-sm text-fg outline-none focus:border-accent"
              />
            </div>
          ) : null}
        </section>
      </main>

      {isRinging ? (
        <AlarmModal
          copy={copy}
          alarm={activeAlarm}
          media={media}
          loading={loadingGif}
          onDismiss={dismissAlarm}
          onSnooze={snoozeAlarm}
        />
      ) : null}

      <Toast message={toast} />
    </div>
  )
}
