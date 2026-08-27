export function ClockDisplay({ now, mode, kicker }) {
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const weekday = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  const nightstand = mode === 'nightstand'

  return (
    <section className="text-center">
      <p
        className={`mb-3 text-[0.7rem] font-semibold tracking-[0.42em] uppercase ${
          nightstand ? 'text-accent/80' : 'text-muted'
        }`}
      >
        {kicker}
      </p>
      <div className="relative mx-auto inline-block">
        {nightstand ? (
          <div
            className="pointer-events-none absolute inset-x-6 -inset-y-4 rounded-full bg-accent/20 blur-3xl"
            style={{ animation: 'glow-pulse 5s ease-in-out infinite' }}
          />
        ) : null}
        <time
          dateTime={now.toISOString()}
          className="relative font-mono text-[14vw] leading-none font-medium tracking-tight text-fg tabular-nums sm:text-8xl md:text-9xl"
          style={
            nightstand
              ? { textShadow: '0 0 28px rgba(240, 184, 110, 0.35)' }
              : undefined
          }
        >
          {hours}
          <span className="text-accent">:</span>
          {minutes}
          <span className="ml-2 align-top font-sans text-[0.28em] tracking-[0.2em] text-muted">
            {seconds}
          </span>
        </time>
      </div>
      <p className={`mt-4 text-lg text-muted ${nightstand ? 'font-serif italic' : ''}`}>
        {weekday}
      </p>
    </section>
  )
}
