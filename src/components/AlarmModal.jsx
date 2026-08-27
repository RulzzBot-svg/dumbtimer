export function AlarmModal({
  copy,
  alarm,
  media,
  loading,
  onDismiss,
  onSnooze,
}) {
  if (!alarm) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alarm-title"
    >
      <div className="flex max-h-[92svh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-line bg-card shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-accent uppercase">
              {copy.modalKicker}
            </p>
            <h2 id="alarm-title" className="mt-1 font-serif text-3xl text-fg">
              {alarm.time}
            </h2>
            <p className="mt-1 text-sm text-muted">{alarm.query}</p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full border border-line px-3 py-1 text-sm text-muted hover:text-fg"
          >
            Close
          </button>
        </div>

        <div className="flex min-h-[240px] flex-1 items-center justify-center p-4 sm:p-6">
          {loading ? (
            <p className="font-serif text-muted italic">{copy.loading}</p>
          ) : media?.url ? (
            <img
              src={media.url}
              alt={media.title || alarm.query}
              className="max-h-[58svh] w-full rounded-2xl object-contain"
            />
          ) : (
            <p className="text-muted">{copy.fallback}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 px-6 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
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
                      className="underline decoration-line underline-offset-2 hover:text-fg"
                    >
                      source
                    </a>
                  </>
                ) : null}
              </>
            ) : (
              copy.dismiss
            )}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSnooze}
              className="rounded-full border border-line px-4 py-2 text-sm text-fg hover:border-accent"
            >
              {copy.snooze}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full bg-fg px-4 py-2 text-sm font-semibold text-bg hover:bg-accent"
            >
              {copy.dismiss}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
