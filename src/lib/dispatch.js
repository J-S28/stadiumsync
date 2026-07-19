import { useState, useCallback } from "react";
import { hapticDispatch } from "./haptics.js";

// Shared by every one-tap "AI dispatch" action (Deploy marshals, Dispatch
// cart) — a haptic tick plus a one-way dispatched flag, the same two lines
// each of those cards repeated.
export function useDispatchAction() {
  const [dispatched, setDispatched] = useState(false);
  const dispatch = useCallback(() => {
    hapticDispatch();
    setDispatched(true);
  }, []);
  return { dispatched, dispatch };
}
