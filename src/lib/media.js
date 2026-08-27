const FALLBACK_CAT = {
  id: 'fallback-maxwell',
  url: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Maxwell-cat.gif',
  previewUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Maxwell-cat.gif',
  pageUrl: 'https://commons.wikimedia.org/wiki/File:Maxwell-cat.gif',
  title: 'Maxwell the cat',
  source: 'fallback',
  attribution: 'Wikimedia Commons',
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function mapGiphyGif(gif, query) {
  const images = gif.images ?? {}
  const previewUrl =
    images.fixed_height_small?.url ||
    images.fixed_width_small?.url ||
    images.preview_gif?.url ||
    images.downsized_small?.url ||
    images.downsized?.url
  const url =
    images.original?.url ||
    images.downsized?.url ||
    images.fixed_height?.url ||
    (gif.id ? `https://i.giphy.com/${gif.id}.gif` : null) ||
    previewUrl
  if (!url && !previewUrl) return null
  return {
    id: gif.id,
    url: url || previewUrl,
    previewUrl: previewUrl || url,
    pageUrl: gif.url || 'https://giphy.com',
    title: gif.title || query,
    source: 'giphy',
    attribution: 'GIPHY',
  }
}

async function fetchGiphySearch(query, apiKey, { limit = 24, signal } = {}) {
  const params = new URLSearchParams({
    api_key: apiKey,
    q: query,
    limit: String(limit),
    rating: 'pg-13',
    lang: 'en',
  })
  const response = await fetch(
    `https://api.giphy.com/v1/gifs/search?${params.toString()}`,
    { signal },
  )
  if (!response.ok) {
    throw new Error(`Giphy responded with ${response.status}`)
  }
  const payload = await response.json()
  if (payload.meta?.status && payload.meta.status !== 200) {
    throw new Error(payload.meta.msg || 'Giphy search failed')
  }
  const gifs = Array.isArray(payload.data) ? payload.data : []
  return gifs.map((gif) => mapGiphyGif(gif, query)).filter(Boolean)
}

export async function searchGifs(rawQuery, giphyKey, signal) {
  const query = (rawQuery || '').trim() || 'time to leave work'
  if (!giphyKey) {
    throw new Error('Missing Giphy key')
  }
  return fetchGiphySearch(query, giphyKey, { signal })
}

export async function fetchAlarmGif(rawQuery, giphyKey) {
  try {
    const results = await searchGifs(rawQuery, giphyKey)
    if (results.length > 0) return pick(results)
  } catch (error) {
    console.warn('Giphy search failed.', error)
  }
  return FALLBACK_CAT
}
