import { useEffect } from 'react'
import { unlockAudio } from '../lib/audio.js'
import { keepAwake } from '../lib/wakeLock.js'
import { isNativeApp } from '../lib/native.js'
import { AlarmDashboard } from './AlarmDashboard.jsx'
import { AlarmForm } from './AlarmForm.jsx'
import { AlarmModal } from './AlarmModal.jsx'
import { AppBackdrop } from './AppBackdrop.jsx'
import { ClockDisplay } from './ClockDisplay.jsx'
import { InstallHint } from './InstallHint.jsx'
import { ModeToggle } from './ModeToggle.jsx'
import { Toast } from './Toast.jsx'

export function PhoneShell({
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
  onModeChange,
  onTimeChange,
  onQueryChange,
  onGifChange,
  onRepeatChange,
  onSubmit,
  onShowKey,
  onGiphyKeyChange,
  onDelete,
  onPreview,
  onDismiss,
  onSnooze,
  accountButton,
  canSaveTemplate,
  onSaveTemplate,
}) {
  useEffect(() => {
    if (isNativeApp()) {
      keepAwake(false)
      return undefined
    }
    keepAwake(mode === 'nightstand' || isRinging || alarms.length > 0)
    return () => {
      keepAwake(false)
    }
  }, [mode, isRinging, alarms.length])

  return (
    <div
      className="phone-shell relative min-h-svh overflow-x-hidden bg-bg text-fg"
      onPointerDown={unlockAudio}
    >
      <AppBackdrop mode={mode} />

      <main className="phone-main relative mx-auto flex min-h-svh max-w-lg flex-col gap-7 px-4">
        <header className="phone-header">
          <div className="phone-header-toggle min-w-0 flex-1">
            <ModeToggle mode={mode} onChange={onModeChange} />
          </div>
          {accountButton}
        </header>

        <ClockDisplay now={now} mode={mode} kicker={copy.kicker} />

        <p className="phone-keep-open text-center text-sm text-muted">
          {isNativeApp()
            ? 'Pings still fire if Desk is closed. Tap the notification to open the GIF.'
            : 'Leave Desk open for pings — same idea as the desktop tab.'}
        </p>

        {isNativeApp() ? null : <InstallHint />}

        <AlarmDashboard
          copy={copy}
          alarms={alarms}
          onDelete={onDelete}
          onPreview={onPreview}
          onSaveTemplate={canSaveTemplate ? onSaveTemplate : undefined}
        />

        <AlarmForm
          mode={mode}
          copy={copy}
          time={time}
          query={query}
          giphyKey={giphyKey}
          selectedGif={selectedGif}
          repeat={repeat}
          onTimeChange={onTimeChange}
          onQueryChange={onQueryChange}
          onGifChange={onGifChange}
          onRepeatChange={onRepeatChange}
          onSubmit={onSubmit}
          canSaveTemplate={canSaveTemplate}
          onSaveTemplate={onSaveTemplate}
        />

        <section className="mb-2 rounded-3xl border border-line bg-card/70 p-4 text-sm text-muted">
          <button
            type="button"
            onClick={onShowKey}
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
                Same Giphy key as desktop. Search still works if this is already
                connected.
              </p>
              <input
                type="password"
                autoComplete="off"
                value={giphyKey}
                onChange={(event) => onGiphyKeyChange(event.target.value.trim())}
                placeholder="Paste Giphy API key"
                className="h-12 w-full rounded-2xl border border-line bg-bg px-3 font-mono text-base text-fg outline-none focus:border-accent"
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
          onDismiss={onDismiss}
          onSnooze={onSnooze}
        />
      ) : null}

      <Toast message={toast} />
    </div>
  )
}
