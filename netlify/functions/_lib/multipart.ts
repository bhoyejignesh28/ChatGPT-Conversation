import Busboy from 'busboy';
import type { HandlerEvent } from '@netlify/functions';

export interface UploadedFile {
  fieldname: string;
  filename: string;
  mimetype: string;
  encoding: string;
  data: Buffer;
}

export async function parseMultipart(event: HandlerEvent): Promise<{ fields: Record<string, string>; files: UploadedFile[] }> {
  return new Promise((resolve, reject) => {
    const fields: Record<string, string> = {};
    const files: UploadedFile[] = [];
    const bb = Busboy({ headers: event.headers as any });
    bb.on('file', (fieldname, file, filename, encoding, mimetype) => {
      const chunks: Buffer[] = [];
      file.on('data', (data) => chunks.push(data));
      file.on('end', () => {
        files.push({ fieldname, filename, mimetype, encoding, data: Buffer.concat(chunks) });
      });
    });
    bb.on('field', (name, value) => {
      fields[name] = value;
    });
    bb.on('error', reject);
    bb.on('finish', () => resolve({ fields, files }));
    const body = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64')
      : Buffer.from(event.body || '', 'utf8');
    bb.end(body);
  });
}

