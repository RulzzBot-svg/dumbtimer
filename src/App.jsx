import { useEffect, useRef, useState } from 'react'
import { AlarmDashboard } from './components/AlarmDashboard.jsx'
import { AlarmForm } from './components/AlarmForm.jsx'
import { AlarmModal } from './components/AlarmModal.jsx'
import { ClockDisplay } from './components/ClockDisplay.jsx'
import { Toast } from './components/Toast.jsx'
import { playAlarmSound, stopAlarmSound, unlockAudio } from './lib/audio.js'
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
const envGiphyKey = import.meta.env.VITE_GIPHY_API_KEY || ''

function loadAlarms() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ALARMS_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function loadGiphyKey() {
  try {
    return localStorage.getItem(GIPHY_KEY) || envGiphyKey
  } catch {
    return envGiphyKey
  }
}

function createAlarm(time, query) {
  return {
    id: crypto.randomUUID(),
    time,
    query: query.trim() || 'cute cats',
    createdAt: new Date().toISOString(),
    lastFiredDate: null,
  }
}

function maybeNotify(alarm, media) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return
  }
  try {
    new Notification(`Nightstand · ${alarm.time}`, {
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
          className="absolute h-0.5 w-0.5 rounded-full bg-cream"
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
  const [alarms, setAlarms] = useState(loadAlarms)
  const [time, setTime] = useState(() => plusMinutesFromNow(1))
  const [query, setQuery] = useState('cute cats')
  const [giphyKey, setGiphyKey] = useState(loadGiphyKey)
  const [showKey, setShowKey] = useState(false)
  const [isRinging, setIsRinging] = useState(false)
  const [activeAlarm, setActiveAlarm] = useState(null)
  const [media, setMedia] = useState(null)
  const [loadingGif, setLoadingGif] = useState(false)
  const [toast, setToast] = useState('')

  const alarmsRef = useRef(alarms)
  const ringingRef = useRef(false)
  const giphyKeyRef = useRef(giphyKey)
  const skippedMinuteRef = useRef(new Map())
  const dismissRef = useRef(() => {})

  alarmsRef.current = alarms
  ringingRef.current = isRinging
  giphyKeyRef.current = giphyKey

  function minuteStamp(date) {
    return `${formatDateKey(date)}:${formatHHmm(date)}`
  }

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
    ringingRef.current = true
    setIsRinging(true)
    setActiveAlarm(alarm)
    setMedia(null)
    setLoadingGif(true)
    playAlarmSound()
    setToast(`Alarm for ${alarm.time} · ${alarm.query}`)

    if (persist) {
      const today = formatDateKey(new Date())
      setAlarms((current) =>
        current.map((item) =>
          item.id === alarm.id ? { ...item, lastFiredDate: today } : item,
        ),
      )
    }

    try {
      const nextMedia = await fetchAlarmGif(alarm.query, giphyKeyRef.current)
      setMedia(nextMedia)
      maybeNotify(alarm, nextMedia)
    } catch (error) {
      console.warn(error)
      setToast('Alarm fired, but the GIF request missed.')
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
    setAlarms((current) =>
      current.map((item) =>
        item.id === activeAlarm.id
          ? {
              ...item,
              time: snoozedTime,
              lastFiredDate: null,
              createdAt: new Date().toISOString(),
            }
          : item,
      ),
    )
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
    const alarm = createAlarm(time, query)
    setAlarms((current) =>
      [...current, alarm].sort((left, right) => left.time.localeCompare(right.time)),
    )
    setToast(`Saved ${alarm.time} · ${alarm.query}`)
  }

  return (
    <div className="relative min-h-svh overflow-hidden bg-ink">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(240,184,110,0.16),_transparent_42%),radial-gradient(ellipse_at_bottom,_rgba(154,208,194,0.08),_transparent_46%)]" />
      <Starfield />

      <main className="relative mx-auto flex min-h-svh max-w-2xl flex-col gap-10 px-5 py-10 sm:py-16">
        <ClockDisplay now={now} />

        <AlarmForm
          time={time}
          query={query}
          onTimeChange={setTime}
          onQueryChange={setQuery}
          onSubmit={handleSubmit}
        />

        <AlarmDashboard
          alarms={alarms}
          onDelete={(id) =>
            setAlarms((current) => current.filter((alarm) => alarm.id !== id))
          }
          onPreview={(alarm) => {
            unlockAudio()
            fireAlarm(alarm, { persist: false })
          }}
        />

        <section className="mt-auto rounded-3xl border border-cream/8 bg-ink-2/40 p-4 text-sm text-cream-dim">
          <button
            type="button"
            onClick={() => setShowKey((value) => !value)}
            className="flex w-full items-center justify-between text-left text-cream"
          >
            <span>Giphy API key</span>
            <span className="text-xs text-cream/40">
              {giphyKey ? 'saved locally' : 'optional'}
            </span>
          </button>
          {showKey ? (
            <div className="mt-3 space-y-2">
              <p>
                Giphy requires a client key for meme searches like “Dark Souls You
                Died”. Without one, Nightstand still wakes you with Wikimedia cat
                GIFs. Get a free key from{' '}
                <a
                  href="https://developers.giphy.com/dashboard/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber underline decoration-amber/30 underline-offset-2"
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
                className="h-11 w-full rounded-2xl border border-cream/10 bg-ink-3 px-3 font-mono text-sm text-cream outline-none focus:border-amber/50"
              />
            </div>
          ) : null}
        </section>
      </main>

      {isRinging ? (
        <AlarmModal
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
