import { AlarmDashboard } from './AlarmDashboard.jsx'
import { AlarmForm } from './AlarmForm.jsx'
import { AlarmModal } from './AlarmModal.jsx'
import { AppBackdrop } from './AppBackdrop.jsx'
import { ClockDisplay } from './ClockDisplay.jsx'
import { ModeToggle } from './ModeToggle.jsx'
import { PingerHint } from './PingerHint.jsx'
import { Toast } from './Toast.jsx'

export function DesktopShell({
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
  accountButton,
  canSaveTemplate,
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
  onSaveTemplate,
}) {
  return (
    <div className="relative min-h-svh overflow-x-hidden bg-bg text-fg">
      <AppBackdrop mode={mode} />

      <main className="relative mx-auto flex min-h-svh max-w-2xl flex-col gap-10 px-5 py-10 sm:py-16">
        <div className="relative flex items-center justify-center">
          <ModeToggle mode={mode} onChange={onModeChange} />
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            {accountButton}
          </div>
        </div>

        <ClockDisplay now={now} mode={mode} kicker={copy.kicker} />
        <PingerHint />

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

        <AlarmDashboard
          copy={copy}
          alarms={alarms}
          onDelete={onDelete}
          onPreview={onPreview}
          onSaveTemplate={canSaveTemplate ? onSaveTemplate : undefined}
        />

        <section className="mt-auto rounded-3xl border border-line bg-card/70 p-4 text-sm text-muted">
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
                onChange={(event) => onGiphyKeyChange(event.target.value.trim())}
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
          onDismiss={onDismiss}
          onSnooze={onSnooze}
        />
      ) : null}

      <Toast message={toast} />
    </div>
  )
}
