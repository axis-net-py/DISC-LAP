import { describe, expect, it } from 'vitest';
import { normalizePhone, PhoneValidationError } from '../src/domain/phone.js';

describe('normalizePhone', () => {
  it.each([
    ['(49) 99840-1834', 'BR', '+5549998401834', '49998401834'],
    ['49 3482-1234', 'BR', '+554934821234', '4934821234'],
    ['5549998401834', 'BR', '+5549998401834', '49998401834'],
    ['+55 (49) 99840-1834', 'BR', '+5549998401834', '49998401834'],
    ['981 234 567', 'PY', '+595981234567', '981234567'],
    ['0981 234 567', 'PY', '+595981234567', '981234567'],
    ['595981234567', 'PY', '+595981234567', '981234567'],
    ['+595 981 234 567', 'PY', '+595981234567', '981234567']
  ])('normalizes %s for %s', (input, country, e164, national) => {
    expect(normalizePhone(input, country)).toEqual({
      e164,
      digits: e164.slice(1),
      national,
      country
    });
  });

  it.each([
    ['', 'BR'],
    ['12345678', 'BR'],
    ['009819999999', 'PY'],
    ['5511999999999', 'PY'],
    ['595981234567', 'BR'],
    ['881234567', 'PY'],
    ['98123456', 'PY'],
    ['49998401834', 'XX']
  ])('rejects ambiguous or invalid input %s for %s', (input, country) => {
    expect(() => normalizePhone(input, country)).toThrow(PhoneValidationError);
  });

  it('rejects alphabetic input instead of silently deleting it', () => {
    expect(() => normalizePhone('49 abc 99840-1834', 'BR')).toThrow(/caracteres/i);
  });
});
