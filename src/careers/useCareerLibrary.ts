import { useEffect, useState } from 'react'
import { getCareerLibrary } from '../db/db'
import type { CareerLibrary } from '../domain/schema'

/** The device's career library: undefined while loading, null if not imported. */
export function useCareerLibrary(): CareerLibrary | null | undefined {
  const [lib, setLib] = useState<CareerLibrary | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    getCareerLibrary()
      .then((l) => alive && setLib(l))
      .catch(() => alive && setLib(null))
    return () => {
      alive = false
    }
  }, [])
  return lib
}
