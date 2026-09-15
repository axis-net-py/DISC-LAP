import { describe, expect, it } from 'vitest';
import { ASSESSMENT_ITEMS, scoreAssessment, buildProfile } from '../src/domain/assessment.js';

describe('canonical assessment', () => {
  it('contains exactly six stable items per DISC dimension', () => {
    expect(ASSESSMENT_ITEMS).toHaveLength(24);
    expect(new Set(ASSESSMENT_ITEMS.map(({ id }) => id)).size).toBe(24);
    for (const dimension of ['D', 'I', 'S', 'C']) {
      expect(ASSESSMENT_ITEMS.filter((item) => item.dimension === dimension)).toHaveLength(6);
    }
  });
});

describe('scoreAssessment', () => {
  it('rejects incomplete answers so partial reports cannot be persisted', () => {
    expect(() => scoreAssessment(Array(23).fill(2))).toThrow(/24/);
  });

  it.each([0, 5, 1.5, '4', null])('rejects invalid answer %s', (answer) => {
    const answers = Array(24).fill(2);
    answers[7] = answer;
    expect(() => scoreAssessment(answers)).toThrow(/1 a 4/);
  });

  it('maps the real scale boundaries to 0 and 100 intensity', () => {
    expect(scoreAssessment(Array(24).fill(1)).intensity).toEqual({ D: 0, I: 0, S: 0, C: 0 });
    expect(scoreAssessment(Array(24).fill(4)).intensity).toEqual({ D: 100, I: 100, S: 100, C: 100 });
  });

  it('scores dimensions independently using canonical item metadata', () => {
    const answers = ASSESSMENT_ITEMS.map((item) => item.dimension === 'D' ? 4 : 1);
    expect(scoreAssessment(answers)).toMatchObject({
      raw: { D: 24, I: 6, S: 6, C: 6 },
      intensity: { D: 100, I: 0, S: 0, C: 0 },
      ranking: ['D', 'I', 'S', 'C'],
      dominant: ['D'],
      isTie: false
    });
  });

  it('declares a top tie instead of silently choosing the first dimension', () => {
    const answers = ASSESSMENT_ITEMS.map((item) => ['I', 'S'].includes(item.dimension) ? 4 : 1);
    expect(scoreAssessment(answers)).toMatchObject({
      ranking: ['I', 'S', 'D', 'C'],
      dominant: ['I', 'S'],
      isTie: true
    });
  });
});

describe('buildProfile', () => {
  it.each(['pt-BR', 'es-PY'])('builds a localized primary and secondary corporate report for %s', (locale) => {
    const scores = { raw: { D: 24, I: 18, S: 12, C: 6 }, intensity: { D: 100, I: 67, S: 33, C: 0 }, ranking: ['D', 'I', 'S', 'C'], dominant: ['D'], isTie: false };
    const report = buildProfile(scores, locale);
    expect(report.primary.code).toBe('D');
    expect(report.secondary.code).toBe('I');
    expect(report.strengths.length).toBeGreaterThanOrEqual(3);
    expect(report.watchOuts.length).toBeGreaterThanOrEqual(2);
    expect(report.communication).toBeTruthy();
    expect(report.decisionMaking).toBeTruthy();
    expect(report.teamwork).toBeTruthy();
    expect(report.actions.length).toBeGreaterThanOrEqual(2);
  });
});
