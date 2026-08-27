export function ModeToggle({ mode, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="App mode"
      className="inline-flex rounded-full border border-line bg-card p-1 text-sm shadow-sm"
    >
      {[
        { id: 'desk', label: 'Desk' },
        { id: 'nightstand', label: 'Nightstand' },
      ].map((option) => {
        const selected = mode === option.id
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.id)}
            className={`rounded-full px-3.5 py-1.5 font-medium transition ${
              selected ? 'bg-fg text-bg' : 'text-muted hover:text-fg'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
