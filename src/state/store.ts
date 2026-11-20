import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { getCharacter, saveCharacter } from '../db/db'
import { nowIso } from '../domain/factory'
import type { Character } from '../domain/schema'

export type SaveStatus = 'loading' | 'saved' | 'pending' | 'saving' | 'error'

export type Mutator = (draft: Character) => void

export type CharacterStore = {
  character: Character | null
  loadError: string | null
  status: SaveStatus
  saveError: string | null
  update: (mut: Mutator) => void
  flush: () => Promise<void>
}

const SAVE_DELAY_MS = 500

/**
 * Loads one character and autosaves every change (debounced). Changes are
 * computed from a ref so updates are synchronous and never lost; pending
 * writes are flushed when the page is hidden or closed.
 */
export function useCharacterStore(id: string): CharacterStore {
  const [character, setCharacter] = useState<Character | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [status, setStatus] = useState<SaveStatus>('loading')
  const [saveError, setSaveError] = useState<string | null>(null)
  const current = useRef<Character | null>(null)
  const dirty = useRef(false)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    getCharacter(id)
      .then((c) => {
        if (cancelled) return
        if (!c) setLoadError('Character not found.')
        current.current = c
        setCharacter(c)
        setStatus('saved')
      })
      .catch((e: unknown) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const flush = useCallback(async () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    const c = current.current
    if (!dirty.current || !c) return
    dirty.current = false
    setStatus('saving')
    try {
      await saveCharacter(c)
      setSaveError(null)
      setStatus(dirty.current ? 'pending' : 'saved')
    } catch (e) {
      dirty.current = true
      setSaveError(e instanceof Error ? e.message : String(e))
      setStatus('error')
    }
  }, [])

  const update = useCallback(
    (mut: Mutator) => {
      const prev = current.current
      if (!prev) return
      const next = structuredClone(prev)
      mut(next)
      next.updatedAt = nowIso()
      current.current = next
      dirty.current = true
      setCharacter(next)
      setStatus('pending')
      if (timer.current !== null) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => void flush(), SAVE_DELAY_MS)
    },
    [flush],
  )

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flush()
    }
    const onPageHide = () => void flush()
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onPageHide)
      void flush()
    }
  }, [flush])

  return { character, loadError, status, saveError, update, flush }
}

export type CharCtx = { c: Character; update: (mut: Mutator) => void }

export const CharacterContext = createContext<CharCtx | null>(null)

export function useChar(): CharCtx {
  const ctx = useContext(CharacterContext)
  if (!ctx) throw new Error('useChar outside CharacterContext')
  return ctx
}
