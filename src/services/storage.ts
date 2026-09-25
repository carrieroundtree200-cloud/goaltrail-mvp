/**
 * Thin wrapper over localStorage with a memory fallback, so the prototype keeps
 * working in private-browsing modes and server-rendered/test environments.
 */

const memory = new Map<string, string>()

function backing(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const probe = '__goaltrail_probe__'
      window.localStorage.setItem(probe, '1')
      window.localStorage.removeItem(probe)
      return window.localStorage
    }
  } catch {
    // localStorage exists but is blocked — fall through to memory.
  }
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => void memory.set(key, value),
    removeItem: (key) => void memory.delete(key),
  }
}

export function readJson<T>(key: string): T | undefined {
  const raw = backing().getItem(key)
  if (raw === null) return undefined
  try {
    return JSON.parse(raw) as T
  } catch {
    // Corrupt value: drop it rather than wedging the app on every load.
    backing().removeItem(key)
    return undefined
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    backing().setItem(key, JSON.stringify(value))
  } catch (error) {
    throw new Error(
      `Could not save to browser storage. It may be full or blocked. (${String(error)})`,
    )
  }
}

export function removeKey(key: string): void {
  backing().removeItem(key)
}
