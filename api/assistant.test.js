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
});
