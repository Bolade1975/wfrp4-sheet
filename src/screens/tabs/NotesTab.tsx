import type { Character } from '../../domain/schema'
import { useChar } from '../../state/store'
import { Panel } from '../../ui/components'
import { ItemList } from '../../ui/ItemList'
import { NOTE_CATEGORY } from '../../ui/labels'

type Note = Character['notes'][number]

export function NotesTab() {
  const { c, update } = useChar()
  return (
    <div className="stack">
      <div className="banner info">
        <b>Private:</b> this tab is never included in a PDF export.
      </div>
      <Panel title="Notes & history">
        <ItemList<Note>
          items={c.notes}
          onChange={(v) => update((x) => void (x.notes = v))}
          addLabel="Add note"
          emptyText="No notes yet — goals, relationships, rumours, session logs…"
          title={(n) => (
            <>
              <span className="badge">{NOTE_CATEGORY[n.category]}</span> {n.title || 'Untitled'}
              {n.body && <span className="note-preview">{n.body}</span>}
            </>
          )}
          make={() => ({ category: 'note', title: '', body: '', date: '' })}
          fields={[
            { key: 'title', label: 'Title', type: 'text' },
            {
              key: 'category',
              label: 'Kind',
              type: 'select',
              options: Object.entries(NOTE_CATEGORY).map(([value, label]) => ({ value, label })),
            },
            { key: 'date', label: 'Date / session', type: 'text' },
            { key: 'body', label: 'Text', type: 'textarea' },
          ]}
        />
      </Panel>
    </div>
  )
}
