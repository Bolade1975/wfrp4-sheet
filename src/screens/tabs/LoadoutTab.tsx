import { encumbrance } from '../../rules/engine'
import { useChar } from '../../state/store'
import { Empty, Panel } from '../../ui/components'
import { ApMap, WeaponList } from '../../ui/combat'
import { locationsText } from '../../ui/labels'
import { CurrentToggle } from '../../ui/ItemList'
import { fmtNum } from '../../ui/format'
import type { TabKey } from '../tabKeys'
import { EncumbrancePanel } from './InventoryTab'

/** Only items marked Current. Untick here to take an item out of the loadout. */
export function LoadoutTab(props: { goTo: (t: TabKey) => void }) {
  const { c, update } = useChar()
  const weapons = c.weapons.filter((w) => w.current)
  const armour = c.armour.filter((a) => a.current)
  const trappings = c.trappings.filter((t) => t.current)
  const notCurrent =
    c.weapons.length +
    c.armour.length +
    c.trappings.length -
    (weapons.length + armour.length + trappings.length)
  const wornNotCurrent = c.armour.filter((a) => a.worn && !a.current)

  const toggle = (kind: 'weapons' | 'armour' | 'trappings', id: string) =>
    update((x) => {
      const it = (x[kind] as { id: string; current: boolean }[]).find((k) => k.id === id)
      if (it) it.current = !it.current
    })

  return (
    <div className="stack">
      <div className="row lead">
        <p className="hint" style={{ flex: 1 }}>
          What the character has with them right now.{' '}
          {notCurrent > 0 && `${notCurrent} owned item(s) are not current and are hidden here. `}
          Add or edit items in Inventory.
        </p>
        <button className="btn" onClick={() => props.goTo('inventory')}>
          Open Inventory
        </button>
      </div>
      {wornNotCurrent.length > 0 && (
        <div className="banner warn">
          Marked Worn but not Current: {wornNotCurrent.map((a) => a.name || 'Unnamed').join(', ')}.
        </div>
      )}

      <Panel title="Weapons">
        <WeaponList weapons={weapons} empty="No weapons marked Current." showLocation />
        {weapons.length > 0 && (
          <div className="chip-row">
            {weapons.map((w) => (
              <span key={w.id} className="loadout-toggle">
                {w.name || 'Unnamed'}
                <CurrentToggle checked onChange={() => toggle('weapons', w.id)} />
              </span>
            ))}
          </div>
        )}
      </Panel>

      <div className="grid two">
        <Panel title="Armour">
          {armour.length === 0 ? (
            <Empty>No armour marked Current.</Empty>
          ) : (
            <table className="list-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Locations</th>
                  <th className="n">AP</th>
                  <th className="n">Enc</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {armour.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <b>{a.name || 'Unnamed'}</b>{' '}
                      {a.worn ? (
                        <span className="badge worn">Worn</span>
                      ) : (
                        <span className="badge">Carried</span>
                      )}
                      {(a.qualities || a.penalty || a.notes) && (
                        <div className="hint">
                          {[a.qualities, a.penalty && `Penalty: ${a.penalty}`, a.notes]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      )}
                    </td>
                    <td>{locationsText(a.locations) || '—'}</td>
                    <td className="n num">{fmtNum(a.ap)}</td>
                    <td className="n num">{fmtNum(a.enc)}</td>
                    <td>
                      <CurrentToggle checked onChange={() => toggle('armour', a.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
        <Panel title="Armour Points" hint="Totals you entered (Combat tab).">
          <ApMap />
        </Panel>
      </div>

      <Panel title="Equipment, tools & other items">
        {trappings.length === 0 ? (
          <Empty>No trappings marked Current.</Empty>
        ) : (
          <table className="list-table">
            <thead>
              <tr>
                <th>Item</th>
                <th className="n">Qty</th>
                <th>Where / slot</th>
                <th className="n">Enc</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {trappings.map((t) => (
                <tr key={t.id}>
                  <td>
                    <b>{t.name || 'Unnamed'}</b>
                    {t.notes && <div className="hint">{t.notes}</div>}
                  </td>
                  <td className="n num">{fmtNum(t.quantity)}</td>
                  <td>{t.location || '—'}</td>
                  <td className="n num">{fmtNum(t.enc)}</td>
                  <td>
                    <CurrentToggle checked onChange={() => toggle('trappings', t.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <EncumbrancePanel enc={encumbrance(c)} />
    </div>
  )
}
