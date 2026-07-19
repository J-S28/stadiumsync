import { describe, it, expect, vi, beforeEach } from 'vitest';

const createMock = vi.fn();

class MockAuthenticationError extends Error {}
class MockRateLimitError extends Error {}

vi.mock('@anthropic-ai/sdk', () => {
  class Anthropic {
    constructor() {
      this.messages = { create: createMock };
    }
    static AuthenticationError = MockAuthenticationError;
    static RateLimitError = MockRateLimitError;
  }
  return { default: Anthropic };
});

const { default: handler } = await import('./assistant.js');

function mockRes() {
  return {
    statusCode: null,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.body = obj; return this; },
  };
}

function mockReq({ method = 'POST', body, ip = '203.0.113.1' } = {}) {
  return { method, body, headers: { 'x-forwarded-for': ip }, socket: { remoteAddress: ip } };
}

describe('POST /api/assistant', () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it('rejects non-POST methods with 405', async () => {
    const res = mockRes();
    await handler(mockReq({ method: 'GET', ip: '1.1.1.1' }), res);
    expect(res.statusCode).toBe(405);
    expect(res.body).toEqual({ error: 'method_not_allowed' });
  });

  it('rejects a missing messages array with 400', async () => {
    const res = mockRes();
    await handler(mockReq({ body: {}, ip: '1.1.1.2' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('invalid_request');
  });

  it('rejects an empty messages array with 400', async () => {
    const res = mockRes();
    await handler(mockReq({ body: { messages: [] }, ip: '1.1.1.3' }), res);
    expect(res.statusCode).toBe(400);
  });

  it('rejects a message with an invalid role with 400', async () => {
    const res = mockRes();
    await handler(mockReq({ body: { messages: [{ role: 'admin', text: 'hi' }] }, ip: '1.1.1.4' }), res);
    expect(res.statusCode).toBe(400);
  });

  it('rejects an oversized message with 400', async () => {
    const res = mockRes();
    const text = 'a'.repeat(2001);
    await handler(mockReq({ body: { messages: [{ role: 'user', text }] }, ip: '1.1.1.5' }), res);
    expect(res.statusCode).toBe(400);
  });

  it('returns the assistant reply on success', async () => {
    createMock.mockResolvedValue({ content: [{ type: 'text', text: 'Gate 4 is busy — use Concourse S.' }] });
    const res = mockRes();
    await handler(mockReq({ body: { messages: [{ role: 'user', text: 'nearest exit?' }] }, ip: '1.1.1.6' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.reply).toBe('Gate 4 is busy — use Concourse S.');
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it('returns an empty reply when the response has no text block', async () => {
    createMock.mockResolvedValue({ content: [{ type: 'tool_use' }] });
    const res = mockRes();
    await handler(mockReq({ body: { messages: [{ role: 'user', text: 'hi' }] }, ip: '1.1.1.20' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.reply).toBe('');
  });

  it('rate-limits by socket.remoteAddress when x-forwarded-for is absent', async () => {
    createMock.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    const res = mockRes();
    const req = { method: 'POST', body: { messages: [{ role: 'user', text: 'hi' }] }, headers: {}, socket: { remoteAddress: '198.51.100.99' } };
    await handler(req, res);
    expect(res.statusCode).toBe(200);
  });

  it('rate-limits by "unknown" when neither x-forwarded-for nor socket.remoteAddress is present', async () => {
    createMock.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    const res = mockRes();
    const req = { method: 'POST', body: { messages: [{ role: 'user', text: 'hi' }] }, headers: {} };
    await handler(req, res);
    expect(res.statusCode).toBe(200);
  });

  it('maps bot/user roles onto assistant/user for the API call', async () => {
    createMock.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    const res = mockRes();
    await handler(
      mockReq({
        body: { messages: [{ role: 'bot', text: 'Hi!' }, { role: 'user', text: 'Where is the exit?' }] },
        ip: '1.1.1.7',
      }),
      res,
    );
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          { role: 'assistant', content: 'Hi!' },
          { role: 'user', content: 'Where is the exit?' },
        ],
      }),
    );
  });

  it('returns 500 when the Anthropic API key is missing/invalid', async () => {
    createMock.mockRejectedValue(new MockAuthenticationError('bad key'));
    const res = mockRes();
    await handler(mockReq({ body: { messages: [{ role: 'user', text: 'hi' }] }, ip: '1.1.1.8' }), res);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('server_misconfigured');
  });

  it('returns 500 when ANTHROPIC_API_KEY is unset (SDK rejects client-side, not as AuthenticationError)', async () => {
    // This is the actual error the @anthropic-ai/sdk throws when no API key is
    // configured — a plain Error, not an Anthropic.AuthenticationError, since
    // it's rejected before any request is sent.
    createMock.mockRejectedValue(new Error('Could not resolve authentication method. Expected one of apiKey, authToken...'));
    const res = mockRes();
    await handler(mockReq({ body: { messages: [{ role: 'user', text: 'hi' }] }, ip: '1.1.1.11' }), res);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('server_misconfigured');
  });

  it('returns 429 when Anthropic rate-limits the request', async () => {
    createMock.mockRejectedValue(new MockRateLimitError('slow down'));
    const res = mockRes();
    await handler(mockReq({ body: { messages: [{ role: 'user', text: 'hi' }] }, ip: '1.1.1.9' }), res);
    expect(res.statusCode).toBe(429);
  });

  it('returns 502 for any other upstream error', async () => {
    createMock.mockRejectedValue(new Error('network blip'));
    const res = mockRes();
    await handler(mockReq({ body: { messages: [{ role: 'user', text: 'hi' }] }, ip: '1.1.1.10' }), res);
    expect(res.statusCode).toBe(502);
    expect(res.body.error).toBe('assistant_unavailable');
  });

  it('returns 502 for an upstream error with no message, instead of throwing on the auth-error check', async () => {
    createMock.mockRejectedValue(new Error());
    const res = mockRes();
    await handler(mockReq({ body: { messages: [{ role: 'user', text: 'hi' }] }, ip: '1.1.1.13' }), res);
    expect(res.statusCode).toBe(502);
    expect(res.body.error).toBe('assistant_unavailable');
  });

  it('defaults to the attendee system prompt when no mode is given', async () => {
    createMock.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    const res = mockRes();
    await handler(mockReq({ body: { messages: [{ role: 'user', text: 'hi' }] }, ip: '1.1.2.1' }), res);
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ system: expect.stringContaining('StadiumSync assistant') }));
  });

  it('uses the protocol system prompt for mode "protocol"', async () => {
    createMock.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    const res = mockRes();
    await handler(mockReq({ body: { messages: [{ role: 'user', text: 'lost child' }], mode: 'protocol' }, ip: '1.1.2.2' }), res);
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ system: expect.stringContaining('Volunteer Copilot') }));
  });

  it('uses the incident summarizer system prompt for mode "incident"', async () => {
    createMock.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    const res = mockRes();
    await handler(mockReq({ body: { messages: [{ role: 'user', text: 'report' }], mode: 'incident' }, ip: '1.1.2.3' }), res);
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ system: expect.stringContaining('Incident Command summarizer') }));
  });

  it('uses the target language in the comms system prompt for mode "comms"', async () => {
    createMock.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    const res = mockRes();
    await handler(mockReq({ body: { messages: [{ role: 'user', text: 'gate 4 crowded' }], mode: 'comms', lang: 'es' }, ip: '1.1.2.4' }), res);
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ system: expect.stringContaining('Spanish') }));
  });

  it('uses the dispatch-brief system prompt for mode "brief"', async () => {
    createMock.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    const res = mockRes();
    await handler(mockReq({ body: { messages: [{ role: 'user', text: 'Gate 4 at 97% — crowd spike' }], mode: 'brief' }, ip: '1.1.2.8' }), res);
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ system: expect.stringContaining('dispatch-brief generator') }));
  });

  it('uses the egress optimizer system prompt for mode "egress"', async () => {
    createMock.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    const res = mockRes();
    await handler(mockReq({ body: { messages: [{ role: 'user', text: 'Metro Blue Line delayed 12 minutes' }], mode: 'egress' }, ip: '1.1.2.9' }), res);
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ system: expect.stringContaining('Egress Optimizer') }));
  });

  it('uses the accessibility system prompt for mode "sensory"', async () => {
    createMock.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    const res = mockRes();
    await handler(mockReq({ body: { messages: [{ role: 'user', text: 'pyrotechnics at halftime' }], mode: 'sensory' }, ip: '1.1.2.10' }), res);
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ system: expect.stringContaining('Accessibility assistant') }));
  });

  it('uses the biased commentary system prompt for mode "commentary" with style "biased"', async () => {
    createMock.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    const res = mockRes();
    await handler(mockReq({ body: { messages: [{ role: 'user', text: 'goal!' }], mode: 'commentary', style: 'biased' }, ip: '1.1.2.5' }), res);
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ system: expect.stringContaining('team-biased') }));
  });

  it('uses the tactical commentary system prompt for mode "commentary" with style "tactical"', async () => {
    createMock.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    const res = mockRes();
    await handler(mockReq({ body: { messages: [{ role: 'user', text: 'corner kick' }], mode: 'commentary', style: 'tactical' }, ip: '1.1.2.6' }), res);
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ system: expect.stringContaining('technical FIFA World Cup 2026 match analyst') }));
  });

  it('uses the tournament intelligence briefing system prompt for mode "briefing"', async () => {
    createMock.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    const res = mockRes();
    await handler(mockReq({ body: { messages: [{ role: 'user', text: 'zone/vendor/sustainability snapshot' }], mode: 'briefing' }, ip: '1.1.2.11' }), res);
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ system: expect.stringContaining('Tournament Operations Intelligence briefing generator') }));
  });

  it('rejects an unknown mode with 400', async () => {
    const res = mockRes();
    await handler(mockReq({ body: { messages: [{ role: 'user', text: 'hi' }], mode: 'nonsense' }, ip: '1.1.2.7' }), res);
    expect(res.statusCode).toBe(400);
  });

  it('rate-limits a client after too many requests in the window', async () => {
    createMock.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    const ip = '198.51.100.42';
    let lastRes;
    for (let i = 0; i < 21; i++) {
      lastRes = mockRes();
      // eslint-disable-next-line no-await-in-loop
      await handler(mockReq({ body: { messages: [{ role: 'user', text: 'hi' }] }, ip }), lastRes);
    }
    expect(lastRes.statusCode).toBe(429);
    expect(lastRes.body.error).toBe('rate_limited');
  });

  it('sweeps fully-expired entries and trims partially-expired ones once the map exceeds its cap', async () => {
    createMock.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    vi.useFakeTimers();
    try {
      const req = (ip) => mockReq({ body: { messages: [{ role: 'user', text: 'hi' }] }, ip });

      // One request now, then goes silent — fully expired by sweep time.
      await handler(req('stale-client'), mockRes());

      vi.advanceTimersByTime(30_000);
      // A second request inside the window keeps this entry's first
      // timestamp alongside the new one — a mix of ages in one entry.
      await handler(req('mixed-client'), mockRes());

      vi.advanceTimersByTime(40_000);
      // stale-client is now 70s stale (fully expired); mixed-client has
      // one expired timestamp (70s old) and one still-fresh one (40s old).

      for (let i = 0; i < 500; i++) {
        // eslint-disable-next-line no-await-in-loop
        await handler(req(`sweep-fill-${i}`), mockRes());
      }

      const finalRes = mockRes();
      await handler(req('post-sweep-client'), finalRes);
      expect(finalRes.statusCode).toBe(200);
    } finally {
      vi.useRealTimers();
    }
  });

  it('sweeps stale entries once the rate-limit map exceeds its cap, without breaking any client', async () => {
    createMock.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    // Drive the tracked-client count past RATE_LIMIT_MAP_CAP (500) with
    // distinct IPs, each making a single request — none should be rate
    // limited, and the sweep this triggers shouldn't throw or misfire.
    for (let i = 0; i < 510; i++) {
      const res = mockRes();
      // eslint-disable-next-line no-await-in-loop
      await handler(mockReq({ body: { messages: [{ role: 'user', text: 'hi' }] }, ip: `sweep-test-client-${i}` }), res);
      expect(res.statusCode).toBe(200);
    }
  });
});
