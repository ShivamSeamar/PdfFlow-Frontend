import React, { useState } from 'react';
import { Combine, GripVertical, X, FileText } from 'lucide-react';
import FileDropzone from '../components/FileDropzone.jsx';
import RenameModal from '../components/RenameModal.jsx';
import ToolHeader from '../components/ToolHeader.jsx';
import { mergePdfs, bytesToBlob, formatBytes } from '../utils/pdfHelpers.js';
import { downloadBlob } from '../utils/download.js';

export default function CombinePdf() {
  const [files, setFiles] = useState([]); // { file, id }
  const [processing, setProcessing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [resultBytes, setResultBytes] = useState(null);
  const [dragIdx, setDragIdx] = useState(null);

  const handleFiles = (newFiles) => {
    const items = newFiles
      .filter((f) => f.type === 'application/pdf')
      .map((f) => ({ file: f, id: crypto.randomUUID() }));
    setFiles((prev) => [...prev, ...items]);
  };

  const removeFile = (id) => setFiles((prev) => prev.filter((i) => i.id !== id));
  const onDrop = (idx) => {
    if (dragIdx === null || dragIdx === idx) return;
    setFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragIdx(null);
  };

  const runMerge = async () => {
    setProcessing(true);
    try {
      const bytes = await mergePdfs(files.map((f) => f.file));
      setResultBytes(bytes);
      setModalOpen(true);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <ToolHeader icon={Combine} title="Combine PDF" subtitle="Merge multiple PDFs into one — drag to set the order." />

      <FileDropzone accept="application/pdf" multiple onFiles={handleFiles} label="Drop PDFs here" hint="or browse to select multiple files" />

      {files.length > 0 && (
        <div className="card mt-6 p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {files.length} file(s) — drag to reorder
          </p>
          <div className="space-y-2">
            {files.map((item, idx) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(idx)}
                className="flex items-center gap-3 rounded-lg border border-base-700 bg-base-800 px-4 py-3"
              >
                <GripVertical size={16} className="cursor-grab text-gray-500" />
                <FileText size={18} className="text-flame-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-200">{item.file.name}</p>
                  <p className="text-xs text-gray-500">{formatBytes(item.file.size)}</p>
                </div>
                <span className="text-xs text-gray-500">#{idx + 1}</span>
                <button onClick={() => removeFile(item.id)} className="text-gray-500 hover:text-red-400">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <button onClick={runMerge} disabled={processing || files.length < 2} className="btn-primary mt-6 w-full">
            {processing ? 'Merging…' : files.length < 2 ? 'Add at least 2 PDFs' : `Merge ${files.length} PDFs`}
          </button>
        </div>
      )}

      <RenameModal
        open={modalOpen}
        defaultName="combined-document"
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
