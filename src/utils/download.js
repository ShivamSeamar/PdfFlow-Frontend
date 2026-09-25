import { saveAs } from 'file-saver';

export function sanitizeFilename(name) {
  return name.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'document';
}

export function downloadBlob(blob, filename, ext) {
  const clean = sanitizeFilename(filename);
  const finalName = clean.toLowerCase().endsWith(`.${ext}`) ? clean : `${clean}.${ext}`;
  saveAs(blob, finalName);
}
