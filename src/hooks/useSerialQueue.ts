import { useRef } from 'react'

/** Runs at most one async `send` per key at a time. Calling it again for a
 *  key that's already mid-send doesn't start a second, overlapping request
 *  — it just replaces what that key sends next, which goes out immediately
 *  once the current one finishes. A burst of calls for the same key during
 *  one send collapses to just that latest value; nothing in between is
 *  ever sent. Different keys never wait on each other.
 *
 *  This is what stops a rapid burst of taps from firing concurrent
 *  requests that can land out of order — without it, an older request can
 *  finish *after* a newer one and "win", which looks like the UI
 *  processing a tap, correcting itself, then bouncing back to stale a
 *  moment later. */
export function useSerialQueue<K, V>(send: (key: K, value: V) => Promise<unknown>, onDrained?: (key: K) => void) {
  const inFlight = useRef(new Set<K>())
  const pending = useRef(new Map<K, V>())

  const drain = async (key: K) => {
    while (pending.current.has(key)) {
      const value = pending.current.get(key) as V
      pending.current.delete(key)
      try {
        await send(key, value)
      } catch {
        // send() owns its own error reporting/recovery — the queue's only
        // job is ordering, so a failed send just ends this key's burst
        // rather than retrying a now-stale value.
        break
      }
    }
    inFlight.current.delete(key)
    onDrained?.(key)
  }

  return (key: K, value: V) => {
    pending.current.set(key, value)
    if (!inFlight.current.has(key)) {
      inFlight.current.add(key)
      void drain(key)
    }
  }
}
