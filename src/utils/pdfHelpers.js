import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Read a File/Blob into an ArrayBuffer
export async function fileToArrayBuffer(file) {
  return await file.arrayBuffer();
}

// Load a pdf-lib PDFDocument from a File
export async function loadPdf(file) {
  const bytes = await fileToArrayBuffer(file);
  return PDFDocument.load(bytes, { ignoreEncryption: true });
}

// Get basic info (page count, sizes) for preview/thumbnail UI
export async function getPdfInfo(file) {
  const doc = await loadPdf(file);
  const pages = doc.getPages().map((p, i) => {
    const { width, height } = p.getSize();
    return { index: i, width, height };
  });
  return { pageCount: doc.getPageCount(), pages };
}

// Merge multiple PDF files into one, in the given order
export async function mergePdfs(files) {
  const merged = await PDFDocument.create();
  for (const file of files) {
    const src = await loadPdf(file);
    const copiedPages = await merged.copyPages(src, src.getPageIndices());
    copiedPages.forEach((p) => merged.addPage(p));
  }
  return merged.save();
}

// Split a PDF into individual page ranges. ranges = [[0,0],[1,3]] (0-indexed, inclusive)
export async function splitPdf(file, ranges) {
  const src = await loadPdf(file);
  const outputs = [];
  for (const [start, end] of ranges) {
    const newDoc = await PDFDocument.create();
    const indices = [];
    for (let i = start; i <= end; i++) indices.push(i);
    const pages = await newDoc.copyPages(src, indices);
    pages.forEach((p) => newDoc.addPage(p));
    outputs.push(await newDoc.save());
  }
  return outputs;
}

// Extract only selected page indices into a single new PDF (used by Organize)
export async function extractPages(file, keepIndices) {
  const src = await loadPdf(file);
  const newDoc = await PDFDocument.create();
  const pages = await newDoc.copyPages(src, keepIndices);
  pages.forEach((p) => newDoc.addPage(p));
  return newDoc.save();
}

// Reorder + rotate pages (Organize PDF). order = array of {index, rotation}
export async function organizePdf(file, order) {
  const src = await loadPdf(file);
  const newDoc = await PDFDocument.create();
  const indices = order.map((o) => o.index);
  const pages = await newDoc.copyPages(src, indices);
  pages.forEach((p, i) => {
    if (order[i].rotation) p.setRotation(degrees(order[i].rotation));
    newDoc.addPage(p);
  });
  return newDoc.save();
}

// Crop pages: box = {left, top, right, bottom} in points, applied to every page (or a given list)
export async function cropPdf(file, box, pageIndices = null) {
  const doc = await loadPdf(file);
  const pages = doc.getPages();
  const targets = pageIndices ? pageIndices.map((i) => pages[i]) : pages;
  targets.forEach((page) => {
    const { width, height } = page.getSize();
    const left = Number(box.left || 0);
    const top = Number(box.top || 0);
    const right = Number(box.right || 0);
    const bottom = Number(box.bottom || 0);

    page.setCropBox(
      left,
      bottom,
      Math.max(1, width - left - right),
      Math.max(1, height - top - bottom)
    );
  });
  return doc.save();
}

// Compress: downsamples embedded raster images by re-rendering pages at a lower
// resolution/quality via canvas, then rebuilding the PDF from JPEG snapshots.
// This trades text-selectability for a real, predictable size reduction —
// the same approach most "compress to target KB" tools use for image-heavy PDFs.
export async function compressPdf(file, quality = 0.6, scale = 1.0, onProgress) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

  const bytes = await fileToArrayBuffer(file);
  const loadingTask = pdfjsLib.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  const outDoc = await PDFDocument.create();

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
    const jpegBytes = await (await fetch(jpegDataUrl)).arrayBuffer();
    const jpegImage = await outDoc.embedJpg(jpegBytes);
    const newPage = outDoc.addPage([viewport.width, viewport.height]);
    newPage.drawImage(jpegImage, { x: 0, y: 0, width: viewport.width, height: viewport.height });
    if (onProgress) onProgress(i, pdf.numPages);
  }
  return outDoc.save();
}

// Try progressively lower quality/scale steps until under targetKb, or return the smallest achieved
export async function compressToTargetSize(file, targetKb, onProgress) {
  const steps = [
    { scale: 1.5, quality: 0.75 },
    { scale: 1.2, quality: 0.6 },
    { scale: 1.0, quality: 0.5 },
    { scale: 0.85, quality: 0.4 },
    { scale: 0.7, quality: 0.3 },
    { scale: 0.55, quality: 0.25 },
  ];
  let best = null;
  for (const step of steps) {
    const bytes = await compressPdf(file, step.quality, step.scale, onProgress);
    const kb = bytes.byteLength / 1024;
    if (!best || kb < best.kb) best = { bytes, kb };
    if (kb <= targetKb) return { bytes, kb, achieved: true };
  }
  return { ...best, achieved: false };
}

