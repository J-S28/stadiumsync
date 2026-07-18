import { useState, useCallback, useEffect } from "react";

// Thin wrapper over the Web Speech API's SpeechSynthesis, shared by
// NavigateTab's audio wayfinding and Match Hub's spoken commentary — both
// want the same "one utterance at a time, tap again to stop" behavior and
// the same missing-API guard (SSR / unsupported browsers never call in).
export function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback((text, { rate } = {}) => {
    if (!text || typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    if (rate) utterance.rate = rate;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, []);

  // Stop any in-flight utterance when the tab unmounts (e.g. switching
  // tabs mid-speech) instead of leaving it talking over the next screen.
  useEffect(() => stop, [stop]);

  return { speaking, speak, stop };
}
