'use client'
import { useEffect, useState } from 'react'

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

const KEY = 'install-dismissed'
const read = () => { try { return localStorage.getItem(KEY) === '1' } catch { return false } }
const write = () => { try { localStorage.setItem(KEY, '1') } catch { /* storage blocked: the prompt may come back, which is fine */ } }

/** Registers the offline-fallback service worker and offers "Add to home screen" where the browser supports it. */
export function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) void navigator.serviceWorker.register('/sw.js').catch(() => undefined)
    const onPrompt = (e: Event) => {
      e.preventDefault()
      if (!read()) setEvent(e as InstallEvent)
    }
    const onInstalled = () => setEvent(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!event) return null
  const close = () => { write(); setEvent(null) }
  return (
    <aside className="install" role="dialog" aria-labelledby="install-title">
      <h2 id="install-title">Add Tirumala Mobiles to your home screen</h2>
      <p>Open the catalogue like an app. Prices and availability always load fresh from the shop.</p>
      <div className="actions">
        <button className="btn" onClick={() => { void event.prompt().then(() => event.userChoice).finally(close) }}>Install</button>
        <button className="btn btn-ghost" onClick={close}>Not now</button>
      </div>
    </aside>
  )
}
