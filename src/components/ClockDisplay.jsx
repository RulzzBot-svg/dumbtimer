export function ClockDisplay({ now }) {
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const weekday = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <section className="text-center">
      <p className="mb-3 text-[0.7rem] font-semibold tracking-[0.42em] text-amber/80 uppercase">
        Nightstand
      </p>
      <div className="relative mx-auto inline-block">
        <div
          className="pointer-events-none absolute inset-x-6 -inset-y-4 rounded-full bg-amber/20 blur-3xl"
          style={{ animation: 'glow-pulse 5s ease-in-out infinite' }}
        />
        <time
          dateTime={now.toISOString()}
          className="relative font-mono text-[14vw] leading-none font-medium tracking-tight text-cream tabular-nums sm:text-8xl md:text-9xl"
          style={{
            textShadow: '0 0 28px rgba(240, 184, 110, 0.35)',
          }}
        >
          {hours}
          <span className="text-amber/80">:</span>
          {minutes}
          <span className="ml-2 align-top font-sans text-[0.28em] tracking-[0.2em] text-cream-dim">
            {seconds}
          </span>
        </time>
      </div>
      <p className="mt-4 font-serif text-lg text-cream-dim italic">{weekday}</p>
    </section>
  )
}
