import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { formatBytes } from '../utils/pdfHelpers';

// Generic "rename before download" modal used by every tool.
// Props: open, defaultName, ext, sizeBytes, onConfirm(name), onClose
export default function RenameModal({ open, defaultName, ext = 'pdf', sizeBytes, onConfirm, onClose }) {
  const [name, setName] = useState(defaultName || 'document');

  useEffect(() => {
    if (open) setName(defaultName || 'document');
  }, [open, defaultName]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Name your file</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          File name
        </label>
        <div className="flex items-center overflow-hidden rounded-lg border border-base-600 bg-base-800 focus-within:border-flame-500 focus-within:ring-1 focus-within:ring-flame-500">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onConfirm(name)}
            className="w-full bg-transparent px-3 py-2.5 text-sm text-gray-100 outline-none"
            placeholder="my-document"
          />
          <span className="px-3 text-sm text-gray-500">.{ext}</span>
        </div>

        {sizeBytes != null && (
          <p className="mt-2 text-xs text-gray-500">Output size: {formatBytes(sizeBytes)}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary text-sm">
            Cancel
          </button>
          <button onClick={() => onConfirm(name)} className="btn-primary text-sm">
            <Download size={16} /> Download
          </button>
        </div>
      </div>
    </div>
  );
}
