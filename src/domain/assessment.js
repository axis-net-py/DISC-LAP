import { pt } from '../content/pt.js';
import { es } from '../content/es.js';
import { GROUP_COUNT } from '../content/questions.js';

const dimensions = ['D', 'I', 'S', 'C'];
const BASELINE_PER_DIMENSION = GROUP_COUNT * 1; // nota mínima 1 por grupo
const MAX_PER_DIMENSION = GROUP_COUNT * 4; // nota máxima 4 por grupo
const RANGE_PER_DIMENSION = MAX_PER_DIMENSION - BASELINE_PER_DIMENSION; // 30 com 10 grupos

// Espelho do teste manual: 10 grupos x 4 adjetivos na ordem fixa [D, I, S, C].
export const ASSESSMENT_ITEMS = Object.freeze(Array.from({ length: GROUP_COUNT }, (_, groupIndex) => ({
  id: `g${String(groupIndex + 1).padStart(2, '0')}`,
  options: Object.freeze(dimensions.map((dimension) => ({ dimension })))
})));

export class AssessmentValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AssessmentValidationError';
  }
}

function assertIpsativeGroups(answers) {
  if (!Array.isArray(answers) || answers.length !== GROUP_COUNT) {
    throw new AssessmentValidationError(`O teste exige exatamente ${GROUP_COUNT} grupos.`);
  }
  answers.forEach((group, groupIndex) => {
    if (!Array.isArray(group) || group.length !== dimensions.length) {
      throw new AssessmentValidationError(`O grupo ${groupIndex + 1} exige 4 classificações.`);
    }
    if (group.some((answer) => !Number.isInteger(answer) || answer < 1 || answer > 4)) {
      throw new AssessmentValidationError('Cada resposta deve ser um número inteiro de 1 a 4.');
    }
    const sorted = [...group].sort((a, b) => a - b);
    if (sorted.join(',') !== '1,2,3,4') {
      throw new AssessmentValidationError(
        `O grupo ${groupIndex + 1} deve usar 1, 2, 3 e 4 sem repetir (4 = mais se parece, 1 = menos se parece).`
      );
    }
  });
}

function compositionFromRaw(raw) {
  const expressed = Object.fromEntries(dimensions.map((dimension) => [
    dimension,
    raw[dimension] - BASELINE_PER_DIMENSION
  ]));
  const total = Object.values(expressed).reduce((sum, value) => sum + value, 0);
  if (total === 0) return { D: 25, I: 25, S: 25, C: 25 };

  const exact = Object.fromEntries(dimensions.map((dimension) => [
    dimension,
    (expressed[dimension] / total) * 100
  ]));
  const composition = Object.fromEntries(dimensions.map((dimension) => [
    dimension,
    Math.floor(exact[dimension])
  ]));
  const missing = 100 - Object.values(composition).reduce((sum, value) => sum + value, 0);
  [...dimensions]
    .sort((left, right) => (exact[right] - composition[right]) - (exact[left] - composition[left]))
    .slice(0, missing)
    .forEach((dimension) => { composition[dimension] += 1; });
  return composition;
}

// answers: Array(10) de grupos, cada grupo = [notaD, notaI, notaS, notaC] com 1-4 sem repetir.
// Equivale à SOMA por coluna do teste manual (mín 10, máx 40 por dimensão).
export function scoreAssessment(answers) {
  assertIpsativeGroups(answers);

  const raw = { D: 0, I: 0, S: 0, C: 0 };
  answers.forEach((group) => {
    group.forEach((value, optionIndex) => {
      raw[dimensions[optionIndex]] += value;
    });
  });
  const intensity = Object.fromEntries(dimensions.map((dimension) => [
    dimension,
    Math.round(((raw[dimension] - BASELINE_PER_DIMENSION) / RANGE_PER_DIMENSION) * 100)
  ]));
  const composition = compositionFromRaw(raw);
  const dimensionOrder = new Map(dimensions.map((dimension, index) => [dimension, index]));
  const ranking = [...dimensions].sort((left, right) =>
    raw[right] - raw[left] || dimensionOrder.get(left) - dimensionOrder.get(right)
  );
  const topScore = raw[ranking[0]];
  const dominant = ranking.filter((dimension) => raw[dimension] === topScore);

  return { raw, intensity, composition, ranking, dominant, isTie: dominant.length > 1 };
}

export function buildProfile(scores, locale = 'pt-BR') {
  const content = locale === 'es-PY' ? es : pt;
  const primaryCode = scores.ranking[0];
  const secondaryCode = scores.ranking.find((code) => !scores.dominant.includes(code)) ?? scores.ranking[1];
  const primary = content.profiles[primaryCode];
  const secondary = content.profiles[secondaryCode];

  return {
    isTie: scores.isTie,
    dominant: scores.dominant.map((code) => ({ code, ...content.profiles[code] })),
    primary: { code: primaryCode, name: primary.name, label: primary.label },
    secondary: { code: secondaryCode, name: secondary.name, label: secondary.label },
    strengths: primary.strengths,
    watchOuts: primary.watchOuts,
    communication: primary.communication,
    decisionMaking: primary.decisionMaking,
    teamwork: primary.teamwork,
    actions: primary.actions
  };
}
