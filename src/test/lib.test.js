import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { pickProtocolReply } from '../lib/protocol.js';
import { parseIncidentSummary, parseComms, RAW_REPORTS, INCIDENT_FALLBACK, COMMS_FALLBACK } from '../lib/incident.js';
import { COMMENTARY_FALLBACK } from '../lib/commentary.js';
import { parseEgressUpdate, EGRESS_FALLBACK } from '../lib/egress.js';
import { callAssistant } from '../lib/callAssistant.js';
import { hapticTick, hapticDispatch, hapticSnap } from '../lib/haptics.js';
import { useDispatchAction } from '../lib/dispatch.js';

describe('pickProtocolReply', () => {
  it('matches the lost-child protocol', () => {
    expect(pickProtocolReply('a child is lost near Gate 3')).toMatch(/Guest Services/i);
  });

  it('matches the rejected-ticket protocol', () => {
    expect(pickProtocolReply('this VIP ticket was rejected at the gate')).toMatch(/Box Office/i);
  });

  it('matches the medical protocol', () => {
    expect(pickProtocolReply('guest is unresponsive')).toMatch(/Medical/i);
  });

  it('matches the spill/hazard protocol', () => {
    expect(pickProtocolReply('there is a spill near section 12')).toMatch(/Custodial/i);
  });

  it('matches the weather protocol', () => {
    expect(pickProtocolReply('severe weather warning issued')).toMatch(/Incident Command/i);
  });

  it('falls back to the escalation default for unmatched input', () => {
    expect(pickProtocolReply('what time does the gift shop close')).toMatch(/shift supervisor/i);
  });
});

describe('parseIncidentSummary', () => {
  it('extracts the alert and deployment lines', () => {
    const text = 'Alert: Crowd building at Gate 4.\nRecommended deployment: 2 marshals to Gate 4.';
    expect(parseIncidentSummary(text)).toEqual({
      alert: 'Crowd building at Gate 4.',
      deployment: '2 marshals to Gate 4.',
    });
  });

  it('falls back to the raw text as the alert when the format is unexpected', () => {
    const result = parseIncidentSummary('unstructured model output');
    expect(result.alert).toBe('unstructured model output');
    expect(result.deployment).toBe('');
  });
});

describe('parseComms', () => {
  it('extracts the PA and PUSH lines', () => {
    const text = 'PA: Please use Concourse S.\nPUSH: Gate 4 busy, try Concourse S.';
    expect(parseComms(text)).toEqual({
      pa: 'Please use Concourse S.',
      push: 'Gate 4 busy, try Concourse S.',
    });
  });

  it('falls back to the raw text as the PA line when the format is unexpected', () => {
    const result = parseComms('unstructured model output');
    expect(result.pa).toBe('unstructured model output');
    expect(result.push).toBe('');
  });
});

describe('incident/comms fallback data', () => {
  it('exposes a non-empty raw report list', () => {
    expect(RAW_REPORTS.length).toBeGreaterThan(0);
    RAW_REPORTS.forEach((r) => {
      expect(r.source).toBeTruthy();
      expect(r.text).toBeTruthy();
    });
  });

  it('exposes complete offline fallbacks', () => {
    expect(INCIDENT_FALLBACK.alert).toBeTruthy();
    expect(INCIDENT_FALLBACK.deployment).toBeTruthy();
    expect(COMMS_FALLBACK.pa).toBeTruthy();
    expect(COMMS_FALLBACK.push).toBeTruthy();
  });
});

describe('parseEgressUpdate', () => {
  it('extracts the wayfinding and signage lines', () => {
    const text = 'WAYFINDING: Head to Zócalo Fan Fest.\nSIGNAGE: USE ZÓCALO FAN FEST';
    expect(parseEgressUpdate(text)).toEqual({
      wayfinding: 'Head to Zócalo Fan Fest.',
      signage: 'USE ZÓCALO FAN FEST',
    });
  });

  it('falls back to the raw text as the wayfinding line when the format is unexpected', () => {
    const result = parseEgressUpdate('unstructured model output');
    expect(result.wayfinding).toBe('unstructured model output');
    expect(result.signage).toBe('');
  });

  it('exposes a complete offline fallback', () => {
    expect(EGRESS_FALLBACK.wayfinding).toBeTruthy();
    expect(EGRESS_FALLBACK.signage).toBeTruthy();
  });
});

describe('COMMENTARY_FALLBACK', () => {
  it('has fallback text for both styles', () => {
    expect(COMMENTARY_FALLBACK.tactical).toBeTruthy();
    expect(COMMENTARY_FALLBACK.biased).toBeTruthy();
  });
});

describe('callAssistant', () => {
  it('posts the messages/mode/lang/style and returns the reply', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reply: 'Radio Guest Services immediately.' }),
    });
    try {
      const reply = await callAssistant({ mode: 'protocol', messages: [{ role: 'user', text: 'lost child' }] });
      expect(reply).toBe('Radio Guest Services immediately.');
      expect(global.fetch).toHaveBeenCalledWith('/api/assistant', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));
      const [, options] = global.fetch.mock.calls[0];
      expect(JSON.parse(options.body)).toEqual({
        messages: [{ role: 'user', text: 'lost child' }],
        mode: 'protocol',
        lang: 'en',
        style: 'tactical',
      });
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('throws when the response is not ok', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    try {
      await expect(callAssistant({ messages: [{ role: 'user', text: 'hi' }] })).rejects.toThrow();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('returns an empty string when the response has no reply field', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    try {
      const reply = await callAssistant({ messages: [{ role: 'user', text: 'hi' }] });
      expect(reply).toBe('');
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe('haptics', () => {
  it('calls navigator.vibrate with the expected pattern when supported', () => {
    const vibrate = vi.fn();
    const original = navigator.vibrate;
    navigator.vibrate = vibrate;
    try {
      hapticTick();
      hapticDispatch();
      hapticSnap();
      expect(vibrate).toHaveBeenCalledTimes(3);
      expect(vibrate).toHaveBeenNthCalledWith(1, 15);
      expect(vibrate).toHaveBeenNthCalledWith(2, [200, 80, 200, 80, 400]);
      expect(vibrate).toHaveBeenNthCalledWith(3, 40);
    } finally {
      navigator.vibrate = original;
    }
  });

  it('does not throw when the Vibration API is unsupported', () => {
    const original = navigator.vibrate;
    delete navigator.vibrate;
    try {
      expect(() => hapticTick()).not.toThrow();
    } finally {
      navigator.vibrate = original;
    }
  });
});

describe('useDispatchAction', () => {
  it('starts undispatched, then flips to dispatched and ticks the vibration on dispatch()', () => {
    const vibrate = vi.fn();
    const original = navigator.vibrate;
    navigator.vibrate = vibrate;
    try {
      const { result } = renderHook(() => useDispatchAction());
      expect(result.current.dispatched).toBe(false);

      act(() => { result.current.dispatch(); });
      expect(result.current.dispatched).toBe(true);
      expect(vibrate).toHaveBeenCalledWith([200, 80, 200, 80, 400]);
    } finally {
      navigator.vibrate = original;
    }
  });
});
