import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('shows the character list', async () => {
    render(<App />)
    expect(await screen.findByText(/No characters yet/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /New character/ })).toBeInTheDocument()
  })
})
