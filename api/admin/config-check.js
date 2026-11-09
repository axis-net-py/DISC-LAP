import { requireAdmin } from '../../src/admin-http.js';
import { sendJson } from '../../src/http.js';

export default async function handler(request, response) {
  try {
    const config = await requireAdmin(request);
    return sendJson(response, 200, { db: config.databaseUrl });
  } catch (err) {
    return sendJson(response, 401, { error: err.message });
  }
}
