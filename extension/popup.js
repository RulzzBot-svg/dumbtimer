function pingLabel(count) {
  if (count === 1) return '1 ping'
  return `${count || 0} pings`
}

function render(snapshot) {
  const name = document.getElementById('name')
  const meta = document.getElementById('meta')
  const avatar = document.getElementById('avatar')
  const profile = snapshot?.profile
  const count = snapshot?.pingCount || 0

  name.textContent = profile?.username ? profile.username : 'Open Desk to sign in'
  meta.textContent = pingLabel(count)

  avatar.replaceChildren()
  if (profile?.avatar) {
    const img = document.createElement('img')
    img.src = profile.avatar
    img.alt = ''
    avatar.append(img)
  } else {
    avatar.textContent = (profile?.username || 'D').slice(0, 1).toUpperCase()
  }
}

document.getElementById('open').addEventListener('click', () => {
  try {
    chrome.runtime.sendMessage({ type: 'desk:open' }, () => window.close())
  } catch {
    window.close()
  }
})

try {
  chrome.runtime.sendMessage({ type: 'desk:get' }, (snapshot) => {
    if (chrome.runtime.lastError) {
      render({ profile: null, pingCount: 0 })
      return
    }
    render(snapshot)
  })
} catch {
  render({ profile: null, pingCount: 0 })
}

function render(snapshot) {
  const name = document.getElementById('name')
  const meta = document.getElementById('meta')
  const avatar = document.getElementById('avatar')
  const profile = snapshot?.profile
  const count = snapshot?.pingCount || 0

  name.textContent = profile?.username ? profile.username : 'Open Desk to sign in'
  meta.textContent = pingLabel(count)

  avatar.replaceChildren()
  if (profile?.avatar) {
    const img = document.createElement('img')
    img.src = profile.avatar
    img.alt = ''
    avatar.append(img)
  } else {
    avatar.textContent = (profile?.username || 'D').slice(0, 1).toUpperCase()
  }
}

document.getElementById('open').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'desk:open' }, () => window.close())
})

chrome.runtime.sendMessage({ type: 'desk:get' }, (snapshot) => {
  if (chrome.runtime.lastError) {
    render({ profile: null, pingCount: 0 })
    return
  }
  render(snapshot)
})
