const BUCKET = 'prior-auth-documents';

function getStorageConfig() {
  const projectUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!projectUrl || !serviceKey) {
    throw new Error('SUPABASE_URL and the server-only SUPABASE_SERVICE_ROLE_KEY are required for document storage.');
  }
  return { baseUrl: projectUrl.replace(/\/$/, ''), serviceKey };
}

function objectUrl(baseUrl: string, objectPath: string) {
  const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
  return `${baseUrl}/storage/v1/object/${BUCKET}/${encodedPath}`;
}

export async function storeDocument(objectPath: string, content: Buffer, contentType: string): Promise<string> {
  const { baseUrl, serviceKey } = getStorageConfig();
  const response = await fetch(objectUrl(baseUrl, objectPath), {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': contentType,
      'x-upsert': 'false',
    },
    body: content,
  });
  if (!response.ok) throw new Error(`Supabase Storage upload failed (${response.status}).`);
  return `supabase://${BUCKET}/${objectPath}`;
}

export async function downloadDocument(objectPath: string): Promise<Buffer> {
  const { baseUrl, serviceKey } = getStorageConfig();
  const response = await fetch(objectUrl(baseUrl, objectPath), {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  if (!response.ok) throw new Error(`Supabase Storage download failed (${response.status}).`);
  return Buffer.from(await response.arrayBuffer());
}

export async function removeDocument(objectPath: string): Promise<void> {
  const { baseUrl, serviceKey } = getStorageConfig();
  const response = await fetch(`${baseUrl}/storage/v1/object/${BUCKET}`, {
    method: 'DELETE',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefixes: [objectPath] }),
  });
  if (!response.ok) throw new Error(`Supabase Storage delete failed (${response.status}).`);
}

export function storageObjectPath(filePath: string): string | null {
  const prefix = `supabase://${BUCKET}/`;
  return filePath.startsWith(prefix) ? filePath.slice(prefix.length) : null;
}
