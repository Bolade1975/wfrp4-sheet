import { useMemo } from 'react'
import { careerLine, displayName, speciesLabel, statusLabel } from '../domain/factory'
import { CharacterContext, useCharacterStore, type SaveStatus } from '../state/store'
import { type TabKey } from './tabKeys'
import { CharacteristicsTab } from './tabs/CharacteristicsTab'
import { CombatTab } from './tabs/CombatTab'
import { ExportTab } from './tabs/ExportTab'
import { InventoryTab } from './tabs/InventoryTab'
import { LoadoutTab } from './tabs/LoadoutTab'
import { MagicTab } from './tabs/MagicTab'
import { NotesTab } from './tabs/NotesTab'
import { OverviewTab } from './tabs/OverviewTab'
import { SkillsTab } from './tabs/SkillsTab'
import { TalentsTab } from './tabs/TalentsTab'
import { TestsTab } from './tabs/TestsTab'
import { XpTab } from './tabs/XpTab'

const TABS: { key: TabKey; label: string; play?: boolean }[] = [
  { key: 'combat', label: 'Combat', play: true },
  { key: 'loadout', label: 'Current Loadout', play: true },
  { key: 'tests', label: 'Tests', play: true },
  { key: 'character', label: 'Character' },
  { key: 'characteristics', label: 'Characteristics' },
  { key: 'skills', label: 'Skills' },
  { key: 'talents', label: 'Talents & Traits' },
  { key: 'magic', label: 'Spells & Prayers' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'xp', label: 'Experience' },
  { key: 'notes', label: 'Notes' },
  { key: 'export', label: 'Export' },
]

const STATUS_TEXT: Record<SaveStatus, string> = {
  loading: 'Loading…',
  saved: '✓ Saved on this device',
  pending: 'Saving…',
  saving: 'Saving…',
  error: '⚠ Not saved',
}

export function CharacterScreen(props: {
  id: string
  tab: TabKey
  setTab: (t: TabKey) => void
  back: () => void
}) {
  const store = useCharacterStore(props.id)
  const { character: c, update } = store
  const ctx = useMemo(() => (c ? { c, update } : null), [c, update])

  if (store.loadError)
    return (
      <main>
        <div className="banner">Could not open this character: {store.loadError}</div>
        <button className="btn" onClick={props.back}>
          ← Back to characters
        </button>
      </main>
    )
  if (!c || !ctx) return <main className="empty">Loading…</main>

  const sub = [speciesLabel(c), careerLine(c), statusLabel(c), c.isExample ? 'EXAMPLE DATA' : '']
    .filter(Boolean)
    .join(' · ')

  return (
    <CharacterContext.Provider value={ctx}>
      <header className="topbar">
        <div className="topbar-row">
          <button
            className="btn small ghost"
            onClick={() => void store.flush().then(props.back)}
            aria-label="Back to characters"
          >
            ← Characters
          </button>
          <div className="topbar-title">
            {displayName(c)}
            <small>{sub || 'Warhammer Fantasy Roleplay 4th Edition'}</small>
          </div>
          <span className={`status ${store.status}`} role="status" aria-live="polite">
            {STATUS_TEXT[store.status]}
          </span>
        </div>
        <nav className="tabs" aria-label="Sections">
          {TABS.map((t, i) => (
            <button
              key={t.key}
              className={`tab ${t.play ? 'play' : ''} ${i > 0 && TABS[i - 1]!.play && !t.play ? 'sep' : ''}`}
              aria-current={t.key === props.tab ? 'page' : undefined}
              onClick={() => {
                props.setTab(t.key)
                window.scrollTo({ top: 0 })
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main>
        {store.status === 'error' && (
          <div className="banner">
            <b>Your latest changes are NOT saved.</b> {store.saveError} — the app will retry on the
            next change.{' '}
            <button className="btn small" onClick={() => void store.flush()}>
              Retry now
            </button>
          </div>
        )}
        {props.tab === 'combat' && <CombatTab goTo={props.setTab} />}
        {props.tab === 'loadout' && <LoadoutTab goTo={props.setTab} />}
        {props.tab === 'tests' && <TestsTab />}
        {props.tab === 'character' && <OverviewTab />}
        {props.tab === 'characteristics' && <CharacteristicsTab />}
        {props.tab === 'skills' && <SkillsTab />}
        {props.tab === 'talents' && <TalentsTab />}
        {props.tab === 'magic' && <MagicTab />}
        {props.tab === 'inventory' && <InventoryTab />}
        {props.tab === 'xp' && <XpTab />}
        {props.tab === 'notes' && <NotesTab />}
        {props.tab === 'export' && <ExportTab />}
      </main>
    </CharacterContext.Provider>
  )
}
