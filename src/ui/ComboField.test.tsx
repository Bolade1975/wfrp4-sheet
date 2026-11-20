import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { ComboField } from './ComboField'

function Harness() {
  const [v, setV] = useState('')
  return (
    <>
      <ComboField
        label="Career"
        value={v}
        groups={[{ label: 'Warriors', options: [{ value: 'Soldier', label: 'Soldier' }] }]}
        onPick={setV}
        onType={setV}
      />
      <output data-testid="value">{v}</output>
    </>
  )
}

describe('ComboField', () => {
  it('picks from the list, or switches to typing manually', () => {
    render(<Harness />)
    const select = screen.getByRole('combobox', { name: 'Career' })
    fireEvent.change(select, { target: { value: 'Soldier' } })
    expect(screen.getByTestId('value').textContent).toBe('Soldier')
    fireEvent.change(select, { target: { value: '__other__' } })
    const input = screen.getByRole('textbox', { name: 'Career (typed)' })
    fireEvent.change(input, { target: { value: 'Ratskin Guide' } })
    expect(screen.getByTestId('value').textContent).toBe('Ratskin Guide')
    fireEvent.click(screen.getByRole('button', { name: /Choose from the list/ }))
    expect(screen.getByTestId('value').textContent).toBe('')
  })
})
