import type { Character } from '../../domain/schema'
import { corruptionLimits } from '../../rules/engine'
import { useChar } from '../../state/store'
import { Panel } from '../../ui/components'
import { NumberField } from '../../ui/fields'
import { ItemList } from '../../ui/ItemList'

type Talent = Character['talents'][number]
type Trait = Character['traits'][number]
type Psych = Character['psychology'][number]
type Mutation = Character['mutations'][number]

export function TalentsTab() {
  const { c, update } = useChar()
  const lim = corruptionLimits(c)
  return (
    <div className="stack">
      <Panel
        title="Talents"
        hint="Write your own short summary of each Talent. “Hardy” (exact name) is used in the Wounds calculation."
      >
        <ItemList<Talent>
          items={c.talents}
          onChange={(v) => update((x) => void (x.talents = v))}
          addLabel="Add talent"
          emptyText="No talents yet."
          title={(t) => t.name || 'Unnamed talent'}
          columns={[
            { label: 'Times taken', get: (t) => t.timesTaken },
            { label: 'Max', get: (t) => t.max || '—' },
          ]}
          make={() => ({ name: '', timesTaken: 1, max: '', tests: '', description: '', notes: '' })}
          fields={[
            { key: 'name', label: 'Talent Name', type: 'text' },
            { key: 'timesTaken', label: 'Times taken', type: 'int' },
            { key: 'max', label: 'Max', type: 'text' },
            { key: 'tests', label: 'Tests', type: 'text' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'notes', label: 'Notes', type: 'textarea' },
          ]}
        />
      </Panel>

      <div className="grid two">
        <Panel title="Traits" hint="Creature or species traits, if any.">
          <ItemList<Trait>
            items={c.traits}
            onChange={(v) => update((x) => void (x.traits = v))}
            addLabel="Add trait"
            emptyText="No traits."
            title={(t) => t.name || 'Unnamed trait'}
            make={() => ({ name: '', description: '', notes: '' })}
            fields={[
              { key: 'name', label: 'Trait', type: 'text' },
              { key: 'description', label: 'Description', type: 'textarea' },
              { key: 'notes', label: 'Notes', type: 'textarea' },
            ]}
          />
        </Panel>
        <Panel title="Psychology">
          <ItemList<Psych>
            items={c.psychology}
            onChange={(v) => update((x) => void (x.psychology = v))}
            addLabel="Add psychology"
            emptyText="No psychology entries."
            title={(t) => t.name || 'Unnamed'}
            make={() => ({ name: '', description: '' })}
            fields={[
              { key: 'name', label: 'Name (e.g. Animosity, Fear)', type: 'text' },
              { key: 'description', label: 'Details', type: 'textarea' },
            ]}
          />
        </Panel>
      </div>

      <Panel title="Corruption & Mutations">
        <div className="fields">
          <NumberField
            label="Corruption points"
            value={c.corruption}
            onChange={(v) => update((x) => void (x.corruption = v))}
          />
        </div>
        <div
          className={`banner ${(lim.tb !== null && lim.physical > lim.tb) || (lim.wpb !== null && lim.mental > lim.wpb) ? 'warn' : 'ok'}`}
        >
          Physical mutations {lim.physical} (limit: more than TB {lim.tb ?? '—'}) · Mental
          corruptions {lim.mental} (limit: more than WPB {lim.wpb ?? '—'}) — Core Rulebook p. 183.
        </div>
        <ItemList<Mutation>
          items={c.mutations}
          onChange={(v) => update((x) => void (x.mutations = v))}
          addLabel="Add mutation"
          emptyText="No mutations."
          title={(m) => (
            <>
              {m.name || 'Unnamed'}{' '}
              <span className="badge">{m.kind === 'physical' ? 'Physical' : 'Mental'}</span>
            </>
          )}
          make={() => ({ kind: 'physical', name: '', effect: '' })}
          fields={[
            { key: 'name', label: 'Mutation', type: 'text' },
            {
              key: 'kind',
              label: 'Kind',
              type: 'select',
              options: [
                { value: 'physical', label: 'Physical' },
                { value: 'mental', label: 'Mental' },
              ],
            },
            { key: 'effect', label: 'Effect', type: 'textarea' },
          ]}
        />
      </Panel>
    </div>
  )
}
