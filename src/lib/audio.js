let chime = null

function getChime() {
  if (!chime) {
    chime = new Audio('/chime.wav')
    chime.preload = 'auto'
    chime.volume = 0.72
  }
  return chime
}

export function playAlarmSound({ loop = false } = {}) {
  const audio = getChime()
  audio.loop = loop
  audio.currentTime = 0
  return audio.play().catch(() => {
    // Autoplay can still be blocked if the tab never received a gesture.
  })
}

export function stopAlarmSound() {
  if (!chime) return
  chime.pause()
  chime.currentTime = 0
  chime.loop = false
}

export function unlockAudio() {
  const audio = getChime()
  audio.muted = true
  audio
    .play()
    .then(() => {
      audio.pause()
      audio.currentTime = 0
      audio.muted = false
    })
    .catch(() => {
      audio.muted = false
    })
}
