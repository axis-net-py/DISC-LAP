import { describe, expect, it } from 'vitest';
import { ASSESSMENT_ITEMS, scoreAssessment, buildProfile } from '../src/domain/assessment.js';
import { GROUP_COUNT } from '../src/content/questions.js';

const dominantD = Array.from({ length: GROUP_COUNT }, () => [4, 3, 2, 1]);
const balanced = Array.from({ length: GROUP_COUNT }, (_, index) =>
  index % 2 === 0 ? [4, 3, 2, 1] : [1, 2, 3, 4]
);

describe('canonical assessment', () => {
  it('contains ten ipsative groups with fixed D/I/S/C options', () => {
    expect(GROUP_COUNT).toBe(10);
    expect(ASSESSMENT_ITEMS).toHaveLength(10);
    expect(new Set(ASSESSMENT_ITEMS.map(({ id }) => id)).size).toBe(10);
    for (const item of ASSESSMENT_ITEMS) {
      expect(item.options.map((option) => option.dimension)).toEqual(['D', 'I', 'S', 'C']);
    }
  });
});

describe('scoreAssessment', () => {
  it('rejects incomplete answers so partial reports cannot be persisted', () => {
    expect(() => scoreAssessment(Array(9).fill([4, 3, 2, 1]))).toThrow(/10/);
  });

  it.each([0, 5, 1.5, '4', null])('rejects invalid answer %s', (answer) => {
    const answers = dominantD.map((group) => [...group]);
    answers[3][1] = answer;
    expect(() => scoreAssessment(answers)).toThrow(/1 a 4/);
  });

  it('rejects groups that repeat a rank instead of using 1-4 once each', () => {
    const answers = dominantD.map((group) => [...group]);
    answers[0] = [4, 4, 2, 1];
    expect(() => scoreAssessment(answers)).toThrow(/sem repetir/);
  });

  it('maps the ipsative scale boundaries to 0 and 100 intensity', () => {
    const minMax = Array.from({ length: GROUP_COUNT }, () => [4, 1, 2, 3]);
    expect(scoreAssessment(minMax).intensity).toEqual({ D: 100, I: 0, S: 33, C: 67 });
    const inverse = Array.from({ length: GROUP_COUNT }, () => [1, 4, 3, 2]);
    expect(scoreAssessment(inverse).intensity).toEqual({ D: 0, I: 100, S: 67, C: 33 });
  });

  it('normalizes the visible DISC composition to exactly 100 percent', () => {
    const { composition } = scoreAssessment(dominantD);

    expect(Object.values(composition).reduce((sum, value) => sum + value, 0)).toBe(100);
    expect(composition.D).toBeGreaterThan(composition.I);
    expect(composition.I).toBeGreaterThan(composition.S);
    expect(composition.S).toBeGreaterThan(composition.C);
  });

  it('uses an equal composition when every dimension totals the same raw sum', () => {
    expect(scoreAssessment(balanced).composition).toEqual({ D: 25, I: 25, S: 25, C: 25 });
  });

  it('caps a fully dominant dimension below 100 because ranks are forced trade-offs', () => {
    // D=4 em todos os grupos; I/S/C dividem 1-3 em rotação: raw 40/20/20/20.
    const answers = Array.from({ length: GROUP_COUNT }, (_, index) => {
      const rest = [[1, 2, 3], [2, 3, 1], [3, 1, 2]][index % 3];
      return [4, ...rest];
    });
    const { raw, composition } = scoreAssessment(answers);
    expect(raw.D).toBe(40);
    expect(Object.values(composition).reduce((sum, value) => sum + value, 0)).toBe(100);
    expect(composition.D).toBeGreaterThan(40);
    expect(composition.D).toBeLessThan(100);
  });

  it('scores dimensions from the fixed D/I/S/C column order', () => {
    expect(scoreAssessment(dominantD)).toMatchObject({
      raw: { D: 40, I: 30, S: 20, C: 10 },
      intensity: { D: 100, I: 67, S: 33, C: 0 },
      ranking: ['D', 'I', 'S', 'C'],
      dominant: ['D'],
      isTie: false
    });
  });

  it('declares a top tie instead of silently choosing the first dimension', () => {
    expect(scoreAssessment(balanced)).toMatchObject({
      ranking: ['D', 'I', 'S', 'C'],
      dominant: ['D', 'I', 'S', 'C'],
      isTie: true
    });
  });
});

describe('buildProfile', () => {
  it.each(['pt-BR', 'es-PY'])('builds a localized primary and secondary corporate report for %s', (locale) => {
    const scores = { raw: { D: 40, I: 30, S: 20, C: 10 }, intensity: { D: 100, I: 67, S: 33, C: 0 }, ranking: ['D', 'I', 'S', 'C'], dominant: ['D'], isTie: false };
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
