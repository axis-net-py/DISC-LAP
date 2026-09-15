import { readConfig } from '../src/config.js';
import { getPool, createAssessmentRepository } from '../src/db.js';
import { createAssessmentService } from '../src/services/assessments.js';
import { createFixedWindowLimiter } from '../src/rate-limit.js';
import { handleApiError, requestIp, sendJson } from '../src/http.js';

const limiter = createFixedWindowLimiter();

export default async function handler(request, response) {
  if (request.method !== 'POST') return sendJson(response, 405, { error: 'METHOD_NOT_ALLOWED' });
  const contentLength = Number(request.headers['content-length'] || 0);
  if (contentLength > 32_768) return sendJson(response, 413, { error: 'PAYLOAD_TOO_LARGE' });

  try {
    const config = readConfig(process.env);
    const repository = createAssessmentRepository(getPool(config.databaseUrl));
    const service = createAssessmentService({ repository, limiter });
    const result = await service.submit(request.body, { clientKey: requestIp(request) });
    return sendJson(response, 201, result);
  } catch (error) {
    return handleApiError(response, error);
  }
}
