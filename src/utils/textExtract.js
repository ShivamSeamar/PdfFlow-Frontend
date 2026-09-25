import { getPdfJsDoc } from './pdfRender.js';

// Detects every text run on a page and returns it as a box normalized to
// 0..1 of the page's width/height, so it can be positioned as an overlay at
// any display size and converted back to PDF points at save time. This is
// what powers "detect the text, then edit it": we find where the original
// text sits, mark it for redaction, and let the user edit the string,
// font, size, color, alignment and weight before it's redrawn.
export async function detectPageText(file, pageIndex) {
  const pdfjsLib = await import('pdfjs-dist');
  const pdf = await getPdfJsDoc(file);
  const page = await pdf.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale: 1 }); // 1pt == 1px, top-left origin
  const textContent = await page.getTextContent();
  const pageWidthPts = viewport.width;
  const pageHeightPts = viewport.height;

  const boxes = [];
  textContent.items.forEach((item, i) => {
    if (!item.str || !item.str.trim()) return;
    const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
    const fontHeight = Math.hypot(tx[2], tx[3]);
    if (fontHeight <= 0 || !item.width) return;

    const leftPts = tx[4];
    const topPts = tx[5] - fontHeight;
    const widthPts = Math.max(item.width, fontHeight * 0.6);
    const heightPts = fontHeight * 1.3;

    boxes.push({
      id: `p${pageIndex}-t${i}`,
      pageIndex,
      text: item.str,
      xNorm: leftPts / pageWidthPts,
      yNorm: topPts / pageHeightPts,
      widthNorm: widthPts / pageWidthPts,
      heightNorm: heightPts / pageHeightPts,
      fontSize: Math.max(8, Math.round(fontHeight)),
      color: '#141414',
      align: 'left',
      bold: /bold/i.test(item.fontName || ''),
      italic: /italic|oblique/i.test(item.fontName || ''),
      fontFamily: 'Helvetica',
      isOriginal: true,
    });
  });

  return { boxes, pageWidthPts, pageHeightPts };
}
