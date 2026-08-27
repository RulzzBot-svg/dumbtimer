import { plusMinutesFromNow } from '../lib/time.js'

export function AlarmForm({
  time,
  query,
  onTimeChange,
  onQueryChange,
  onSubmit,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-cream/10 bg-ink-2/80 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md"
    >
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-cream">Set an alarm</h2>
          <p className="mt-1 text-sm text-cream-dim">
            Pick a time and a GIF mood. Cats work even without a Giphy key.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,160px)_1fr]">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold tracking-[0.18em] text-cream-dim uppercase">
            Time
          </span>
          <input
            type="time"
            required
            value={time}
            onChange={(event) => onTimeChange(event.target.value)}
            className="h-12 w-full rounded-2xl border border-cream/10 bg-ink-3 px-3 font-mono text-lg text-cream outline-none focus:border-amber/60"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold tracking-[0.18em] text-cream-dim uppercase">
            GIF search
          </span>
          <input
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder='cute cats, or "Dark Souls You Died"'
            maxLength={80}
            className="h-12 w-full rounded-2xl border border-cream/10 bg-ink-3 px-4 text-cream outline-none placeholder:text-cream/30 focus:border-blush/70"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-cream/40">Quick set</span>
        {[1, 5, 10].map((minutes) => (
          <button
            key={minutes}
            type="button"
            onClick={() => onTimeChange(plusMinutesFromNow(minutes))}
            className="rounded-full border border-cream/10 px-3 py-1 text-xs text-cream-dim transition hover:border-amber/50 hover:text-amber"
          >
            +{minutes} min
          </button>
        ))}
      </div>

      <button
        type="submit"
        className="mt-5 h-12 w-full rounded-2xl font-semibold text-ink shadow-[0_10px_30px_rgba(240,184,110,0.25)] transition hover:brightness-110"
        style={{ background: 'linear-gradient(90deg, #f0b86e, #e7a6b6)' }}
      >
        Save alarm
      </button>
    </form>
  )
}
