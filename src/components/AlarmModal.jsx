export function AlarmModal({
  alarm,
  media,
  loading,
  onDismiss,
  onSnooze,
}) {
  if (!alarm) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alarm-title"
    >
      <div className="flex max-h-[92svh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-cream/15 bg-ink-2 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-amber uppercase">
              Alarm
            </p>
            <h2 id="alarm-title" className="mt-1 font-serif text-3xl text-cream">
              {alarm.time}
            </h2>
            <p className="mt-1 text-sm text-cream-dim">{alarm.query}</p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full border border-cream/15 px-3 py-1 text-sm text-cream/70 hover:text-cream"
          >
            Close
          </button>
        </div>

        <div className="flex min-h-[240px] flex-1 items-center justify-center p-4 sm:p-6">
          {loading ? (
            <p className="font-serif text-cream-dim italic">Fetching something chill…</p>
          ) : media?.url ? (
            <img
              src={media.url}
              alt={media.title || alarm.query}
              className="max-h-[58svh] w-full rounded-2xl object-contain"
            />
          ) : (
            <p className="text-cream-dim">Could not load a GIF. The chime still counts.</p>
          )}
        </div>

        <div className="flex flex-col gap-3 px-6 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-cream/40">
            {media?.attribution ? (
              <>
                {media.attribution}
                {media.pageUrl ? (
                  <>
                    {' · '}
                    <a
                      href={media.pageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-cream/20 underline-offset-2 hover:text-cream-dim"
                    >
                      source
                    </a>
                  </>
                ) : null}
              </>
            ) : (
              'Take a breath, then get up.'
            )}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSnooze}
              className="rounded-full border border-cream/15 px-4 py-2 text-sm text-cream hover:border-mist/50"
            >
              Snooze 1 min
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full bg-cream px-4 py-2 text-sm font-semibold text-ink hover:bg-amber"
            >
              I&apos;m up
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
