import { describe, it, expect } from 'vitest';
import { detectLang, pickReply, TICKET_FORMAT, STAFF_PIN } from '../lib/assistant.js';
import { densityColor } from '../shared/data.js';

describe('detectLang', () => {
  it('detects Spanish from accented words and markers', () => {
    expect(detectLang('¿Dónde está el baño más cercano?')).toBe('es');
  });

  it('detects Portuguese from banheiro/saída markers', () => {
    expect(detectLang('Onde fica o banheiro mais próximo?')).toBe('pt');
  });

  it('detects French from toilettes/où markers', () => {
    expect(detectLang('Où sont les toilettes les plus proches?')).toBe('fr');
  });

  it('detects German from toilette/wo markers', () => {
    expect(detectLang('Wo ist die nächste Toilette?')).toBe('de');
  });

  it('detects English from common words', () => {
    expect(detectLang('Where is the nearest restroom?')).toBe('en');
  });

  it('returns null when no language scores a confident match', () => {
    expect(detectLang('118014')).toBeNull();
  });
});

describe('pickReply', () => {
  it('returns the restroom reply when the message mentions a restroom', () => {
    expect(pickReply('en', 'where is the bathroom')).toMatch(/restroom/i);
  });

  it('returns the exit reply when the message mentions leaving', () => {
    expect(pickReply('en', 'what is the fastest exit')).toMatch(/Gate 4/);
  });

  it('returns the food reply when the message mentions being hungry', () => {
    expect(pickReply('en', 'I am hungry, any food nearby?')).toMatch(/Churro/);
  });

  it('falls back to the default reply for unmatched input', () => {
    expect(pickReply('en', 'what time is kickoff')).toMatch(/routing that to the right place/i);
  });

  it('matches keywords in Spanish', () => {
    expect(pickReply('es', 'dónde está el baño')).toMatch(/baño/i);
  });

  it('matches keywords in French', () => {
    expect(pickReply('fr', 'où sont les toilettes')).toMatch(/toilettes/i);
  });
});

describe('densityColor', () => {
  it('returns red for zones at or above 90% capacity', () => {
    expect(densityColor(97)).toBe('#FF6B5B');
    expect(densityColor(90)).toBe('#FF6B5B');
  });

  it('returns amber for zones between 70% and 89%', () => {
    expect(densityColor(74)).toBe('#FFC24B');
    expect(densityColor(70)).toBe('#FFC24B');
  });

  it('returns green for zones under 70%', () => {
    expect(densityColor(48)).toBe('#3ED07A');
    expect(densityColor(0)).toBe('#3ED07A');
  });
});

describe('TICKET_FORMAT', () => {
  it('accepts realistic ticket-shaped IDs', () => {
    expect(TICKET_FORMAT.test('WC26-118014')).toBe(true);
    expect(TICKET_FORMAT.test('wc27-1123')).toBe(true);
  });

  it('rejects strings shorter than 6 characters', () => {
    expect(TICKET_FORMAT.test('abc')).toBe(false);
  });

  it('rejects empty input', () => {
    expect(TICKET_FORMAT.test('')).toBe(false);
  });

  it('rejects characters outside letters/digits/dashes', () => {
    expect(TICKET_FORMAT.test('wc26 118014')).toBe(false);
  });
});

describe('STAFF_PIN', () => {
  it('is a non-empty demo passcode', () => {
    expect(STAFF_PIN).toBe('2026');
  });
});
