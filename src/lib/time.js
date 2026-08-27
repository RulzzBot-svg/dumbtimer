export function pad(value) {
  return String(value).padStart(2, '0')
}

export function formatHHmm(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatClock(date) {
  return {
    hours: pad(date.getHours()),
    minutes: pad(date.getMinutes()),
    seconds: pad(date.getSeconds()),
  }
}

export function formatPrettyTime(hhmm) {
  const [hoursRaw, minutes] = hhmm.split(':')
  const hours = Number(hoursRaw)
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const twelve = hours % 12 || 12
  return `${twelve}:${minutes} ${suffix}`
}

export function addMinutesHHmm(hhmm, minutesToAdd) {
  const [hours, minutes] = hhmm.split(':').map(Number)
  const total = (hours * 60 + minutes + minutesToAdd + 24 * 60) % (24 * 60)
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}

export function plusMinutesFromNow(minutesToAdd) {
  const date = new Date(Date.now() + minutesToAdd * 60 * 1000)
  return formatHHmm(date)
}

export function nextDateForHHmm(hhmm, now = new Date()) {
  const [hours, minutes] = hhmm.split(':').map(Number)
  const at = new Date(now)
  at.setSeconds(0, 0)
  at.setMilliseconds(0)
  at.setHours(hours, minutes, 0, 0)
  if (at.getTime() <= now.getTime() + 1500) {
    at.setDate(at.getDate() + 1)
  }
  return at
}

export function wasCreatedThisMinute(alarm, now) {
  if (!alarm.createdAt) return false
  const created = new Date(alarm.createdAt)
  return (
    formatHHmm(created) === formatHHmm(now) &&
    formatDateKey(created) === formatDateKey(now)
  )
}
