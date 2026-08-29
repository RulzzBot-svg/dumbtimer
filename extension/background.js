import { dateKey, nextAlarmWhen } from './schedule.js'

const DEFAULT_ORIGIN = 'https://dumbtimer.vercel.app'
const DESK_URLS = [
  'https://dumbtimer.vercel.app/*',
  'http://localhost:5173/*',
  'http://127.0.0.1:5173/*',
]

const ICON = chrome.runtime.getURL('icon-128.png')

async function loadState() {
  const { snapshot } = await chrome.storage.local.get('snapshot')
  return snapshot || { origin: DEFAULT_ORIGIN, profile: null, pingCount: 0, alarms: [] }
}

async function saveSnapshot(snapshot) {
  const next = {
    ...snapshot,
    origin: snapshot.origin || DEFAULT_ORIGIN,
    pingCount: Array.isArray(snapshot.alarms) ? snapshot.alarms.length : snapshot.pingCount || 0,
  }
  await chrome.storage.local.set({ snapshot: next })
  await scheduleAll(next)
  return next
}

async function scheduleAll(snapshot) {
  await chrome.alarms.clearAll()
  const alarms = snapshot.alarms || []
  const now = new Date()
  for (const alarm of alarms) {
    const when = nextAlarmWhen(alarm.time, alarm.repeat, alarm.lastFiredDate, now)
    if (!when) continue
    await chrome.alarms.create(alarm.id, { when })
  }
}

async function deskTabsOpen() {
  try {
    const tabs = await chrome.tabs.query({ url: DESK_URLS })
    return tabs.length > 0
  } catch {
    return false
  }
}

async function openDesk() {
  const snapshot = await loadState()
  const origin = snapshot.origin || DEFAULT_ORIGIN
  const tabs = await chrome.tabs.query({ url: DESK_URLS })
  const existing = tabs.find((tab) => tab.url && tab.url.startsWith(origin)) || tabs[0]
  if (existing?.id) {
    await chrome.tabs.update(existing.id, { active: true })
    if (existing.windowId) await chrome.windows.update(existing.windowId, { focused: true })
    return
  }
  await chrome.tabs.create({ url: origin })
}

function findAlarm(snapshot, id) {
  return (snapshot.alarms || []).find((item) => item.id === id) || null
}

async function showToast(alarm) {
  const image =
    alarm.gif?.stillUrl || alarm.gif?.previewUrl || alarm.gif?.url || undefined
  const options = {
    type: image ? 'image' : 'basic',
    iconUrl: ICON,
    title: alarm.query || 'Desk ping',
    message: `Desk · ${alarm.time}`,
    priority: 2,
    requireInteraction: true,
  }
  if (image) options.imageUrl = image
  try {
    await chrome.notifications.create(`desk-${alarm.id}`, options)
  } catch {
    delete options.imageUrl
    options.type = 'basic'
    await chrome.notifications.create(`desk-${alarm.id}`, options)
  }
}

async function openGifWindow(alarm) {
  const params = new URLSearchParams({
    title: alarm.query || 'Desk ping',
    time: alarm.time || '',
    gif: alarm.gif?.url || alarm.gif?.previewUrl || '',
  })
  await chrome.windows.create({
    url: chrome.runtime.getURL(`ping.html?${params.toString()}`),
    type: 'popup',
    width: 380,
    height: 460,
    focused: true,
  })
}

async function markFired(snapshot, alarm) {
  const today = dateKey(new Date())
  const alarms =
    alarm.repeat === 'once'
      ? (snapshot.alarms || []).filter((item) => item.id !== alarm.id)
      : (snapshot.alarms || []).map((item) =>
          item.id === alarm.id ? { ...item, lastFiredDate: today } : item,
        )
  return saveSnapshot({ ...snapshot, alarms, pingCount: alarms.length })
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'desk:sync' && message.snapshot) {
    saveSnapshot(message.snapshot).then(() => sendResponse({ ok: true }))
    return true
  }
  if (message?.type === 'desk:get') {
    loadState().then((snapshot) => sendResponse(snapshot))
    return true
  }
  if (message?.type === 'desk:open') {
    openDesk().then(() => sendResponse({ ok: true }))
    return true
  }
  return false
})

chrome.alarms.onAlarm.addListener(async (scheduled) => {
  const snapshot = await loadState()
  const alarm = findAlarm(snapshot, scheduled.name)
  if (!alarm) return
  const pageOpen = await deskTabsOpen()
  await showToast(alarm)
  if (!pageOpen) {
    try {
      await openGifWindow(alarm)
    } catch {
      // Popup windows can be blocked; the tray toast still landed.
    }
  }
  await markFired(snapshot, alarm)
})

chrome.notifications.onClicked.addListener(() => {
  openDesk()
})

chrome.runtime.onInstalled.addListener(async () => {
  const snapshot = await loadState()
  await scheduleAll(snapshot)
})
