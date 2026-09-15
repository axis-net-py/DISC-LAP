import { describe, expect, it } from 'vitest';
import { createAssessmentService } from '../src/services/assessments.js';

function validInput(overrides = {}) {
  return {
    idempotencyKey: 'test-12345678',
    name: 'Ana López',
    phone: '0981 234 567',
    country: 'PY',
    locale: 'es-PY',
    consent: true,
    answers: Array(24).fill(3),
    ...overrides
  };
}

function fakeRepository() {
  const records = new Map();
  return {
    async findByIdempotencyKey(key) { return records.get(key) ?? null; },
    async insert(record) {
      const saved = { id: '00000000-0000-4000-8000-000000000001', completedAt: '2026-09-15T12:00:00.000Z', ...record };
      records.set(record.idempotencyKey, saved);
      return saved;
    }
  };
}

describe('assessment submission service', () => {
  it('normalizes, scores, persists, and targets WhatsApp to the registered participant', async () => {
    const service = createAssessmentService({ repository: fakeRepository() });
    const result = await service.submit(validInput());

    expect(result.participant).toEqual({ name: 'Ana López', phone: '+595981234567', country: 'PY' });
    expect(result.scores.raw).toEqual({ D: 18, I: 18, S: 18, C: 18 });
    expect(result.profile.isTie).toBe(true);
    expect(new URL(result.whatsappUrl).pathname).toBe('/595981234567');
    expect(new URL(result.whatsappUrl).searchParams.get('text')).toContain('Ana López');
  });

  it('returns the original submission for an idempotent replay', async () => {
    const repository = fakeRepository();
    const service = createAssessmentService({ repository });
    const first = await service.submit(validInput());
    const second = await service.submit(validInput({ name: 'Changed client value' }));
    expect(second).toEqual(first);
  });

  it('accepts Portuguese with a Paraguayan number when the participant explicitly selects Paraguay', async () => {
    const service = createAssessmentService({ repository: fakeRepository() });
    const result = await service.submit(validInput({ locale: 'pt-BR', country: 'PY' }));
    expect(result.participant.phone).toBe('+595981234567');
  });

  it.each([
    [{ consent: false }, 'consent'],
    [{ name: 'A' }, 'name'],
    [{ phone: '123' }, 'telefone'],
    [{ answers: Array(23).fill(2) }, '24'],
    [{ idempotencyKey: 'x' }, 'idempotency']
  ])('rejects invalid submission %o', async (override, message) => {
    const service = createAssessmentService({ repository: fakeRepository() });
    await expect(service.submit(validInput(override))).rejects.toThrow(new RegExp(message, 'i'));
  });

  it('rate limits repeated submissions before touching persistence', async () => {
    const limiter = { consume: () => false };
    const service = createAssessmentService({ repository: fakeRepository(), limiter });
    await expect(service.submit(validInput(), { clientKey: '198.51.100.4' })).rejects.toMatchObject({ code: 'RATE_LIMITED' });
  });
});
