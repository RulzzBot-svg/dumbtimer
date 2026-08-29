export function parseShareCodes(raw) {
  const matches = String(raw || '')
    .toUpperCase()
    .match(/[A-Z0-9]{6,8}/g)
  if (!matches) return []
  return [...new Set(matches)]
}
