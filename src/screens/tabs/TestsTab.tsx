import { useState } from 'react'
import { newId } from '../../domain/factory'
import { CHAR_KEYS, type QuickTest } from '../../domain/schema'
import { DIFFICULTIES } from '../../rules/catalog'
import {
  CHAR_LABELS,
  CHAR_NAMES,
  bonus,
  canTest,
  characteristic,
  quickTestBase,
  skillLabel,
  skillValue,
  testTarget,
} from '../../rules/engine'
import { useChar } from '../../state/store'
import { ConfirmButton, Empty, OvrBadge, Panel } from '../../ui/components'
import { NumberField, Select, TextField } from '../../ui/fields'
import { fmtSigned } from '../../ui/format'

/**
 * Quick reference for Tests during play. Values are always labelled as
 * Characteristic, Skill or Situational modifier. The difficulty selector
 * only adds the Difficulty Table modifier (p. 153) to the displayed target.
 */
export function TestsTab() {
  const { c } = useChar()
  const [diff, setDiff] = useState(0)
  const [q, setQ] = useState('')
  const n = q.trim().toLowerCase()
  const skills = c.skills
    .filter((s) => !n || skillLabel(s).toLowerCase().includes(n))
    .sort((a, b) => Number(b.favourite) - Number(a.favourite))
  const diffLabel = DIFFICULTIES.find((d) => d.modifier === diff)?.label ?? ''

  const target = (v: number | null) => {
    const t = testTarget(v, diff)
    return diff === 0 ? null : t
  }

  return (
    <div className="stack">
      <Panel
        title="Difficulty"
        hint="Optional: pick the difficulty the GM calls to see targets with that modifier added (Difficulty Table, p. 153). Base values never change."
      >
        <div className="seg wrap" role="group" aria-label="Difficulty">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.label}
              type="button"
              aria-pressed={diff === d.modifier}
              onClick={() => setDiff(d.modifier)}
            >
              {d.label} <small>{d.modifier === 0 ? '+0' : fmtSigned(d.modifier)}</small>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Characteristics" hint="Characteristic Tests use the current Characteristic.">
        <div className="test-chars">
          {CHAR_KEYS.map((k) => {
            const d = characteristic(c, k)
            const t = target(d.value)
            return (
              <div key={k} className="test-char">
                <span className="lbl">
                  {CHAR_LABELS[k]} <small>{CHAR_NAMES[k]}</small>
                </span>
                <b className="num">{d.value ?? '—'}</b>
                {d.overridden && <OvrBadge />}
                <span className="hint">Bonus {bonus(c, k) ?? '—'}</span>
                {t !== null && (
                  <span className="target">
                    {diffLabel}: <b className="num">{t}</b>
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </Panel>

      <QuickTestsPanel diff={diff} diffLabel={diffLabel} />

      <Panel title="Find a skill" hint="Favourites (★ on the Skills tab) are listed first.">
        <input
          className="input search"
          type="search"
          placeholder="Type to find a skill…"
          aria-label="Find a skill"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="test-list">
          {skills.length === 0 && <Empty>No matching skills.</Empty>}
          {skills.map((s) => {
            const d = skillValue(c, s)
            const ok = canTest(s)
            const t = target(d.value)
            return (
              <div key={s.id} className={`test-line ${ok ? '' : 'muted'}`}>
                <span className="name">
                  {s.favourite && <span className="star">★</span>} {skillLabel(s)}
                  <span className="kind">
                    Skill · {CHAR_LABELS[s.characteristic]} + {s.advances} Adv
                  </span>
                </span>
                <span className="vals">
                  {ok ? (
                    <b className="num">{d.value ?? '—'}</b>
                  ) : (
                    <span className="hint">Advanced — no Advances, cannot be Tested</span>
                  )}
                  {d.overridden && <OvrBadge />}
                  {ok && t !== null && (
                    <span className="target">
                      {diffLabel}: <b className="num">{t}</b>
                    </span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

function QuickTestsPanel(props: { diff: number; diffLabel: string }) {
  const { c, update } = useChar()
  const [editing, setEditing] = useState<string | null>(null)
  const set = (id: string, patch: Partial<QuickTest>) =>
    update((x) => {
      const t = x.quickTests.find((k) => k.id === id)
      if (t) Object.assign(t, patch)
    })
  const sourceValue = (t: QuickTest) =>
    t.source.kind === 'characteristic' ? `c:${t.source.key}` : `s:${t.source.skillId}`
  return (
    <Panel
      title="My quick tests"
      hint="Optional shortcuts you create. Each shows its base value and any situational modifier you typed in — the app does not add anything else."
      actions={
        <button
          className="btn"
          onClick={() => {
            const id = newId()
            update(
              (x) =>
                void x.quickTests.push({
                  id,
                  label: 'New test',
                  source: { kind: 'characteristic', key: 'ws' },
                  modifier: null,
                  modifierNote: '',
                  notes: '',
                }),
            )
            setEditing(id)
          }}
        >
          + Add shortcut
        </button>
      }
    >
      {c.quickTests.length === 0 && (
        <Empty>
          No shortcuts yet. Add one for Tests you make often (e.g. “Parry”, “Resist fear”).
        </Empty>
      )}
      <div className="quick-tests">
        {c.quickTests.map((t, idx) => {
          const base = quickTestBase(c, t)
          const v = base.d?.value ?? null
          const withMod = testTarget(v, t.modifier)
          const withDiff = props.diff !== 0 ? testTarget(withMod, props.diff) : null
          const open = editing === t.id
          return (
            <div key={t.id} className="quick-test">
              <button
                type="button"
                className="qt-main"
                onClick={() => setEditing(open ? null : t.id)}
              >
                <span className="qt-label">{t.label || 'Untitled'}</span>
                <span className="qt-parts">
                  <span className="part">
                    <small>{base.kind}</small> {base.label} <b className="num">{v ?? '—'}</b>
                  </span>
                  {t.modifier !== null && (
                    <span className="part situational">
                      <small>Situational</small> {t.modifierNote || 'modifier'}{' '}
                      <b className="num">{fmtSigned(t.modifier)}</b>
                    </span>
                  )}
                </span>
                <span className="qt-target">
                  <small>Target</small>
                  <b className="num">{withMod ?? '—'}</b>
                  {withDiff !== null && (
                    <small>
                      {props.diffLabel}: {withDiff}
                    </small>
                  )}
                </span>
              </button>
              {t.notes && !open && <div className="hint">{t.notes}</div>}
              {open && (
                <div className="stack qt-edit">
                  <div className="fields">
                    <TextField
                      label="Name"
                      value={t.label}
                      onChange={(v) => set(t.id, { label: v })}
                    />
                    <Select
                      label="Based on"
                      value={sourceValue(t)}
                      onChange={(v) =>
                        set(t.id, {
                          source: v.startsWith('c:')
                            ? {
                                kind: 'characteristic',
                                key: v.slice(2) as (typeof CHAR_KEYS)[number],
                              }
                            : { kind: 'skill', skillId: v.slice(2) },
                        })
                      }
                      options={[
                        ...CHAR_KEYS.map((k) => ({
                          value: `c:${k}`,
                          label: `Characteristic: ${CHAR_NAMES[k]}`,
                        })),
                        ...c.skills.map((s) => ({
                          value: `s:${s.id}`,
                          label: `Skill: ${skillLabel(s)}`,
                        })),
                      ]}
                    />
                    <NumberField
                      label="Situational modifier (optional)"
                      value={t.modifier}
                      onChange={(v) => set(t.id, { modifier: v })}
                    />
                    <TextField
                      label="Modifier reason"
                      value={t.modifierNote}
                      onChange={(v) => set(t.id, { modifierNote: v })}
                    />
                    <TextField
                      label="Notes"
                      multiline
                      value={t.notes}
                      onChange={(v) => set(t.id, { notes: v })}
                      className="full"
                    />
                  </div>
                  <div className="row">
                    <button
                      className="btn small"
                      disabled={idx === 0}
                      onClick={() =>
                        update((x) => {
                          const a = x.quickTests
                          ;[a[idx - 1], a[idx]] = [a[idx]!, a[idx - 1]!]
                        })
                      }
                    >
                      ↑ Move up
                    </button>
                    <button className="btn small" onClick={() => setEditing(null)}>
                      Done
                    </button>
                    <span className="spacer" />
                    <ConfirmButton
                      label="Delete"
                      onConfirm={() =>
                        update((x) => {
                          x.quickTests = x.quickTests.filter((k) => k.id !== t.id)
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
