import React, { useState } from 'react';
import { FileText, AlertTriangle } from 'lucide-react';
import FileDropzone from '../components/FileDropzone.jsx';
import RenameModal from '../components/RenameModal.jsx';
import ToolHeader from '../components/ToolHeader.jsx';
import { convertFile } from '../utils/api.js';
import { downloadBlob } from '../utils/download.js';

export default function PdfToWord() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleFiles = (files) => {
    setFile(files[0]);
    setError(null);
    setResultBlob(null);
  };

  const runConvert = async () => {
    setProcessing(true);
    setError(null);
    try {
      const blob = await convertFile('/convert/pdf-to-word', file);
      setResultBlob(blob);
      setModalOpen(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <ToolHeader icon={FileText} title="PDF to Word" subtitle="Convert a PDF into an editable Word (.docx) document." />

      <div className="mb-6 flex gap-3 rounded-xl border border-flame-500/30 bg-flame-500/5 p-4 text-sm text-gray-300">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-flame-400" />
        <p>
          This conversion runs on the PdfFlow server (LibreOffice-powered) rather than in the browser,
          since reconstructing editable Word paragraphs needs real document-layout analysis. Make sure
          the backend is running with LibreOffice installed — see{' '}
          <code className="rounded bg-base-800 px-1">backend/routes/convert.js</code>.
        </p>
      </div>

      {!file && <FileDropzone accept="application/pdf" onFiles={handleFiles} label="Drop your PDF here" />}

      {file && (
        <div className="card p-6">
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-base-700 bg-base-800 p-3">
            <FileText size={20} className="text-flame-400" />
            <p className="truncate text-sm font-semibold text-gray-200">{file.name}</p>
            <button onClick={() => setFile(null)} className="ml-auto text-xs text-gray-500 hover:text-flame-400">
              Change
            </button>
          </div>

          <button onClick={runConvert} disabled={processing} className="btn-primary w-full">
            {processing ? 'Converting…' : 'Convert to Word'}
          </button>

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>
      )}

      <RenameModal
        open={modalOpen}
        defaultName={file ? file.name.replace(/\.pdf$/i, '') : 'document'}
        ext="docx"
        sizeBytes={resultBlob?.size}
        onConfirm={(name) => {
          downloadBlob(resultBlob, name, 'docx');
          setModalOpen(false);
        }}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
