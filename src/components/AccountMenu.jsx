import { useEffect, useState } from 'react'
import {
  createPreset,
  deletePreset,
  fetchPresets,
  importPreset,
  loginAccount,
  logoutAccount,
  registerAccount,
  resizeProfilePic,
  sharePreset,
  updateProfile,
} from '../lib/account.js'

function Avatar({ user, size = 'md' }) {
  const dim = size === 'sm' ? 'h-9 w-9 text-xs' : 'h-14 w-14 text-lg'
  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt=""
        className={`${dim} rounded-full object-cover border border-line`}
      />
    )
  }
  const letter = (user?.username || '?').slice(0, 1).toUpperCase()
  return (
    <span
      className={`${dim} inline-flex items-center justify-center rounded-full bg-fg font-semibold text-bg`}
    >
      {letter}
    </span>
  )
}

function TemplateCard({ preset, onUse, onShare, onCopy, onDelete }) {
  return (
    <li className="rounded-2xl border border-line bg-bg p-3">
      <div className="flex items-center gap-3">
        {preset.gif?.previewUrl || preset.gif?.url ? (
          <img
            src={preset.gif.previewUrl || preset.gif.url}
            alt=""
            className="h-12 w-12 rounded-xl object-cover"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-fg">{preset.name}</p>
          <p className="truncate text-xs text-muted">
            {preset.time ? `${preset.time} · ` : ''}
            {preset.query}
            {preset.owner ? ` · @${preset.owner}` : ''}
          </p>
          {preset.shareCode ? (
            <p className="mt-1 font-mono text-xs tracking-wider text-accent">
              {preset.shareCode}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onUse(preset)}
          className="rounded-full bg-fg px-3 py-1.5 text-xs font-medium text-bg"
        >
          Use
        </button>
        {onShare ? (
          <button
            type="button"
            onClick={() => onShare(preset)}
            className="rounded-full border border-line px-3 py-1.5 text-xs text-fg"
          >
            Share
          </button>
        ) : null}
        {onCopy ? (
          <button
            type="button"
            onClick={() => onCopy(preset.shareCode)}
            className="rounded-full border border-line px-3 py-1.5 text-xs text-fg"
          >
            Copy code
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(preset)}
            className="rounded-full border border-line px-3 py-1.5 text-xs text-muted"
          >
            Remove
          </button>
        ) : null}
      </div>
    </li>
  )
}

export function AccountButton({ user, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-card px-1.5 py-1 text-sm text-fg"
      aria-label={user ? `Account, ${user.username}` : 'Log in'}
    >
      <Avatar user={user} size="sm" />
      <span className="pr-2 max-w-[7rem] truncate">
        {user ? user.username : 'Log in'}
      </span>
    </button>
  )
}

export function AccountDrawer({
  open,
  user,
  presets,
  inbox,
  onClose,
  onAuth,
  onUser,
  onPresets,
  onUsePreset,
  onToast,
}) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [shareUser, setShareUser] = useState('')
  const [shareTarget, setShareTarget] = useState(null)
  const [importCode, setImportCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) setUsername(user.username)
  }, [user])

  useEffect(() => {
    if (open && user) {
      fetchPresets()
        .then(onPresets)
        .catch((caught) => setError(caught.message))
    }
  }, [open, user])

  if (!open) return null

  async function handleAuth(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const next =
        mode === 'register'
          ? await registerAccount(username, password)
          : await loginAccount(username, password)
      onAuth(next)
      onToast(`Hey ${next.username}`)
      setPassword('')
    } catch (caught) {
      setError(caught.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleAvatar(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const avatar = await resizeProfilePic(file)
      const next = await updateProfile({ avatar })
      onUser(next)
      onToast('Profile pic saved')
    } catch (caught) {
      setError(caught.message)
    } finally {
      setBusy(false)
      event.target.value = ''
    }
  }

  async function handleUsername(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const next = await updateProfile({ username })
      onUser(next)
      onToast('Username updated')
    } catch (caught) {
      setError(caught.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleShare(event) {
    event.preventDefault()
    if (!shareTarget) return
    setBusy(true)
    setError('')
    try {
      const result = await sharePreset(shareTarget.id, shareUser)
      onToast(`Shared with @${result.to}`)
      setShareUser('')
      setShareTarget(null)
      onPresets(await fetchPresets())
    } catch (caught) {
      setError(caught.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleImport(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const preset = await importPreset(importCode)
      onPresets(await fetchPresets())
      onToast(`Imported ${preset.name}`)
      setImportCode('')
    } catch (caught) {
      setError(caught.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-overlay p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close account"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[88svh] w-full max-w-md overflow-y-auto rounded-[1.75rem] border border-line bg-card p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">
              Account
            </p>
            <h2 className="mt-1 font-serif text-2xl text-fg">
              {user ? `@${user.username}` : 'Log in'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-line px-3 py-1 text-sm text-muted"
          >
            Close
          </button>
        </div>

        {error ? <p className="mb-3 text-sm text-accent">{error}</p> : null}

        {!user ? (
          <form onSubmit={handleAuth} className="space-y-3">
            <p className="text-sm text-muted">
              No email, no verification. Pick a username and a password so you
              can save templates and send them to a friend.
            </p>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold tracking-[0.18em] text-muted uppercase">
                Username
              </span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                className="h-11 w-full rounded-2xl border border-line bg-bg px-3 text-fg outline-none focus:border-accent"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold tracking-[0.18em] text-muted uppercase">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                className="h-11 w-full rounded-2xl border border-line bg-bg px-3 text-fg outline-none focus:border-accent"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="h-11 w-full rounded-2xl bg-fg font-semibold text-bg"
            >
              {busy ? 'Working…' : mode === 'register' ? 'Create account' : 'Log in'}
            </button>
            <button
              type="button"
              onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
              className="w-full text-sm text-muted"
            >
              {mode === 'register'
                ? 'Already have one? Log in'
                : 'New here? Create an account'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Avatar user={user} />
              <label className="rounded-full border border-line px-3 py-1.5 text-sm text-fg">
                Change pic
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatar}
                />
              </label>
            </div>

            <form onSubmit={handleUsername} className="flex gap-2">
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="h-11 min-w-0 flex-1 rounded-2xl border border-line bg-bg px-3 text-fg outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-2xl border border-line px-3 text-sm text-fg"
              >
                Save
              </button>
            </form>

            <form onSubmit={handleImport} className="space-y-2">
              <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
                Have a code?
              </p>
              <div className="flex gap-2">
                <input
                  value={importCode}
                  onChange={(event) => setImportCode(event.target.value.toUpperCase())}
                  placeholder="AB12CD"
                  className="h-11 min-w-0 flex-1 rounded-2xl border border-line bg-bg px-3 font-mono text-fg outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-2xl bg-fg px-3 text-sm font-medium text-bg"
                >
                  Import
                </button>
              </div>
            </form>

            {shareTarget ? (
              <form onSubmit={handleShare} className="space-y-2 rounded-2xl border border-accent/40 bg-bg p-3">
                <p className="text-sm text-fg">
                  Send <span className="font-medium">{shareTarget.name}</span> to
                </p>
                <div className="flex gap-2">
                  <input
                    value={shareUser}
                    onChange={(event) => setShareUser(event.target.value)}
                    placeholder="their username"
                    className="h-11 min-w-0 flex-1 rounded-2xl border border-line bg-card px-3 text-fg outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-2xl bg-fg px-3 text-sm font-medium text-bg"
                  >
                    Send
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShareTarget(null)}
                  className="text-xs text-muted"
                >
                  Cancel
                </button>
              </form>
            ) : null}

            <section>
              <h3 className="mb-2 font-serif text-xl text-fg">Your templates</h3>
              {presets.length === 0 ? (
                <p className="text-sm text-muted">
                  Save a ping as a template, then share the code or send it to a
                  username.
                </p>
              ) : (
                <ul className="grid gap-2">
                  {presets.map((preset) => (
                    <TemplateCard
                      key={preset.id}
                      preset={preset}
                      onUse={onUsePreset}
                      onShare={setShareTarget}
                      onCopy={async (code) => {
                        try {
                          await navigator.clipboard.writeText(code)
                          onToast(`Copied ${code}`)
                        } catch {
                          onToast(code)
                        }
                      }}
                      onDelete={async (item) => {
                        try {
                          await deletePreset(item.id)
                          onPresets(await fetchPresets())
                          onToast('Template removed')
                        } catch (caught) {
                          setError(caught.message)
                        }
                      }}
                    />
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-2 font-serif text-xl text-fg">Inbox</h3>
              {inbox.length === 0 ? (
                <p className="text-sm text-muted">
                  When someone shares a template with you, it lands here.
                </p>
              ) : (
                <ul className="grid gap-2">
                  {inbox.map((preset) => (
                    <TemplateCard
                      key={`${preset.id}-${preset.owner}`}
                      preset={preset}
                      onUse={onUsePreset}
                    />
                  ))}
                </ul>
              )}
            </section>

            <button
              type="button"
              onClick={() => {
                logoutAccount()
                onAuth(null)
                onToast('Logged out')
              }}
              className="w-full text-sm text-muted"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
