import React, { useState } from 'react';
import { Lock, Unlock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import FileDropzone from '../components/FileDropzone.jsx';
import RenameModal from '../components/RenameModal.jsx';
import ToolHeader from '../components/ToolHeader.jsx';
import { convertFile } from '../utils/api.js';
import { downloadBlob } from '../utils/download.js';

export default function ProtectUnlockPdf() {
  const [mode, setMode] = useState('protect'); // 'protect' | 'unlock'
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleFiles = (files) => {
    setFile(files[0]);
    setError(null);
    setResultBlob(null);
  };

  const canSubmit =
    file && password.length >= 4 && (mode === 'unlock' || password === confirmPassword);

  const run = async () => {
    setProcessing(true);
    setError(null);
    try {
      const blob = await convertFile(`/${mode}`, file, { password });
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
      <ToolHeader
        icon={mode === 'protect' ? Lock : Unlock}
        title="Protect & Unlock PDF"
        subtitle="Add a password to a PDF, or remove one you already know."
      />

      <div className="mb-6 flex gap-2 rounded-lg bg-base-800 p-1">
        <button
          onClick={() => {
            setMode('protect');
            setError(null);
          }}
          className={`flex-1 rounded-md py-2 text-sm font-semibold ${mode === 'protect' ? 'bg-flame-500 text-white' : 'text-gray-400'}`}
        >
          <Lock size={14} className="mr-1.5 inline" /> Protect
        </button>
        <button
          onClick={() => {
            setMode('unlock');
            setError(null);
          }}
          className={`flex-1 rounded-md py-2 text-sm font-semibold ${mode === 'unlock' ? 'bg-flame-500 text-white' : 'text-gray-400'}`}
        >
          <Unlock size={14} className="mr-1.5 inline" /> Unlock
        </button>
      </div>

      <div className="mb-6 flex gap-3 rounded-xl border border-flame-500/30 bg-flame-500/5 p-4 text-sm text-gray-300">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-flame-400" />
        <p>
          Real PDF encryption is applied server-side using <code className="rounded bg-base-800 px-1">qpdf</code>
          {' '}(AES-256), since pdf-lib alone can't produce standards-compliant encrypted PDFs. Make sure
          the backend is running with qpdf installed.
        </p>
      </div>

      {!file && <FileDropzone accept="application/pdf" onFiles={handleFiles} label="Drop your PDF here" />}

      {file && (
        <div className="card p-6">
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-base-700 bg-base-800 p-3">
            <p className="truncate text-sm font-semibold text-gray-200">{file.name}</p>
            <button onClick={() => setFile(null)} className="ml-auto text-xs text-gray-500 hover:text-flame-400">
              Change
            </button>
          </div>

          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            {mode === 'protect' ? 'New password' : 'PDF password'}
          </label>
          <div className="relative mb-4">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pr-10"
              placeholder="At least 4 characters"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {mode === 'protect' && (
            <>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Confirm password
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field mb-4"
              />
            </>
          )}

          <button onClick={run} disabled={!canSubmit || processing} className="btn-primary w-full">
            {processing ? 'Working…' : mode === 'protect' ? 'Protect PDF' : 'Unlock PDF'}
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
        defaultName={
          file ? file.name.replace(/\.pdf$/i, '') + (mode === 'protect' ? '-protected' : '-unlocked') : 'document'
        }
        ext="pdf"
        sizeBytes={resultBlob?.size}
        onConfirm={(name) => {
          downloadBlob(resultBlob, name, 'pdf');
          setModalOpen(false);
        }}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
