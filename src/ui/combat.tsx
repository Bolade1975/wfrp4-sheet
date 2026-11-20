import { useState } from 'react'
import type { Location, Weapon } from '../domain/schema'
import { HIT_LOCATIONS } from '../rules/catalog'
import { canTest, skillLabel, weaponDamage, weaponSkill, weaponTest } from '../rules/engine'
import { useChar } from '../state/store'
import { Breakdown, Empty, OvrBadge, Sheet } from './components'
import { NumberField } from './fields'

/** One weapon with its verified test value (linked skill) and resolved damage. */
export function WeaponLine(props: { w: Weapon; showLocation?: boolean | undefined }) {
  const { c } = useChar()
  const { w } = props
  const [open, setOpen] = useState(false)
  const skill = weaponSkill(c, w)
  const test = weaponTest(c, w)
  const dmg = weaponDamage(c, w)
  return (
    <div className="weapon">
      <div className="weapon-head">
        <b className="weapon-name">{w.name || 'Unnamed weapon'}</b>
        <span className="hint">
          {[
            w.kind === 'melee' ? 'Melee' : 'Ranged',
            w.group,
            w.rangeReach && `${w.kind === 'melee' ? 'Reach' : 'Range'} ${w.rangeReach}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </div>
      <div className="weapon-stats">
        <button
          type="button"
          className={`stat-box ${test?.overridden ? 'overridden' : ''}`}
          disabled={!test}
          onClick={() => setOpen(true)}
        >
          <span className="lbl">Test {skill ? <small>{skillLabel(skill)}</small> : null}</span>
          {test ? (
            <b className="num">{test.value ?? (skill && !canTest(skill) ? '✕' : '—')}</b>
          ) : (
            <span className="missing">link a skill</span>
          )}
          {test?.overridden && <OvrBadge />}
        </button>
        <div className="stat-box">
          <span className="lbl">
            Damage <small>{dmg.basis && dmg.value !== null ? dmg.basis : 'as entered'}</small>
          </span>
          {dmg.value !== null ? (
            <b className="num">
              {dmg.value} <small>+ SL</small>
            </b>
          ) : (
            <b>{w.damage || '—'}</b>
          )}
          {dmg.missing.length > 0 && (
            <span className="missing">needs {dmg.missing.join(', ')}</span>
          )}
        </div>
        {w.qualities && (
          <div className="stat-box wide">
            <span className="lbl">Qualities &amp; Flaws</span>
            <span>{w.qualities}</span>
          </div>
        )}
        {(w.ammo || (props.showLocation && w.location)) && (
          <div className="stat-box wide">
            <span className="lbl">{w.ammo ? 'Ammunition' : 'Carried'}</span>
            <span>
              {[w.ammo, props.showLocation ? w.location : ''].filter(Boolean).join(' · ')}
            </span>
          </div>
        )}
      </div>
      {w.notes && <div className="hint">{w.notes}</div>}
      {open && test && (
        <Sheet title={`${w.name} — attack Test`} onClose={() => setOpen(false)}>
          <Breakdown d={test} />
          <p className="hint">
            This is the linked skill's value; a manual value here changes that skill everywhere.
          </p>
        </Sheet>
      )}
    </div>
  )
}

export function WeaponList(props: {
  weapons: Weapon[]
  empty: string
  showLocation?: boolean | undefined
}) {
  if (props.weapons.length === 0) return <Empty>{props.empty}</Empty>
  return (
    <div className="weapons">
      {props.weapons.map((w) => (
        <WeaponLine key={w.id} w={w} showLocation={props.showLocation} />
      ))}
    </div>
  )
}

/**
 * Armour Points by Hit Location (p. 159). Totals are manual because the
 * rulebook gives no general stacking formula (p. 299–300); worn pieces that
 * cover each location are listed with an explicit "Use sum" button.
 */
export function ApMap(props: { editable?: boolean }) {
  const { c, update } = useChar()
  const worn = c.armour.filter((a) => a.worn)
  const pieces = (l: Location) => worn.filter((a) => a.locations.includes(l))
  const sum = (l: Location) => pieces(l).reduce((t, a) => t + (a.ap ?? 0), 0)
  return (
    <div className="ap-map">
      {HIT_LOCATIONS.map((h) => {
        const l = h.key as Location
        const ps = pieces(l)
        const total = c.apTotals[l]
        const s = sum(l)
        return (
          <div key={l} className={`ap-loc loc-${l}`}>
            <div className="ap-head">
              <span className="ap-roll">{h.roll}</span>
              <b>{h.label}</b>
              {'sub' in h && <small>{h.sub}</small>}
            </div>
            {props.editable ? (
              <NumberField
                label={`AP ${h.label}`}
                hideLabel
                value={total}
                onChange={(v) => update((x) => void (x.apTotals[l] = v))}
                className="ap-input"
              />
            ) : (
              <b className="ap-val num">{total ?? '—'}</b>
            )}
            <div className="ap-pieces">
              {ps.length === 0 ? (
                <span className="hint">No worn armour</span>
              ) : (
                ps.map((a) => (
                  <span key={a.id}>
                    {a.name} {a.ap ?? '?'}
                  </span>
                ))
              )}
            </div>
            {props.editable && ps.length > 0 && total !== s && (
              <button
                type="button"
                className="btn small"
                onClick={() => update((x) => void (x.apTotals[l] = s))}
              >
                Use sum ({s})
              </button>
            )}
          </div>
        )
      })}
      <div className="ap-loc loc-shield">
        <div className="ap-head">
          <b>Shield</b>
        </div>
        {props.editable ? (
          <NumberField
            label="Shield"
            hideLabel
            value={c.shield}
            onChange={(v) => update((x) => void (x.shield = v))}
            className="ap-input"
          />
        ) : (
          <b className="ap-val num">{c.shield ?? '—'}</b>
        )}
      </div>
    </div>
  )
}
