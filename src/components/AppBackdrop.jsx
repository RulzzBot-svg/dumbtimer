import { Starfield } from './Starfield.jsx'

export function AppBackdrop({ mode }) {
  if (mode === 'nightstand') {
    return (
      <>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(240,184,110,0.16),_transparent_42%),radial-gradient(ellipse_at_bottom,_rgba(154,208,194,0.08),_transparent_46%)]" />
        <Starfield />
      </>
    )
  }

  return (
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(194,78,36,0.08),_transparent_40%)]" />
  )
}
