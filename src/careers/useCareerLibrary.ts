import { useEffect, useState } from 'react'
import { getCareerLibrary, getWeaponLibrary } from '../db/db'
import type { CareerLibrary, WeaponLibrary } from '../domain/schema'

/** Loads one device library: undefined while loading, null if not imported. */
function useLibrary<T>(
  load: () => Promise<T | null>,
): [T | null | undefined, (v: T | null) => void] {
  const [lib, setLib] = useState<T | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    load()
      .then((l) => alive && setLib(l))
      .catch(() => alive && setLib(null))
    return () => {
      alive = false
    }
  }, [load])
  return [lib, setLib]
}

export function useCareerLibrary(): CareerLibrary | null | undefined {
  return useLibrary(getCareerLibrary)[0]
}

export function useCareerLibraryState(): [
  CareerLibrary | null | undefined,
  (v: CareerLibrary | null) => void,
] {
  return useLibrary(getCareerLibrary)
}

export function useWeaponLibraryState(): [
  WeaponLibrary | null | undefined,
  (v: WeaponLibrary | null) => void,
] {
  return useLibrary(getWeaponLibrary)
}
