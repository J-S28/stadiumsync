import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeechSynthesis } from '../lib/speech.js';

describe('useSpeechSynthesis', () => {
  it('does not speak when called with no text', () => {
    const { result } = renderHook(() => useSpeechSynthesis());
    act(() => { result.current.speak(''); });
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
    expect(result.current.speaking).toBe(false);
  });

  it('marks speaking false once the utterance ends', () => {
    const { result } = renderHook(() => useSpeechSynthesis());
    act(() => { result.current.speak('hello'); });
    expect(result.current.speaking).toBe(true);

    const utterance = window.speechSynthesis.speak.mock.calls[0][0];
    act(() => { utterance.onend(); });
    expect(result.current.speaking).toBe(false);
  });

  it('marks speaking false if the utterance errors', () => {
    const { result } = renderHook(() => useSpeechSynthesis());
    act(() => { result.current.speak('hello'); });

    const utterance = window.speechSynthesis.speak.mock.calls[0][0];
    act(() => { utterance.onerror(); });
    expect(result.current.speaking).toBe(false);
  });

  it('is a no-op in browsers without SpeechSynthesis support', () => {
    const original = window.speechSynthesis;
    delete window.speechSynthesis;
    try {
      const { result } = renderHook(() => useSpeechSynthesis());
      expect(() => act(() => {
        result.current.speak('hello');
        result.current.stop();
      })).not.toThrow();
      expect(result.current.speaking).toBe(false);
    } finally {
      window.speechSynthesis = original;
    }
  });
});
