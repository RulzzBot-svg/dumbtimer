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
  const url =
    images.downsized?.url ||
    images.original?.url ||
    images.fixed_height?.url
  const previewUrl =
    images.fixed_width_small?.url ||
    images.preview_gif?.url ||
    images.fixed_height_small?.url ||
    url
  if (!url) return null
  return {
    id: gif.id,
    url,
    previewUrl,
    pageUrl: gif.url || 'https://giphy.com',
    title: gif.title || query,
    source: 'giphy',
    attribution: 'GIPHY',
  }
}

async function fetchGiphySearch(query, apiKey, limit = 16) {
  const params = new URLSearchParams({
    api_key: apiKey,
    q: query,
    limit: String(limit),
    rating: 'pg-13',
    lang: 'en',
  })
  const response = await fetch(
    `https://api.giphy.com/v1/gifs/search?${params.toString()}`,
  )
  if (!response.ok) {
    throw new Error(`Giphy responded with ${response.status}`)
  }
  const payload = await response.json()
  const gifs = Array.isArray(payload.data) ? payload.data : []
  return gifs.map((gif) => mapGiphyGif(gif, query)).filter(Boolean)
}

async function fetchWikimediaGifs(query, limit = 8) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: `${query} filemime:gif`,
    gsrnamespace: '6',
    gsrlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url|mime|size',
  })
  const response = await fetch(
    `https://commons.wikimedia.org/w/api.php?${params.toString()}`,
  )
  if (!response.ok) return []
  const payload = await response.json()
  const pages = Object.values(payload.query?.pages ?? {})
  return pages
    .map((page) => {
      const info = page.imageinfo?.[0]
      if (!info?.url) return null
      if (info.mime && info.mime !== 'image/gif') return null
      const url = info.url.split('?')[0]
      return {
        id: page.pageid ? String(page.pageid) : url,
        url,
        previewUrl: url,
        pageUrl: page.title
          ? `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`
          : info.descriptionurl,
        title: (page.title || query).replace(/^File:/, '').replace(/_/g, ' '),
        source: 'wikimedia',
        attribution: 'Wikimedia Commons',
      }
    })
    .filter(Boolean)
}

export async function searchGifs(rawQuery, giphyKey) {
  const query = (rawQuery || '').trim() || 'time to leave work'
  if (giphyKey) {
    try {
      const giphy = await fetchGiphySearch(query, giphyKey)
      if (giphy.length > 0) return giphy
    } catch (error) {
      console.warn('Giphy search failed, using a backup source.', error)
    }
  }
  const wiki = await fetchWikimediaGifs(query)
  if (wiki.length > 0) return wiki
  return [FALLBACK_CAT]
}

export async function fetchAlarmGif(rawQuery, giphyKey, savedGif) {
  if (savedGif?.url) return savedGif
  const results = await searchGifs(rawQuery, giphyKey)
  return pick(results) || FALLBACK_CAT
}
