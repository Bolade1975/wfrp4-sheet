import { useState } from 'react'
import { newId } from '../../domain/factory'
import type { CharKey } from '../../domain/schema'
import { CONDITIONS } from '../../rules/catalog'
import {
  CHAR_LABELS,
  CHAR_NAMES,
  bonus,
  canTest,
  characteristic,
  maxWounds,
  skillLabel,
  skillValue,
  walk,
  run,
} from '../../rules/engine'
import { useChar } from '../../state/store'
import { ConfirmButton, Counter, Empty, OvrBadge, Panel, Readout } from '../../ui/components'
import { ApMap, WeaponList } from '../../ui/combat'
import { Check, TextField } from '../../ui/fields'
import type { TabKey } from '../tabKeys'

const KEY_CHARS: CharKey[] = ['ws', 'bs', 's', 't', 'i', 'ag']

/**
 * Compact play view. Everything shown here is the same data as the main sheet
 * (no copies): counters edit the character directly.
 */
export function CombatTab(props: { goTo: (t: TabKey) => void }) {
  const { c, update } = useChar()
  const max = maxWounds(c)
  const combatSkills = c.skills.filter(
    (s) => s.name === 'Melee' || s.name === 'Ranged' || s.name === 'Dodge' || s.name === 'Cool',
  )
  const weapons = c.weapons.filter((w) => w.current)

  return (
    <div className="stack">
      <section className="combat-strip">
        <Counter
          label="Wounds"
          value={c.wounds.current}
          max={max.value}
          onChange={(v) => update((x) => void (x.wounds.current = v))}
          className={c.wounds.current !== null && c.wounds.current <= 0 ? 'danger' : ''}
          hint={
            max.overridden
              ? 'Max is a manual value'
              : max.value === null
                ? 'Max needs input'
                : undefined
          }
        />
        <Counter
          label="Advantage"
          value={c.advantage}
          onChange={(v) => update((x) => void (x.advantage = v ?? 0))}
          hint={
            c.advantage > 0
              ? `+${c.advantage * 10} to appropriate combat Tests (p. 164)`
              : '+10 per Advantage (p. 164)'
          }
        />
        <Counter
          label="Fortune"
          value={c.fortune}
          max={c.fate}
          onChange={(v) => update((x) => void (x.fortune = v))}
          hint="of Fate"
        />
        <Counter
          label="Resolve"
          value={c.resolve}
          max={c.resilience}
          onChange={(v) => update((x) => void (x.resolve = v))}
          hint="of Resilience"
        />
      </section>

      <div className="grid two">
        <Panel title="Characteristics">
          <div className="mini-chars">
            {KEY_CHARS.map((k) => {
              const d = characteristic(c, k)
              return (
                <div key={k} className="mini-char" title={CHAR_NAMES[k]}>
                  <span className="lbl">{CHAR_LABELS[k]}</span>
                  <b className="num">{d.value ?? '—'}</b>
                  <small>B {bonus(c, k) ?? '—'}</small>
                  {d.overridden && <OvrBadge />}
                </div>
              )
            })}
          </div>
          <div className="readouts three" style={{ marginTop: 10 }}>
            <Readout d={max} label="Max Wounds" />
            <Readout d={walk(c)} />
            <Readout d={run(c)} />
          </div>
        </Panel>

        <Panel title="Combat skills">
          {combatSkills.length === 0 ? (
            <Empty>No Melee, Ranged, Dodge or Cool skills on the Skills tab.</Empty>
          ) : (
            <div className="test-list compact">
              {combatSkills.map((s) => {
                const d = skillValue(c, s)
                return (
                  <div key={s.id} className={`test-line ${canTest(s) ? '' : 'muted'}`}>
                    <span className="name">
                      {skillLabel(s)}
                      <span className="kind">
                        {CHAR_LABELS[s.characteristic]} + {s.advances}
                      </span>
                    </span>
                    <span className="vals">
                      <b className="num">{d.value ?? (canTest(s) ? '—' : '✕')}</b>
                      {d.overridden && <OvrBadge />}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="Weapons (current)"
        hint="Weapons marked Current in Inventory. Test = linked skill's value; damage resolves +SB from Strength Bonus (p. 293–294)."
        actions={
          <button className="btn small" onClick={() => props.goTo('inventory')}>
            Edit in Inventory
          </button>
        }
      >
        <WeaponList weapons={weapons} empty="No weapons marked Current." />
      </Panel>

      <div className="grid two">
        <Panel
          title="Armour Points"
          hint="Totals per Hit Location are entered by you (no general stacking rule in the book, p. 299–300). Worn pieces are listed for reference."
        >
          <ApMap editable />
        </Panel>
        <div className="stack">
          <ConditionsPanel />
          <CriticalsPanel />
        </div>
      </div>
    </div>
  )
}

function ConditionsPanel() {
  const { c, update } = useChar()
  const [custom, setCustom] = useState('')
  const add = (name: string) =>
    update((x) => {
      const ex = x.conditions.find((k) => k.name.toLowerCase() === name.toLowerCase())
      if (ex) ex.count += 1
      else x.conditions.push({ id: newId(), name, count: 1, notes: '' })
    })
  return (
    <Panel title="Conditions" hint="Names from p. 167–169. Effects are not applied automatically.">
      {c.conditions.length === 0 && <Empty>No Conditions.</Empty>}
      <div className="conditions">
        {c.conditions.map((k) => (
          <div key={k.id} className="condition">
            <b>{k.name}</b>
            <div className="counter-row small">
              <button
                className="btn round"
                aria-label={`Remove one ${k.name}`}
                onClick={() =>
                  update((x) => {
                    const t = x.conditions.find((z) => z.id === k.id)
                    if (!t) return
                    t.count -= 1
                    if (t.count <= 0) x.conditions = x.conditions.filter((z) => z.id !== k.id)
                  })
                }
              >
                −
              </button>
              <span className="num">{k.count}</span>
              <button
                className="btn round"
                aria-label={`Add one ${k.name}`}
                onClick={() =>
                  update((x) => {
                    const t = x.conditions.find((z) => z.id === k.id)
                    if (t) t.count += 1
                  })
                }
              >
                +
              </button>
            </div>
            <TextField
              label="Note"
              value={k.notes}
              onChange={(v) =>
                update((x) => {
                  const t = x.conditions.find((z) => z.id === k.id)
                  if (t) t.notes = v
                })
              }
              className="cond-note"
            />
          </div>
        ))}
      </div>
      <div className="chip-row" aria-label="Add a Condition">
        {CONDITIONS.map((n) => (
          <button key={n} className="chip" onClick={() => add(n)}>
            + {n}
          </button>
        ))}
      </div>
      <div className="row">
        <input
          className="input"
          placeholder="Other condition…"
          aria-label="Other condition"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
        <button
          className="btn small"
          disabled={!custom.trim()}
          onClick={() => {
            add(custom.trim())
            setCustom('')
          }}
        >
          Add
        </button>
      </div>
    </Panel>
  )
}

function CriticalsPanel() {
  const { c, update } = useChar()
  const set = (id: string, patch: Partial<(typeof c.criticalWounds)[number]>) =>
    update((x) => {
      const t = x.criticalWounds.find((k) => k.id === id)
      if (t) Object.assign(t, patch)
    })
  const active = c.criticalWounds.filter((k) => !k.healed).length
  return (
    <Panel
      title={`Critical Wounds${active ? ` (${active} active)` : ''}`}
      hint="Record results from the Critical tables (p. 172–174) yourself."
      actions={
        <button
          className="btn small"
          onClick={() =>
            update(
              (x) =>
                void x.criticalWounds.push({
                  id: newId(),
                  location: '',
                  name: '',
                  effect: '',
                  duration: '',
                  healed: false,
                }),
            )
          }
        >
          + Add
        </button>
      }
    >
      {c.criticalWounds.length === 0 && <Empty>No Critical Wounds.</Empty>}
      <div className="stack">
        {c.criticalWounds.map((k) => (
          <div key={k.id} className={`crit ${k.healed ? 'healed' : ''}`}>
            <div className="fields">
              <TextField
                label="Location"
                value={k.location}
                onChange={(v) => set(k.id, { location: v })}
              />
              <TextField label="Critical" value={k.name} onChange={(v) => set(k.id, { name: v })} />
              <TextField
                label="Duration / healing"
                value={k.duration}
                onChange={(v) => set(k.id, { duration: v })}
              />
              <TextField
                label="Effect"
                multiline
                value={k.effect}
                onChange={(v) => set(k.id, { effect: v })}
                className="full"
              />
            </div>
            <div className="row">
              <Check label="Healed" checked={k.healed} onChange={(v) => set(k.id, { healed: v })} />
              <span className="spacer" />
              <ConfirmButton
                label="Delete"
                onConfirm={() =>
                  update((x) => {
                    x.criticalWounds = x.criticalWounds.filter((z) => z.id !== k.id)
                  })
                }
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
