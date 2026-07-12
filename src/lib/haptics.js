// Thin wrapper over the Vibration API. Only Android Chrome/Firefox actually
// support navigator.vibrate — iOS Safari and most desktop browsers have no
// implementation at all, so these silently no-op there. That's the honest
// behavior: progressive enhancement, not a fake vibration promise.
function vibrate(pattern) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(pattern);
  }
}

// AI shortest-wait pick: a single, sharp tick.
export function hapticTick() {
  vibrate(15);
}

// AI crowd-spike dispatch: a sustained, heavy pulse.
export function hapticDispatch() {
  vibrate([200, 80, 200, 80, 400]);
}

// Step-free routing toggle: one firm "snap".
export function hapticSnap() {
  vibrate(40);
}
