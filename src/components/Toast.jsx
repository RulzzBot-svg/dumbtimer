export function Toast({ message }) {
  if (!message) return null

  return (
    <div
      className="fixed right-4 bottom-4 z-40 max-w-sm rounded-2xl border border-cream/15 bg-ink-3/95 px-4 py-3 text-sm text-cream shadow-lg backdrop-blur"
      style={{ animation: 'toast-in 280ms ease-out' }}
      role="status"
    >
      {message}
    </div>
  )
}
