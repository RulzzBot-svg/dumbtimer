import { LocalNotifications } from '@capacitor/local-notifications'
import { COPY } from './copy.js'
import { isNativeApp } from './native.js'
import { nextDateForHHmm } from './time.js'

const CHANNEL_ID = 'desk-pings'

export function notificationIdForAlarm(alarmId) {
  let hash = 2166136261
  for (let i = 0; i < alarmId.length; i += 1) {
    hash ^= alarmId.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % 2147483646 + 1
}

function parseHourMinute(hhmm) {
  const [hour, minute] = hhmm.split(':').map(Number)
  return { hour, minute }
}

function buildNotification(alarm, copy) {
  const { hour, minute } = parseHourMinute(alarm.time)
  const daily = alarm.repeat !== 'once'
  return {
    id: notificationIdForAlarm(alarm.id),
    title: copy.notifyTitle(alarm.time, alarm.query),
    body: copy.notifyBody(alarm.time),
    extra: { alarmId: alarm.id },
    channelId: CHANNEL_ID,
    sound: 'chime',
    isExactNotification: true,
    isExactMandatory: true,
    schedule: daily
      ? { on: { hour, minute }, allowWhileIdle: true }
      : { at: nextDateForHHmm(alarm.time), allowWhileIdle: true },
  }
}

async function ensureChannel() {
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Desk pings',
      description: 'Lunch, leave-time, and nightstand alarms',
      importance: 5,
      visibility: 1,
      sound: 'chime',
      vibration: true,
    })
  } catch {
    // iOS has no channels; Android may already have this one.
  }
}

export async function requestNativeNotificationAccess({ promptExact = false } = {}) {
  if (!isNativeApp()) return { display: 'denied', exact: false }
  await ensureChannel()
  let display = 'denied'
  try {
    const current = await LocalNotifications.checkPermissions()
    display = current.display
    if (display !== 'granted') {
      const requested = await LocalNotifications.requestPermissions()
      display = requested.display
    }
  } catch (error) {
    console.warn('Native notification permission failed.', error)
  }

  let exact = false
  try {
    const setting = await LocalNotifications.checkExactNotificationSetting()
    exact = setting.exact_alarm === 'granted'
    if (!exact && promptExact && LocalNotifications.changeExactNotificationSetting) {
      const next = await LocalNotifications.changeExactNotificationSetting()
      exact = next.exact_alarm === 'granted'
    }
  } catch {
    exact = true
  }

  return { display, exact }
}

export async function syncNativeAlarms(alarms, mode = 'desk') {
  if (!isNativeApp()) return { ok: false, reason: 'web' }
  const copy = COPY[mode] || COPY.desk
  await ensureChannel()

  try {
    const pending = await LocalNotifications.getPending()
    const ids = (pending.notifications || []).map((item) => item.id)
    if (ids.length > 0) {
      await LocalNotifications.cancel({
        notifications: ids.map((id) => ({ id })),
      })
    }
  } catch (error) {
    console.warn('Could not clear pending native pings.', error)
  }

  const notifications = alarms.map((alarm) => buildNotification(alarm, copy))
  if (notifications.length === 0) return { ok: true, count: 0 }

  try {
    await LocalNotifications.schedule({ notifications })
    return { ok: true, count: notifications.length }
  } catch (error) {
    console.warn('Could not schedule native pings.', error)
    return { ok: false, reason: error?.message || 'schedule-failed' }
  }
}

let queuedAlarmId = null
const subscribers = new Set()
let booted = false

function emitNativeAlarm(alarmId) {
  if (!alarmId) return
  if (subscribers.size === 0) {
    queuedAlarmId = alarmId
    return
  }
  subscribers.forEach((fn) => fn(alarmId))
}

export function bootNativeNotificationListeners() {
  if (booted || !isNativeApp()) return
  booted = true

  LocalNotifications.addListener('localNotificationReceived', (notification) => {
    emitNativeAlarm(notification?.extra?.alarmId)
  })
  LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
    emitNativeAlarm(event?.notification?.extra?.alarmId)
  })
}

export function listenForNativeAlarms(onAlarm) {
  if (!isNativeApp()) return () => {}
  bootNativeNotificationListeners()
  subscribers.add(onAlarm)
  if (queuedAlarmId) {
    const id = queuedAlarmId
    queuedAlarmId = null
    onAlarm(id)
  }
  return () => {
    subscribers.delete(onAlarm)
  }
}
