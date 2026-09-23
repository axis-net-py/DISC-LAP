import { z } from 'zod';
import { normalizePhone } from '../domain/phone.js';
import { scoreAssessment, buildProfile } from '../domain/assessment.js';
import { GROUP_COUNT } from '../content/questions.js';

const ipsativeGroup = z.array(z.number().int().min(1).max(4)).length(4);

const submissionSchema = z.object({
  idempotencyKey: z.string().min(8, 'idempotency inválida').max(100),
  name: z.string().trim().min(2, 'name deve ter ao menos 2 caracteres').max(120),
  phone: z.string().min(8, 'telefone inválido').max(40),
  country: z.enum(['BR', 'PY']),
  locale: z.enum(['pt-BR', 'es-PY']),
  consent: z.literal(true, { error: 'consent é obrigatório' }),
  answers: z.array(ipsativeGroup).length(GROUP_COUNT, `São necessários ${GROUP_COUNT} grupos`)
}).strict().superRefine((data, ctx) => {
  data.answers.forEach((group, groupIndex) => {
    if (new Set(group).size !== 4) {
      ctx.addIssue({
        code: 'custom',
        path: ['answers', groupIndex],
        message: `O grupo ${groupIndex + 1} deve usar 1, 2, 3 e 4 sem repetir`
      });
    }
  });
});

export class SubmissionError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'SubmissionError';
    this.code = code;
    this.status = status;
  }
}

function whatsappMessage(name, scores, profile, locale) {
  const values = ['D', 'I', 'S', 'C'].map((code) => `${code}: ${scores.composition[code]}%`).join(' · ');
  if (locale === 'es-PY') {
    return `Resultado DISC — Método LAP\n${name}\nPerfil principal: ${profile.primary.name}\nComposición: ${values}\n\nEste resultado describe tendencias conductuales y no es un diagnóstico psicológico.`;
  }
  return `Resultado DISC — Método LAP\n${name}\nPerfil principal: ${profile.primary.name}\nComposição: ${values}\n\nEste resultado descreve tendências comportamentais e não é um diagnóstico psicológico.`;
}

function publicResult(record) {
  return {
    id: record.id,
    participant: record.participant,
    scores: record.scores,
    profile: record.profile,
    whatsappUrl: record.whatsappUrl,
    completedAt: record.completedAt
  };
}

export function createAssessmentService({ repository, limiter = { consume: () => true } }) {
  if (!repository) throw new TypeError('repository is required');
  return {
    async submit(input, context = {}) {
      if (!limiter.consume(context.clientKey ?? 'anonymous')) {
        throw new SubmissionError('RATE_LIMITED', 'Muitas tentativas. Aguarde antes de tentar novamente.', 429);
      }
      const parsed = submissionSchema.safeParse(input);
      if (!parsed.success) {
        throw new SubmissionError('INVALID_SUBMISSION', parsed.error.issues.map((issue) => issue.message).join('; '));
      }

      const existing = await repository.findByIdempotencyKey(parsed.data.idempotencyKey);
      if (existing) return publicResult(existing);

      let phone;
      try {
        phone = normalizePhone(parsed.data.phone, parsed.data.country);
      } catch (error) {
        throw new SubmissionError('INVALID_PHONE', `telefone inválido: ${error.message}`);
      }
      const scores = scoreAssessment(parsed.data.answers);
      const profile = buildProfile(scores, parsed.data.locale);
      const text = whatsappMessage(parsed.data.name, scores, profile, parsed.data.locale);
      const whatsappUrl = `https://wa.me/${phone.digits}?text=${encodeURIComponent(text)}`;
      const record = await repository.insert({
        idempotencyKey: parsed.data.idempotencyKey,
        participant: { name: parsed.data.name, phone: phone.e164, country: phone.country },
        locale: parsed.data.locale,
        consentAt: new Date().toISOString(),
        scores,
        profile,
        whatsappUrl
      });
      return publicResult(record);
    }
  };
}
