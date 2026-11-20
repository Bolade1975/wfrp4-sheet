import { useEffect, useState } from 'react'
import { requestPersistence } from './db/db'
import { CharacterScreen } from './screens/CharacterScreen'
import { TAB_KEYS, type TabKey } from './screens/tabKeys'
import { RosterScreen } from './screens/RosterScreen'

type Route = { screen: 'roster' } | { screen: 'character'; id: string; tab: TabKey }

/** Hash routes survive reloads and work under any GitHub Pages sub-path. */
function parseHash(hash: string): Route {
  const m = /^#\/c\/([^/]+)(?:\/([A-Za-z]+))?/.exec(hash)
  if (m && m[1]) {
    const t = m[2] as TabKey | undefined
    return {
      screen: 'character',
      id: decodeURIComponent(m[1]),
      tab: t && TAB_KEYS.includes(t) ? t : 'character',
    }
  }
  return { screen: 'roster' }
}

function toHash(r: Route): string {
  return r.screen === 'roster' ? '#/' : `#/c/${encodeURIComponent(r.id)}/${r.tab}`
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onHash)
    void requestPersistence()
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = (r: Route) => {
    window.location.hash = toHash(r)
    setRoute(r)
  }

  if (route.screen === 'character')
    return (
      <CharacterScreen
        key={route.id}
        id={route.id}
        tab={route.tab}
        setTab={(tab) => {
          window.history.replaceState(null, '', toHash({ ...route, tab }))
          setRoute({ ...route, tab })
        }}
        back={() => go({ screen: 'roster' })}
      />
    )

  return (
    <>
      <header className="topbar">
        <div className="topbar-row">
          <div className="topbar-title">
            Character Sheet
            <small>Warhammer Fantasy Roleplay 4th Edition · offline · v{__APP_VERSION__}</small>
          </div>
        </div>
      </header>
      <RosterScreen open={(id) => go({ screen: 'character', id, tab: 'character' })} />
    </>
  )
}
