import http from 'node:http'

const PORT = Number(process.env.API_PORT || 8788)

async function loadHandler(name) {
  const url = new URL(`../api/${name}.js`, import.meta.url).href
  const mod = await import(url)
  return mod.default
}

const routes = {
  '/api/auth': () => loadHandler('auth'),
  '/api/presets': () => loadHandler('presets'),
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1')
  const loader = routes[url.pathname]
  if (!loader) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Not found' }))
    return
  }
  try {
    const handler = await loader()
    await handler(req, res)
  } catch (error) {
    console.error(error)
    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'API missed' }))
    }
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Desk API on http://127.0.0.1:${PORT}`)
})
