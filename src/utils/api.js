// Thin wrapper around the backend conversion/protection endpoints.
// In dev, Vite proxies /api -> http://localhost:5000 (see vite.config.js).
export async function convertFile(endpoint, file, extraFields = {}) {
  const form = new FormData();
  form.append('file', file);
  Object.entries(extraFields).forEach(([k, v]) => form.append(k, v));

  const res = await fetch(`/api${endpoint}`, { method: 'POST', body: form });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.blob();
}
