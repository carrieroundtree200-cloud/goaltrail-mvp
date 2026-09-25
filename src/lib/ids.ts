/** Short, readable, collision-safe-enough identifiers for a local prototype. */
export function createId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replaceAll('-', '').slice(0, 10)
      : Math.random().toString(36).slice(2, 12)
  return `${prefix}_${random}`
}
