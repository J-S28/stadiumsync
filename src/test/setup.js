import '@testing-library/jest-dom';
import { vi } from 'vitest';

// jsdom doesn't implement these — StadiumSync uses them for audio wayfinding,
// chat auto-scroll, and Recharts' responsive containers respectively.
window.speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
};
window.SpeechSynthesisUtterance = class {
  constructor(text) {
    this.text = text;
  }
};

Element.prototype.scrollIntoView = vi.fn();

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Default to "offline" so the assistant's fallback path is exercised
// deterministically; individual tests can override global.fetch to
// exercise the success path instead.
global.fetch = vi.fn(() => Promise.reject(new Error('network unavailable in test environment')));