// Convert a set of image files (jpg/png) into one PDF, one image per page
export async function imagesToPdf(files) {
  const doc = await PDFDocument.create();
  for (const file of files) {
    const bytes = await fileToArrayBuffer(file);
    const isPng = file.type === 'image/png';
    const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    const page = doc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  return doc.save();
}

// Add simple text / rectangle annotations on top of a PDF (Edit PDF tool)
// edits = [{ pageIndex, type: 'text'|'rect'|'highlight', x, y, text, size, color }]
export async function applyEdits(file, edits) {
  const doc = await loadPdf(file);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();

  for (const edit of edits) {
    const page = pages[edit.pageIndex];
    if (!page) continue;
    const color = edit.color ? hexToRgb(edit.color) : rgb(1, 0.36, 0.04);
    if (edit.type === 'text') {
      page.drawText(edit.text || '', {
        x: edit.x,
        y: edit.y,
        size: edit.size || 16,
        font,
        color,
      });
    } else if (edit.type === 'rect') {
      page.drawRectangle({
        x: edit.x,
        y: edit.y,
        width: edit.width || 100,
        height: edit.height || 40,
        borderColor: color,
        borderWidth: 2,
      });
    } else if (edit.type === 'highlight') {
      page.drawRectangle({
        x: edit.x,
        y: edit.y,
        width: edit.width || 100,
        height: edit.height || 20,
        color,
        opacity: 0.35,
      });
    }
  }
  return doc.save();
}

// ---- Text-level "detect & edit" support (used by the Edit PDF tool) ----

export const FONT_FAMILIES = ['Helvetica', 'Times New Roman', 'Courier'];

function resolveStandardFont(family, bold, italic) {
  if (family === 'Times New Roman') {
    if (bold && italic) return StandardFonts.TimesRomanBoldItalic;
    if (bold) return StandardFonts.TimesRomanBold;
    if (italic) return StandardFonts.TimesRomanItalic;
    return StandardFonts.TimesRoman;
  }
  if (family === 'Courier') {
    if (bold && italic) return StandardFonts.CourierBoldOblique;
    if (bold) return StandardFonts.CourierBold;
    if (italic) return StandardFonts.CourierOblique;
    return StandardFonts.Courier;
  }
  // Helvetica default
  if (bold && italic) return StandardFonts.HelveticaBoldOblique;
  if (bold) return StandardFonts.HelveticaBold;
  if (italic) return StandardFonts.HelveticaOblique;
  return StandardFonts.Helvetica;
}

// Build the final PDF from per-page text boxes. Every box that came from
// detected original text is redacted (white rectangle) before the (possibly
// edited) text is redrawn on top, so edits actually replace the source glyphs
// rather than just overlaying them. Boxes the user added fresh are drawn
// with no redaction step.
// pageBoxesMap: { [pageIndex]: [{ xNorm, yNorm, widthNorm, heightNorm, text,
//   fontFamily, fontSize, color, align, bold, italic, isOriginal }] }
export async function buildEditedPdf(file, pageBoxesMap) {
  const doc = await loadPdf(file);
  const pages = doc.getPages();
  const fontCache = {};

  const getFont = async (family, bold, italic) => {
    const key = `${family}-${bold}-${italic}`;
    if (!fontCache[key]) {
      fontCache[key] = await doc.embedFont(resolveStandardFont(family, bold, italic));
    }
    return fontCache[key];
  };

  for (const [pageIndexStr, boxes] of Object.entries(pageBoxesMap)) {
    const pageIndex = Number(pageIndexStr);
    const page = pages[pageIndex];
    if (!page || !boxes?.length) continue;
    const { width: pdfW, height: pdfH } = page.getSize();

    for (const box of boxes) {
      const x = box.xNorm * pdfW;
      const boxW = box.widthNorm * pdfW;
      const boxH = box.heightNorm * pdfH;
      const top = box.yNorm * pdfH;
      const bottom = pdfH - top - boxH;

      if (box.isOriginal) {
        page.drawRectangle({ x: x - 1, y: bottom - 1, width: boxW + 2, height: boxH + 2, color: rgb(1, 1, 1) });
      }
      if (!box.text) continue;

      const font = await getFont(box.fontFamily || 'Helvetica', !!box.bold, !!box.italic);
      const size = box.fontSize || 14;
      const textWidth = font.widthOfTextAtSize(box.text, size);
      let textX = x;
      if (box.align === 'center') textX = x + (boxW - textWidth) / 2;
      else if (box.align === 'right') textX = x + boxW - textWidth;

      const textY = bottom + Math.max(0, (boxH - size) / 2) + size * 0.18;
      page.drawText(box.text, {
        x: textX,
        y: textY,
        size,
        font,
        color: box.color ? hexToRgb(box.color) : rgb(0.1, 0.1, 0.1),
      });
    }
  }

  return doc.save();
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return rgb(r, g, b);
}

async function getStandardFont(doc, family, bold, italic) {
  let std;
  if (family === 'Times') {
    std = bold && italic
      ? StandardFonts.TimesRomanBoldItalic
      : bold
        ? StandardFonts.TimesRomanBold
        : italic
          ? StandardFonts.TimesRomanItalic
          : StandardFonts.TimesRoman;
  } else if (family === 'Courier') {
    std = bold && italic
      ? StandardFonts.CourierBoldOblique
      : bold
        ? StandardFonts.CourierBold
        : italic
          ? StandardFonts.CourierOblique
          : StandardFonts.Courier;
  } else {
    std = bold && italic
      ? StandardFonts.HelveticaBoldOblique
      : bold
        ? StandardFonts.HelveticaBold
        : italic
          ? StandardFonts.HelveticaOblique
          : StandardFonts.Helvetica;
  }
  return doc.embedFont(std);
}

// Applies the Edit PDF tool's elements (detected text that was changed or
// deleted, plus any brand-new text/box/highlight elements) onto the ORIGINAL
// vector PDF — untouched text is left completely alone. Changed/deleted
// detected text gets a same-shape white rectangle drawn over it first
// (redaction), then, if it wasn't deleted, the new text is drawn on top in
// the chosen font/size/color/alignment.
export async function applyTextEdits(file, elements) {
  const doc = await loadPdf(file);
  const pages = doc.getPages();
  const fontCache = {};

  const getFont = async (family, bold, italic) => {
    const key = `${family}-${bold}-${italic}`;
    if (!fontCache[key]) fontCache[key] = await getStandardFont(doc, family, bold, italic);
    return fontCache[key];
  };

  for (const el of elements) {
    const page = pages[el.pageIndex];
    if (!page) continue;
    const { width: pageW, height: pageH } = page.getSize();
    const xPts = el.xNorm * pageW;
    const topPts = el.yNorm * pageH;
    const wPts = el.wNorm * pageW;
    const hPts = el.hNorm * pageH;
    const yBottom = pageH - topPts - hPts;

    if (el.kind === 'text') {
      const needsRedaction = el.source === 'detected' && (el.edited || el.deleted);
      if (needsRedaction) {
        page.drawRectangle({
          x: xPts - 1,
          y: yBottom - 1,
          width: wPts + 2,
          height: hPts + 2,
          color: rgb(1, 1, 1),
        });
      }
      const needsDraw = !el.deleted && (el.source === 'new' || el.edited);
      if (needsDraw) {
        const font = await getFont(el.fontFamily, el.bold, el.italic);
        const size = el.fontSize;
        const text = el.text || '';
        const textWidth = font.widthOfTextAtSize(text, size);
        let x = xPts;
        if (el.align === 'center') x = xPts + Math.max(0, (wPts - textWidth) / 2);
        else if (el.align === 'right') x = xPts + Math.max(0, wPts - textWidth);
        page.drawText(text, {
          x,
          y: yBottom + hPts * 0.18,
          size,
          font,
          color: hexToRgb(el.color),
        });
      }
    } else if (el.kind === 'rect') {
      page.drawRectangle({
        x: xPts,
        y: yBottom,
        width: wPts,
        height: hPts,
        borderColor: hexToRgb(el.color),
        borderWidth: 2,
      });
    } else if (el.kind === 'highlight') {
      page.drawRectangle({
        x: xPts,
        y: yBottom,
        width: wPts,
        height: hPts,
        color: hexToRgb(el.color),
        opacity: 0.35,
      });
    }
  }

  return doc.save();
}

// Crop each page individually (normalized 0..1 rects keyed by original page
// index) and reorder/rotate in one pass — used by the Organize & Crop tool.
export async function applyCropAndOrganize(file, order, cropMap) {
  const doc = await loadPdf(file);
  const pages = doc.getPages();

  Object.entries(cropMap || {}).forEach(([idxStr, rect]) => {
    const idx = Number(idxStr);
    const page = pages[idx];
    if (!page || !rect) return;
    const { width, height } = page.getSize();
    const left = rect.xNorm * width;
    const top = rect.yNorm * height;
    const cropW = Math.max(1, rect.wNorm * width);
    const cropH = Math.max(1, rect.hNorm * height);
    const bottom = height - top - cropH;
    page.setCropBox(left, bottom, cropW, cropH);
  });

  const newDoc = await PDFDocument.create();
  const indices = order.map((o) => o.index);
  const copied = await newDoc.copyPages(doc, indices);
  copied.forEach((p, i) => {
    if (order[i].rotation) p.setRotation(degrees(order[i].rotation));
    newDoc.addPage(p);
  });
  return newDoc.save();
}

export function bytesToBlob(bytes, mime = 'application/pdf') {
  return new Blob([bytes], { type: mime });
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = value >= 100 ? 0 : value >= 10 ? 1 : 2;

  return `${Number(value).toFixed(precision)} ${units[unitIndex]}`;
}
