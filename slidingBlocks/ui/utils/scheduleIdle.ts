const glob = globalThis as unknown as {
  requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number
  cancelIdleCallback?: (id: number) => void
  clearIdleCallback?: (id: number) => void
}

/**
 * Schedules a callback to run when the browser is idle.
 * Falls back to setTimeout(0) when requestIdleCallback is unavailable (e.g. React Native).
 */
export const scheduleIdle =
  typeof glob.requestIdleCallback === 'function'
    ? (cb: () => void) => glob.requestIdleCallback!(cb, { timeout: 100 })
    : (cb: () => void) => setTimeout(cb, 0) as unknown as number

/**
 * Cancels a previously scheduled idle callback.
 * Uses cancelIdleCallback or clearIdleCallback when available, otherwise clearTimeout.
 */
export const cancelIdle =
  typeof glob.cancelIdleCallback === 'function'
    ? (id: number) => glob.cancelIdleCallback!(id)
    : typeof glob.clearIdleCallback === 'function'
      ? (id: number) => glob.clearIdleCallback!(id)
      : (id: number) => clearTimeout(id)
