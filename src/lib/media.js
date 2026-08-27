const FALLBACK_CAT = {
  url: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Maxwell-cat.gif',
  pageUrl: 'https://commons.wikimedia.org/wiki/File:Maxwell-cat.gif',
  title: 'Maxwell the cat',
  source: 'fallback',
  attribution: 'Wikimedia Commons',
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)]
}

async function fetchGiphy(query, apiKey) {
  const params = new URLSearchParams({
    api_key: apiKey,
    q: query,
    limit: '12',
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
  if (gifs.length === 0) return null
  const gif = pick(gifs)
  const images = gif.images ?? {}
  const url =
    images.downsized?.url ||
    images.original?.url ||
    images.fixed_height?.url
  if (!url) return null
  return {
    url,
    pageUrl: gif.url || 'https://giphy.com',
    title: gif.title || query,
    source: 'giphy',
    attribution: 'GIPHY',
  }
}

async function fetchWikimediaGif(query) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: `${query} filemime:gif`,
    gsrnamespace: '6',
    gsrlimit: '8',
    prop: 'imageinfo',
    iiprop: 'url|mime|size',
  })
  const response = await fetch(
    `https://commons.wikimedia.org/w/api.php?${params.toString()}`,
  )
  if (!response.ok) return null
  const payload = await response.json()
  const pages = Object.values(payload.query?.pages ?? {})
  const gifs = pages
    .map((page) => {
      const info = page.imageinfo?.[0]
      if (!info?.url) return null
      if (info.mime && info.mime !== 'image/gif') return null
      return {
        url: info.url.split('?')[0],
        pageUrl: page.title
          ? `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`
          : info.descriptionurl,
        title: (page.title || query).replace(/^File:/, '').replace(/_/g, ' '),
        source: 'wikimedia',
        attribution: 'Wikimedia Commons',
      }
    })
    .filter(Boolean)
  if (gifs.length === 0) return null
  return pick(gifs)
}

export async function fetchAlarmGif(rawQuery, giphyKey) {
  const query = (rawQuery || '').trim() || 'cute cats'

  if (giphyKey) {
    try {
      const giphy = await fetchGiphy(query, giphyKey)
      if (giphy) return giphy
    } catch (error) {
      console.warn('Giphy search failed, using a backup GIF.', error)
    }
  }

  try {
    const wiki = await fetchWikimediaGif(query)
    if (wiki) return wiki
  } catch (error) {
    console.warn('Wikimedia search failed.', error)
  }

  if (!/cat/i.test(query)) {
    try {
      const cats = await fetchWikimediaGif('cute cat gif')
      if (cats) {
        return {
          ...cats,
          title: `${cats.title} (backup cute cat)`,
        }
      }
    } catch {
      // Fall through to the bundled Maxwell.
    }
  }

  return FALLBACK_CAT
}
