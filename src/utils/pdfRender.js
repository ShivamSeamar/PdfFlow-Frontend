// Thin wrapper around pdfjs-dist for rasterizing pages, shared by the
// Edit / Split / Organize tools so a PDF is only parsed once per File and
// every page-preview looks identical across tools.

import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const pdfDocCache = new WeakMap();

async function getPdfjs() {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  return pdfjsLib;
}

export async function getPdfJsDoc(file) {
  if (pdfDocCache.has(file)) return pdfDocCache.get(file);
  const pdfjsLib = await getPdfjs();
  const bytes = await file.arrayBuffer();
  const promise = pdfjsLib.getDocument({ data: bytes }).promise;
  pdfDocCache.set(file, promise);
  return promise;
}

export async function getPageCount(file) {
  const pdf = await getPdfJsDoc(file);
  return pdf.numPages;
}

// Renders one page to a PNG data URL at `scale`. Also returns the true PDF
// page size in points (scale 1), needed to convert normalized (0..1) boxes
// back into PDF coordinates at save time.
export async function renderPageToDataUrl(file, pageIndex, scale = 0.3) {
  const pdf = await getPdfJsDoc(file);
  const page = await pdf.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;
  const unscaled = page.getViewport({ scale: 1 });
  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: viewport.width,
    height: viewport.height,
    pdfWidth: unscaled.width,
    pdfHeight: unscaled.height,
  };
}
