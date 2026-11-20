import { useId, useState, type ReactNode } from 'react'

/** Text input that commits on every keystroke (autosave is debounced upstream). */
export function TextField(props: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  multiline?: boolean
}) {
  const id = useId()
  return (
    <label className={`field ${props.className ?? ''}`} htmlFor={id}>
      <span>{props.label}</span>
      {props.multiline ? (
        <textarea
          id={id}
          className="textarea"
          value={props.value}
          placeholder={props.placeholder}
          onChange={(e) => props.onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          className="input"
          value={props.value}
          placeholder={props.placeholder}
          onChange={(e) => props.onChange(e.target.value)}
        />
      )}
    </label>
  )
}

function parseNum(s: string, integer: boolean): number | null | 'invalid' {
  const t = s.trim().replace(',', '.').replace('−', '-')
  if (t === '') return null
  const n = Number(t)
  if (!Number.isFinite(n)) return 'invalid'
  return integer ? Math.trunc(n) : n
}

/**
 * Numeric input where empty means "not entered" (null), never 0. Keeps the
 * raw text while typing so "-" or "0." can be typed on a tablet keyboard.
 */
export function NumberField(props: {
  label: string
  value: number | null
  onChange: (v: number | null) => void
  integer?: boolean
  className?: string
  hideLabel?: boolean
  allowNull?: boolean
}) {
  const id = useId()
  const integer = props.integer ?? true
  const external = props.value === null ? '' : String(props.value)
  const [text, setText] = useState(external)
  const [focused, setFocused] = useState(false)
  const commit = (s: string) => {
    const v = parseNum(s, integer)
    if (v === 'invalid') return
    if (v === null && props.allowNull === false) return
    props.onChange(v)
  }
  return (
    <label className={`field ${props.className ?? ''}`} htmlFor={id}>
      {!props.hideLabel && <span>{props.label}</span>}
      <input
        id={id}
        aria-label={props.label}
        className={`input numeric ${props.value === null ? 'missing' : ''}`}
        inputMode={integer ? 'numeric' : 'decimal'}
        value={focused ? text : external}
        placeholder="–"
        onFocus={() => {
          setText(external)
          setFocused(true)
        }}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          setText(e.target.value)
          commit(e.target.value)
        }}
      />
    </label>
  )
}

export function Check(props: {
  label: ReactNode
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="check">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      <span>{props.label}</span>
    </label>
  )
}

export function Select<T extends string>(props: {
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (v: T) => void
  className?: string
}) {
  const id = useId()
  return (
    <label className={`field ${props.className ?? ''}`} htmlFor={id}>
      <span>{props.label}</span>
      <select
        id={id}
        className="select"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value as T)}
      >
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function Segmented<T extends string>(props: {
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="seg" role="group" aria-label={props.label}>
      {props.options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={props.value === o.value}
          onClick={() => props.onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Comma-separated list editor (e.g. specializations). */
export function ListField(props: {
  label: string
  value: string[]
  onChange: (v: string[]) => void
  className?: string
}) {
  const [text, setText] = useState(props.value.join(', '))
  const id = useId()
  return (
    <label className={`field ${props.className ?? ''}`} htmlFor={id}>
      <span>{props.label} (comma separated)</span>
      <input
        id={id}
        className="input"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          props.onChange(
            e.target.value
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }}
      />
    </label>
  )
}
