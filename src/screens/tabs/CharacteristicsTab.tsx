import { CHAR_KEYS } from '../../domain/schema'
import {
  bonus,
  CHAR_LABELS,
  CHAR_NAMES,
  characteristic,
  maxWounds,
  run,
  walk,
} from '../../rules/engine'
import { xpSummary } from '../../rules/xp'
import { useChar } from '../../state/store'
import { OvrBadge, Panel, Readout, Sheet, Breakdown } from '../../ui/components'
import { NumberField, TextField } from '../../ui/fields'
import { useState } from 'react'

export function CharacteristicsTab() {
  const { c, update } = useChar()
  const [open, setOpen] = useState<(typeof CHAR_KEYS)[number] | null>(null)
  const xp = xpSummary(c)
  return (
    <div className="stack">
      <Panel
        title="Characteristics"
        hint="Enter Initial and Advances; Current is Initial + Advances (p. 35, 47) and the bonus is its tens digit (p. 34). Tap a Current value for its breakdown or a manual value. ★ marks Characteristics in your current career's advance scheme."
      >
        <div className="char-grid" role="table" aria-label="Characteristics">
          <div className="char-row head" role="row">
            <span role="columnheader" />
            {CHAR_KEYS.map((k) => (
              <span key={k} role="columnheader" title={CHAR_NAMES[k]}>
                <button
                  type="button"
                  className={`char-key ${c.characteristics[k].inCareer ? 'career' : ''}`}
                  aria-pressed={c.characteristics[k].inCareer}
                  aria-label={`${CHAR_NAMES[k]} in career`}
                  onClick={() =>
                    update((x) => {
                      x.characteristics[k].inCareer = !x.characteristics[k].inCareer
                    })
                  }
                >
                  {CHAR_LABELS[k]}
                  {c.characteristics[k].inCareer ? ' ★' : ''}
                </button>
              </span>
            ))}
          </div>
          <div className="char-row" role="row">
            <span className="row-lbl" role="rowheader">
              Initial
            </span>
            {CHAR_KEYS.map((k) => (
              <NumberField
                key={k}
                hideLabel
                label={`Initial ${CHAR_NAMES[k]}`}
                value={c.characteristics[k].initial}
                onChange={(v) => update((x) => void (x.characteristics[k].initial = v))}
              />
            ))}
          </div>
          <div className="char-row" role="row">
            <span className="row-lbl" role="rowheader">
              Advances
            </span>
            {CHAR_KEYS.map((k) => (
              <NumberField
                key={k}
                hideLabel
                label={`${CHAR_NAMES[k]} advances`}
                value={c.characteristics[k].advances}
                allowNull={false}
                onChange={(v) => update((x) => void (x.characteristics[k].advances = v ?? 0))}
              />
            ))}
          </div>
          <div className="char-row current" role="row">
            <span className="row-lbl" role="rowheader">
              Current
            </span>
            {CHAR_KEYS.map((k) => {
              const d = characteristic(c, k)
              return (
                <button
                  key={k}
                  type="button"
                  className={`char-cur ${d.overridden ? 'overridden' : ''}`}
                  onClick={() => setOpen(k)}
                  aria-label={`Current ${CHAR_NAMES[k]} ${d.value ?? 'not entered'}`}
                >
                  <b className="num">{d.value ?? '—'}</b>
                  {d.overridden && <OvrBadge />}
                </button>
              )
            })}
          </div>
          <div className="char-row bonus" role="row">
            <span className="row-lbl" role="rowheader">
              Bonus
            </span>
            {CHAR_KEYS.map((k) => (
              <span key={k} className="num">
                {bonus(c, k) ?? '—'}
              </span>
            ))}
          </div>
        </div>
      </Panel>

      <div className="grid three">
        <Panel title="Fate">
          <div className="fields two-col">
            <NumberField
              label="Fate"
              value={c.fate}
              onChange={(v) => update((x) => void (x.fate = v))}
            />
            <NumberField
              label="Fortune"
              value={c.fortune}
              onChange={(v) => update((x) => void (x.fortune = v))}
            />
          </div>
        </Panel>
        <Panel title="Resilience">
          <div className="fields two-col">
            <NumberField
              label="Resilience"
              value={c.resilience}
              onChange={(v) => update((x) => void (x.resilience = v))}
            />
            <NumberField
              label="Resolve"
              value={c.resolve}
              onChange={(v) => update((x) => void (x.resolve = v))}
            />
            <TextField
              label="Motivation"
              value={c.identity.motivation}
              onChange={(v) => update((x) => void (x.identity.motivation = v))}
              className="wide"
            />
          </div>
        </Panel>
        <Panel title="Experience" hint="From the Experience log (amounts you entered).">
          <div className="readouts three">
            <div className="stat">
              <span className="lbl">Current</span>
              <b className={`num ${xp.negativeCurrent ? 'bad' : ''}`}>{xp.current}</b>
            </div>
            <div className="stat">
              <span className="lbl">Spent</span>
              <b className="num">{xp.spent}</b>
            </div>
            <div className="stat">
              <span className="lbl">Total</span>
              <b className="num">{xp.total}</b>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid two">
        <Panel title="Movement">
          <div className="readouts three">
            <NumberField
              label="Movement"
              value={c.movement}
              onChange={(v) => update((x) => void (x.movement = v))}
            />
            <Readout d={walk(c)} />
            <Readout d={run(c)} />
          </div>
        </Panel>
        <WoundsPanel />
      </div>

      {open && (
        <Sheet title={CHAR_NAMES[open]} onClose={() => setOpen(null)}>
          <Breakdown d={characteristic(c, open)} />
        </Sheet>
      )}
    </div>
  )
}

function WoundsPanel() {
  const { c } = useChar()
  const w = maxWounds(c)
  const sp = c.identity.species
  const row = (label: string, v: number | null | string) => (
    <div className="kv">
      <span>{label}</span>
      <b className="num">{v ?? '—'}</b>
    </div>
  )
  const part = (l: string) => w.parts.find((p) => p.label === l)?.value ?? null
  return (
    <Panel title="Wounds" hint="Current Wounds are tracked on the Combat tab.">
      <div className="wounds-box">
        <div className="kv-list">
          {sp !== 'halfling' && row('SB', part('SB'))}
          {row('TB × 2', part('TB × 2'))}
          {row('WPB', part('WPB'))}
          {row(
            'Hardy',
            part('Hardy (TB)') ??
              (c.talents.some((t) => /^hardy$/i.test(t.name.trim())) ? '?' : '—'),
          )}
        </div>
        <Readout d={w} label="Wounds" big />
      </div>
    </Panel>
  )
}
