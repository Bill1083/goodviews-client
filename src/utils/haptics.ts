/** Short tactile confirmation when a drag gesture crosses its commit threshold.
 *  No-ops on browsers/devices without vibration support (e.g. iOS Safari). */
export function triggerHaptic(durationMs = 10) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(durationMs)
  }
}
