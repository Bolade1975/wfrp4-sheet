import type { XpEntry } from '../../domain/schema'
import { xpSummary } from '../../rules/xp'
import { useChar } from '../../state/store'
import { Panel } from '../../ui/components'
import { NumberField } from '../../ui/fields'
import { ItemList } from '../../ui/ItemList'
import { todayIso } from '../../ui/format'
import { XP_CATEGORY } from '../../ui/labels'

export function XpTab() {
  const { c, update } = useChar()
  const s = xpSummary(c)
  return (
    <div className="stack">
      <div className="xp-summary">
        <div className="stat big">
          <span className="lbl">Total earned</span>
          <b className="num">{s.total}</b>
        </div>
        <span className="op">−</span>
        <div className="stat big">
          <span className="lbl">Spent</span>
          <b className="num">{s.spent}</b>
        </div>
        <span className="op">=</span>
        <div className={`stat big ${s.negativeCurrent ? 'bad' : ''}`}>
          <span className="lbl">Unspent (Current)</span>
          <b className="num">{s.current}</b>
        </div>
      </div>
      {s.negativeCurrent && (
        <div className="banner warn">More XP spent than earned — check the log.</div>
      )}
      {s.incomplete > 0 && (
        <div className="banner warn">
          {s.incomplete} log entr{s.incomplete === 1 ? 'y has' : 'ies have'} no XP amount and
          {s.incomplete === 1 ? ' is' : ' are'} not counted.
        </div>
      )}

      <Panel
        title="Starting balance"
        hint="Optional: XP earned and spent before you started this log (e.g. copied from a paper sheet). Leave empty if the log covers everything."
      >
        <div className="fields">
          <NumberField
            label="Earned before log"
            value={c.xp.openingTotal}
            onChange={(v) => update((x) => void (x.xp.openingTotal = v))}
          />
          <NumberField
            label="Spent before log"
            value={c.xp.openingSpent}
            onChange={(v) => update((x) => void (x.xp.openingSpent = v))}
          />
        </div>
        <p className="hint">
          Total = earned before log + earned in log ({s.earnedInLog}). Spent = spent before log +
          spent in log ({s.spentInLog}).
        </p>
      </Panel>

      <Panel
        title="Advancement log"
        hint="Record each award and purchase. XP costs are typed in by you (cost rules: Core Rulebook p. 47–49); the app does not calculate them and never changes your Characteristics or Skills."
      >
        <ItemList<XpEntry>
          items={c.xp.log}
          onChange={(v) => update((x) => void (x.xp.log = v))}
          addLabel="Add entry"
          emptyText="No entries yet."
          title={(e) => (
            <>
              <span className={`badge ${e.kind === 'earned' ? 'earned' : 'spent'}`}>
                {e.kind === 'earned' ? 'Earned' : 'Spent'}
              </span>{' '}
              {e.name || XP_CATEGORY[e.category]}
              {(e.before || e.after) && (
                <span className="hint">
                  {' '}
                  {e.before || '—'} → {e.after || '—'}
                </span>
              )}
            </>
          )}
          columns={[
            {
              label: 'XP',
              get: (e) =>
                e.amount === null ? '—' : `${e.kind === 'earned' ? '+' : '−'}${e.amount}`,
            },
            { label: '', get: (e) => [e.session, e.date].filter(Boolean).join(' · ') || '' },
          ]}
          make={() => ({
            kind: 'spent',
            date: todayIso(),
            session: '',
            category: 'skill',
            name: '',
            before: '',
            after: '',
            amount: null,
            notes: '',
          })}
          fields={[
            {
              key: 'kind',
              label: 'Entry',
              type: 'select',
              options: [
                { value: 'spent', label: 'Spent (advance / purchase)' },
                { value: 'earned', label: 'Earned (award)' },
              ],
            },
            {
              key: 'category',
              label: 'Category',
              type: 'select',
              options: Object.entries(XP_CATEGORY).map(([value, label]) => ({ value, label })),
            },
            { key: 'name', label: 'What changed (e.g. Dodge, WS, Hardy)', type: 'text' },
            { key: 'amount', label: 'XP', type: 'int' },
            { key: 'before', label: 'Before', type: 'text' },
            { key: 'after', label: 'After', type: 'text' },
            { key: 'session', label: 'Session', type: 'text' },
            { key: 'date', label: 'Date', type: 'text' },
            { key: 'notes', label: 'Notes', type: 'textarea' },
          ]}
        />
      </Panel>
    </div>
  )
}
