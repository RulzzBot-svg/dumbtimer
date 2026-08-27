export function Toast({ message }) {
  if (!message) return null

  return (
    <div
      className="fixed right-4 bottom-4 z-40 max-w-sm rounded-2xl border border-line bg-card px-4 py-3 text-sm text-fg shadow-lg"
      style={{ animation: 'toast-in 280ms ease-out' }}
      role="status"
    >
      {message}
    </div>
  )
}
