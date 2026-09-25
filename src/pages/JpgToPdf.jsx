import React, { useState } from 'react';
import { ImagePlus, GripVertical, X } from 'lucide-react';
import FileDropzone from '../components/FileDropzone.jsx';
import RenameModal from '../components/RenameModal.jsx';
import ToolHeader from '../components/ToolHeader.jsx';
import { imagesToPdf, bytesToBlob } from '../utils/pdfHelpers.js';
import { downloadBlob } from '../utils/download.js';

export default function JpgToPdf() {
  const [images, setImages] = useState([]); // { file, url, id }
  const [processing, setProcessing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [resultBytes, setResultBytes] = useState(null);
  const [dragIdx, setDragIdx] = useState(null);

  const handleFiles = (files) => {
    const items = files
      .filter((f) => f.type === 'image/jpeg' || f.type === 'image/jpg' || f.type === 'image/png')
      .map((f) => ({ file: f, url: URL.createObjectURL(f), id: crypto.randomUUID() }));
    setImages((prev) => [...prev, ...items]);
  };

  const removeImage = (id) => setImages((prev) => prev.filter((i) => i.id !== id));

  const onDragStart = (idx) => setDragIdx(idx);
  const onDrop = (idx) => {
    if (dragIdx === null || dragIdx === idx) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragIdx(null);
  };

  const runConvert = async () => {
    setProcessing(true);
    try {
      const bytes = await imagesToPdf(images.map((i) => i.file));
      setResultBytes(bytes);
      setModalOpen(true);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <ToolHeader icon={ImagePlus} title="JPG / JPEG to PDF" subtitle="Pick images from your file manager and turn them into one PDF." />

      <FileDropzone
        accept="image/jpeg,image/jpg,image/png"
        multiple
        onFiles={handleFiles}
        label="Drop JPG / JPEG images here"
        hint="or click to browse your file manager — select multiple images"
      />

      {images.length > 0 && (
        <div className="card mt-6 p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {images.length} image(s) — drag to reorder, they'll become PDF pages in this order
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img, idx) => (
              <div
                key={img.id}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(idx)}
                className="group relative overflow-hidden rounded-xl border-2 border-base-600 bg-base-800"
              >
                <img src={img.url} alt="" className="h-32 w-full object-cover" />
                <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-black/60 px-2 py-1">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-white">
                    <GripVertical size={12} /> {idx + 1}
                  </span>
                  <button onClick={() => removeImage(img.id)} className="text-white hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={runConvert} disabled={processing} className="btn-primary mt-6 w-full">
            {processing ? 'Converting…' : `Convert ${images.length} image(s) to PDF`}
          </button>
        </div>
      )}

      <RenameModal
        open={modalOpen}
        defaultName="images-to-pdf"
        ext="pdf"
        sizeBytes={resultBytes?.byteLength}
        onConfirm={(name) => {
          downloadBlob(bytesToBlob(resultBytes), name, 'pdf');
          setModalOpen(false);
        }}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
