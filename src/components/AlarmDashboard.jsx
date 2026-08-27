import { formatPrettyTime } from '../lib/time.js'

export function AlarmDashboard({ alarms, onDelete, onPreview }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-2xl text-cream">Tonight&apos;s alarms</h2>
        <p className="text-xs tracking-[0.18em] text-cream/40 uppercase">
          {alarms.length} active
        </p>
      </div>

      {alarms.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-cream/15 px-5 py-10 text-center text-cream-dim">
          Nothing scheduled yet. Set a time, add a GIF search, and go drift off.
        </div>
      ) : (
        <ul className="grid gap-3">
          {alarms.map((alarm) => (
            <li
              key={alarm.id}
              className="flex flex-col gap-3 rounded-3xl border border-cream/10 bg-ink-2/70 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-mono text-3xl text-amber tabular-nums">
                  {alarm.time}
                </p>
                <p className="mt-1 text-sm text-cream-dim">
                  {formatPrettyTime(alarm.time)} · {alarm.query}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onPreview(alarm)}
                  className="rounded-full border border-cream/15 px-4 py-2 text-sm text-cream transition hover:border-mist/60 hover:text-mist"
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(alarm.id)}
                  className="rounded-full border border-cream/15 px-4 py-2 text-sm text-cream/70 transition hover:border-blush/70 hover:text-blush"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
