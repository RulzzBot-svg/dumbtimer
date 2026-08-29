export function dateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function nextAlarmWhen(hhmm, repeat, lastFiredDate, now = new Date()) {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return null
  const [hours, minutes] = hhmm.split(':').map(Number)
  const today = dateKey(now)
  if (repeat === 'once' && lastFiredDate) return null

  const slot = new Date(now)
  slot.setSeconds(0, 0)
  slot.setMilliseconds(0)
  slot.setHours(hours, minutes, 0, 0)

  if (lastFiredDate === today) {
    if (repeat === 'once') return null
    slot.setDate(slot.getDate() + 1)
    return slot.getTime()
  }

  if (slot.getTime() <= now.getTime() + 1500) {
    if (repeat === 'once') return null
    slot.setDate(slot.getDate() + 1)
  }
  return slot.getTime()
}
