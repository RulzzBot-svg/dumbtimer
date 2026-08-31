const params = new URLSearchParams(location.search)
const title = params.get('title') || 'Desk ping'
const time = params.get('time') || ''
const gif = params.get('gif') || ''

document.getElementById('title').textContent = title
document.getElementById('time').textContent = time ? `Desk · ${time} · click to open` : 'Click to open Desk'
const img = document.getElementById('gif')
if (gif) img.src = gif
else img.style.display = 'none'

document.getElementById('open').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'desk:open' }, () => window.close())
})

window.setTimeout(() => window.close(), 8000)
