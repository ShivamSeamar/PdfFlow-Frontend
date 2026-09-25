import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

// Reusable dropzone + "browse your file manager" button.
// Props: accept, multiple, onFiles(fileList), label, hint
export default function FileDropzone({ accept, multiple = false, onFiles, label, hint }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length) onFiles(files);
  };

  return (
    <div
      className={`dropzone ${dragOver ? 'border-flame-500 bg-flame-500/5' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-flame-500/10 text-flame-400">
        <UploadCloud size={28} />
      </div>
      <p className="text-base font-semibold text-gray-100">{label || 'Drag & drop your file here'}</p>
      <p className="text-sm text-gray-500">{hint || 'or click to browse your file manager'}</p>
      <span className="btn-primary mt-2 text-sm">Choose file{multiple ? 's' : ''}</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
