import { formatPrettyTime } from '../lib/time.js'

export function AlarmDashboard({ copy, alarms, onDelete, onPreview }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-2xl text-fg">{copy.listTitle}</h2>
        <p className="text-xs tracking-[0.18em] text-muted uppercase">
          {alarms.length} active
        </p>
      </div>

      {alarms.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line px-5 py-10 text-center text-muted">
          {copy.empty}
        </div>
      ) : (
        <ul className="grid gap-3">
          {alarms.map((alarm) => (
            <li
              key={alarm.id}
              className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-mono text-3xl text-accent tabular-nums">
                  {alarm.time}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {formatPrettyTime(alarm.time)} · {alarm.query}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onPreview(alarm)}
                  className="rounded-full border border-line px-4 py-2 text-sm text-fg transition hover:border-accent hover:text-accent"
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(alarm.id)}
                  className="rounded-full border border-line px-4 py-2 text-sm text-muted transition hover:border-accent hover:text-accent"
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
