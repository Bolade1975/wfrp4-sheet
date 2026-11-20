import type { Spell } from '../../domain/schema'
import { SPELL_KIND } from '../../ui/labels'
import { useChar } from '../../state/store'
import { Panel } from '../../ui/components'
import { NumberField } from '../../ui/fields'
import { ItemList } from '../../ui/ItemList'

export function MagicTab() {
  const { c, update } = useChar()
  return (
    <div className="stack">
      <Panel
        title="Spells and Prayers"
        hint="Columns follow the official sheet: Name, TN, Range, Target, Duration, Effect."
      >
        <ItemList<Spell>
          items={c.spells}
          onChange={(v) => update((x) => void (x.spells = v))}
          addLabel="Add spell or prayer"
          emptyText="No spells or prayers. Leave this empty if the character has none."
          title={(s) => (
            <>
              {s.name || 'Unnamed'} <span className="badge">{SPELL_KIND[s.kind]}</span>
            </>
          )}
          columns={[
            { label: 'TN', get: (s) => s.tn || '—' },
            { label: 'Range', get: (s) => s.range || '—' },
          ]}
          make={() => ({
            kind: 'spell',
            name: '',
            lore: '',
            tn: '',
            range: '',
            target: '',
            duration: '',
            effect: '',
            notes: '',
          })}
          fields={[
            { key: 'name', label: 'Name', type: 'text' },
            {
              key: 'kind',
              label: 'Kind',
              type: 'select',
              options: Object.entries(SPELL_KIND).map(([value, label]) => ({ value, label })),
            },
            { key: 'lore', label: 'Lore / God', type: 'text' },
            { key: 'tn', label: 'TN', type: 'text' },
            { key: 'range', label: 'Range', type: 'text' },
            { key: 'target', label: 'Target', type: 'text' },
            { key: 'duration', label: 'Duration', type: 'text' },
            { key: 'effect', label: 'Effect', type: 'textarea' },
            { key: 'notes', label: 'Notes', type: 'textarea' },
          ]}
        />
      </Panel>
      <Panel title="Sin">
        <div className="fields">
          <NumberField
            label="Sin points"
            value={c.sin}
            onChange={(v) => update((x) => void (x.sin = v))}
          />
        </div>
      </Panel>
    </div>
  )
}
