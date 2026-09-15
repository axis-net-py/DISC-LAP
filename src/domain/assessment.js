import { pt } from '../content/pt.js';
import { es } from '../content/es.js';

const dimensions = ['D', 'I', 'S', 'C'];

export const ASSESSMENT_ITEMS = Object.freeze(Array.from({ length: 24 }, (_, index) => ({
  id: `q${String(index + 1).padStart(2, '0')}`,
  dimension: dimensions[index % dimensions.length]
})));

export class AssessmentValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AssessmentValidationError';
  }
}

export function scoreAssessment(answers) {
  if (!Array.isArray(answers) || answers.length !== ASSESSMENT_ITEMS.length) {
    throw new AssessmentValidationError('O teste exige exatamente 24 respostas.');
  }
  if (answers.some((answer) => !Number.isInteger(answer) || answer < 1 || answer > 4)) {
    throw new AssessmentValidationError('Cada resposta deve ser um número inteiro de 1 a 4.');
  }

  const raw = { D: 0, I: 0, S: 0, C: 0 };
  ASSESSMENT_ITEMS.forEach((item, index) => { raw[item.dimension] += answers[index]; });
  const intensity = Object.fromEntries(dimensions.map((dimension) => [
    dimension,
    Math.round(((raw[dimension] - 6) / 18) * 100)
  ]));
  const dimensionOrder = new Map(dimensions.map((dimension, index) => [dimension, index]));
  const ranking = [...dimensions].sort((left, right) =>
    raw[right] - raw[left] || dimensionOrder.get(left) - dimensionOrder.get(right)
  );
  const topScore = raw[ranking[0]];
  const dominant = ranking.filter((dimension) => raw[dimension] === topScore);

  return { raw, intensity, ranking, dominant, isTie: dominant.length > 1 };
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
