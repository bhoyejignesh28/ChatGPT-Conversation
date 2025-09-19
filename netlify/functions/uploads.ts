import type { Handler } from '@netlify/functions';
import { errorResponse, jsonResponse, getPathSegments } from './_lib/http.js';
import { getSession } from './_lib/auth.js';
import { parseMultipart } from './_lib/multipart.js';
import { setBlob, getSignedUrl } from './_lib/store.js';
import { updateUserProfile } from './_lib/users.js';

const handler: Handler = async (event) => {
  const method = event.httpMethod.toUpperCase();
  const segments = getPathSegments(event);
  const current = await getSession(event);
  if (!current) return errorResponse(401, 'Unauthorized');

  if (method === 'POST' && segments[0] === 'logo') {
    const { files } = await parseMultipart(event);
    const file = files.find((f) => f.fieldname === 'file');
    if (!file) return errorResponse(400, 'File missing.');
    if (!['image/png', 'image/jpeg'].includes(file.mimetype)) {
      return errorResponse(400, 'Unsupported file type.');
    }
    if (file.data.length > 3 * 1024 * 1024) {
      return errorResponse(400, 'File too large (max 3MB).');
    }
    const key = `uploads/logos/${current.id}`;
    await setBlob(key, file.data, file.mimetype);
    const url = await getSignedUrl(key, 60 * 60 * 24 * 30);
    await updateUserProfile(current.id, { logoUrl: url ?? undefined });
    return jsonResponse(200, { logoUrl: url });
  }

  return errorResponse(404, 'Not found');
};

export { handler as default };

