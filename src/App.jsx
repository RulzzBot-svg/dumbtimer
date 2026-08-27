import { useEffect, useRef, useState } from 'react'
import { DesktopShell } from './components/DesktopShell.jsx'
import { PhoneShell } from './components/PhoneShell.jsx'
import { playAlarmSound, stopAlarmSound, unlockAudio } from './lib/audio.js'
import { COPY } from './lib/copy.js'
import { applyDevice, detectDevice } from './lib/device.js'
import { fetchAlarmGif } from './lib/media.js'
import { closePingNotification, showPingNotification } from './lib/notify.js'
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
  showPingNotification({
    title: copy.notifyTitle(alarm.time, alarm.query),
    body: copy.notifyBody(alarm.time),
    media,
  })
}

export default function App() {
  const [device] = useState(detectDevice)
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
    applyDevice(device)
  }, [device])

  useEffect(() => {
    document.documentElement.dataset.mode = mode
    const theme = mode === 'nightstand' ? '#120e18' : '#f3eee4'
    const themeMeta = document.querySelector('meta[name="theme-color"]')
    if (themeMeta) themeMeta.setAttribute('content', theme)
    const manifestTheme = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    if (manifestTheme) {
      manifestTheme.setAttribute('content', mode === 'nightstand' ? 'black-translucent' : 'default')
    }
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
    closePingNotification()
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

  const shell = {
    mode,
    copy,
    now,
    time,
    query,
    giphyKey,
    selectedGif,
    repeat,
    showKey,
    alarms,
    isRinging,
    activeAlarm,
    media,
    loadingGif,
    toast,
    onModeChange: setMode,
    onTimeChange: setTime,
    onQueryChange: setQuery,
    onGifChange: setSelectedGif,
    onRepeatChange: setRepeat,
    onSubmit: handleSubmit,
    onShowKey: () => setShowKey((value) => !value),
    onGiphyKeyChange: setGiphyKey,
    onDelete: (id) => setAlarms((current) => current.filter((alarm) => alarm.id !== id)),
    onPreview: (alarm) => {
      unlockAudio()
      fireAlarm(alarm, { persist: false })
    },
    onDismiss: dismissAlarm,
    onSnooze: snoozeAlarm,
  }

  return device === 'phone' ? <PhoneShell {...shell} /> : <DesktopShell {...shell} />
}
