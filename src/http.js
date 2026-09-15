import { SubmissionError } from './services/assessments.js';

export function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
}

export function requestIp(request) {
  const forwarded = request.headers['x-forwarded-for'];
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0])?.trim() || request.socket?.remoteAddress || 'unknown';
}

export function handleApiError(response, error) {
  if (error instanceof SubmissionError) return sendJson(response, error.status, { error: error.code, message: error.message });
  console.error('Unhandled API error', error instanceof Error ? error.name : 'UnknownError');
  return sendJson(response, 500, { error: 'INTERNAL_ERROR', message: 'Não foi possível concluir a solicitação.' });
}
