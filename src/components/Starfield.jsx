const STARS = [
  [8, 12],
  [18, 28],
  [27, 9],
  [41, 18],
  [55, 8],
  [68, 22],
  [79, 11],
  [91, 19],
  [12, 48],
  [33, 62],
  [61, 44],
  [84, 57],
  [6, 78],
  [48, 82],
  [73, 74],
  [94, 86],
]

export function Starfield() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {STARS.map(([left, top], index) => (
        <span
          key={`${left}-${top}`}
          className="absolute h-0.5 w-0.5 rounded-full bg-fg"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            animation: `star-twinkle ${3 + (index % 4)}s ease-in-out ${index * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  )
}
