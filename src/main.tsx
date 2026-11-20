import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles.css'

// Offline-first: the service worker precaches the whole app (including the
// PDF engine and fonts) on first load and updates itself in the background.
// A new version activates immediately and the page reloads once; characters
// live in IndexedDB, which service-worker updates never touch. Pending edits
// are flushed on pagehide by the autosave store before the reload.
// The app also checks for a new version whenever it is brought back to the
// foreground (tablets often keep a PWA open for days).
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine)
        void registration.update().catch(() => undefined)
    })
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
