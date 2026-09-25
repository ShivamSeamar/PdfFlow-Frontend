import React, { useEffect, useState } from 'react';
import { renderPageToDataUrl } from '../utils/pdfRender.js';

// A single lazily-rendered page thumbnail. Used by the left-hand rails in
// Edit, Split, and Organize & Crop.
export default function PdfPageThumb({ file, pageIndex, scale = 0.26, rotation = 0, className = '' }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let alive = true;
    setSrc(null);
    renderPageToDataUrl(file, pageIndex, scale).then((r) => {
      if (alive) setSrc(r.dataUrl);
    });
    return () => {
      alive = false;
    };
  }, [file, pageIndex, scale]);

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-base-700 text-[10px] text-gray-500 ${className}`}>
        …
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={`Page ${pageIndex + 1}`}
      draggable={false}
      className={`select-none object-contain transition-transform ${className}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    />
  );
}
