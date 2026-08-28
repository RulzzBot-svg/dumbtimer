import { DESK_PRESETS } from '../lib/copy.js'
import { plusMinutesFromNow } from '../lib/time.js'
import { GifPicker } from './GifPicker.jsx'

export function AlarmForm({
  mode,
  copy,
  time,
  query,
  giphyKey,
  selectedGif,
  repeat,
  onTimeChange,
  onQueryChange,
  onGifChange,
  onRepeatChange,
  onSubmit,
  canSaveTemplate,
  onSaveTemplate,
}) {
  const desk = mode === 'desk'

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-line bg-card p-5 shadow-[0_16px_40px_rgba(28,25,21,0.08)]"
    >
      <div className="mb-4">
        <h2 className="font-serif text-2xl text-fg">{copy.formTitle}</h2>
        <p className="mt-1 text-sm text-muted">{copy.formHint}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,160px)_1fr]">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold tracking-[0.18em] text-muted uppercase">
            Time
          </span>
          <input
            type="time"
            required
            value={time}
            onChange={(event) => onTimeChange(event.target.value)}
            className="h-12 w-full rounded-2xl border border-line bg-bg px-3 font-mono text-lg text-fg outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold tracking-[0.18em] text-muted uppercase">
            GIF search
          </span>
          <input
            type="text"
            value={query}
            onChange={(event) => {
              onQueryChange(event.target.value)
              onGifChange(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.preventDefault()
            }}
            placeholder={desk ? 'time to leave work' : 'cute cats'}
            maxLength={80}
            className="h-12 w-full rounded-2xl border border-line bg-bg px-4 text-fg outline-none placeholder:text-muted/50 focus:border-accent"
          />
        </label>
      </div>

      {desk ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Moods</span>
          {DESK_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                onQueryChange(preset.query)
                onGifChange(null)
                if (preset.time) onTimeChange(preset.time)
              }}
              className="rounded-full border border-line px-3 py-1 text-xs text-muted transition hover:border-accent hover:text-accent"
            >
              {preset.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Quick set</span>
        {[1, 5, 10].map((minutes) => (
          <button
            key={minutes}
            type="button"
            onClick={() => onTimeChange(plusMinutesFromNow(minutes))}
            className="rounded-full border border-line px-3 py-1 text-xs text-muted transition hover:border-accent hover:text-accent"
          >
            +{minutes} min
          </button>
        ))}
      </div>

      <GifPicker
        query={query}
        giphyKey={giphyKey}
        selected={selectedGif}
        onSelect={onGifChange}
      />

      <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-line bg-bg px-4 py-3">
        <span>
          <span className="block font-medium text-fg">Every day</span>
          <span className="block text-xs text-muted">
            Same time, every day. Turn off for a one-time ping.
          </span>
        </span>
        <input
          type="checkbox"
          checked={repeat === 'daily'}
          onChange={(event) =>
            onRepeatChange(event.target.checked ? 'daily' : 'once')
          }
          className="h-5 w-5 accent-current"
        />
      </label>

      <button
        type="submit"
        className="mt-5 h-12 w-full rounded-2xl bg-fg font-semibold text-bg transition hover:bg-accent"
      >
        {copy.saveLabel}
      </button>
      {canSaveTemplate ? (
        <button
          type="button"
          onClick={onSaveTemplate}
          className="mt-2 h-11 w-full rounded-2xl border border-line text-sm font-medium text-fg transition hover:border-accent"
        >
          Save as template
        </button>
      ) : null}
    </form>
  )
}
