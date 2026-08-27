import { useEffect, useRef, useState } from 'react'
import { searchGifs } from '../lib/media.js'

export function GifPicker({ query, giphyKey, selected, onSelect }) {
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const requestId = useRef(0)

  async function loadResults() {
    const gifs = await searchGifs(query, giphyKey)
    setResults(gifs)
    return gifs
  }

  useEffect(() => {
    if (!query.trim()) return undefined
    const id = ++requestId.current
    const timer = window.setTimeout(() => {
      setStatus('searching')
      setError('')
      searchGifs(query, giphyKey)
        .then((gifs) => {
          if (id !== requestId.current) return
          setResults(gifs)
          setStatus(gifs.length ? 'ready' : 'empty')
          if (gifs.length === 0) {
            setError('No GIFs for that phrase. Try “lunch”, “leave work”, or a movie quote.')
          }
        })
        .catch((caught) => {
          if (id !== requestId.current) return
          console.warn(caught)
          setResults([])
          setStatus('error')
          setError(
            giphyKey
              ? 'Giphy search missed. Try another phrase.'
              : 'Giphy is not connected, so search cannot run.',
          )
        })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [query, giphyKey])

  async function handleSearch() {
    setStatus('searching')
    setError('')
    try {
      const gifs = await loadResults()
      setStatus(gifs.length ? 'ready' : 'empty')
      if (gifs.length === 0) {
        setError('No GIFs for that phrase. Try “lunch”, “leave work”, or a movie quote.')
      }
    } catch (caught) {
      console.warn(caught)
      setError(
        giphyKey
          ? 'Giphy search missed. Try another phrase.'
          : 'Giphy is not connected, so search cannot run.',
      )
      setStatus('error')
    }
  }

  async function handleRandom() {
    setStatus('randomizing')
    setError('')
    try {
      const gifs = results.length > 0 ? results : await loadResults()
      if (gifs.length === 0) {
        setStatus('empty')
        setError('No GIFs to randomize. Search a clearer phrase first.')
        return
      }
      const next = gifs[Math.floor(Math.random() * gifs.length)]
      onSelect(next)
      setStatus('ready')
    } catch (caught) {
      console.warn(caught)
      setError('Could not pick a GIF. Hit Search first.')
      setStatus('error')
    }
  }

  const selectedId = selected?.id || selected?.url

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSearch}
          className="rounded-full border border-line px-4 py-2 text-sm text-fg transition hover:border-accent hover:text-accent"
        >
          {status === 'searching' ? 'Searching…' : 'Search GIFs'}
        </button>
        <button
          type="button"
          onClick={handleRandom}
          className="rounded-full bg-fg px-4 py-2 text-sm font-medium text-bg transition hover:bg-accent"
        >
          {status === 'randomizing' ? 'Picking…' : 'Random'}
        </button>
        {selected ? (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="rounded-full border border-line px-4 py-2 text-sm text-muted hover:text-fg"
          >
            Clear
          </button>
        ) : null}
      </div>

      {selected ? (
        <div className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-bg px-3 py-2">
          <img
            src={selected.previewUrl || selected.url}
            alt=""
            className="h-14 w-14 rounded-xl object-cover"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.16em] text-accent uppercase">
              Using this GIF
            </p>
            <p className="truncate text-sm text-fg">{selected.title}</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted">
          Results update as you type. Click one, or hit Random for a related pick.
        </p>
      )}

      {error ? <p className="text-sm text-accent">{error}</p> : null}

      {results.length > 0 ? (
        <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
          {results.map((gif) => {
            const active = (gif.id || gif.url) === selectedId
            return (
              <button
                key={gif.id || gif.url}
                type="button"
                onClick={() => onSelect(gif)}
                className={`overflow-hidden rounded-2xl border ${
                  active ? 'border-accent ring-2 ring-accent/40' : 'border-line'
                }`}
                title={gif.title}
              >
                <img
                  src={gif.previewUrl || gif.url}
                  alt={gif.title}
                  className="aspect-square h-full w-full object-cover"
                />
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
