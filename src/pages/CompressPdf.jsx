import React, { useState } from "react";
import { Minimize2, Download, FileText } from "lucide-react";
import FileDropzone from "../components/FileDropzone.jsx";
import RenameModal from "../components/RenameModal.jsx";
import ToolHeader from "../components/ToolHeader.jsx";
import {
  compressToTargetSize,
  compressPdf,
  bytesToBlob,
  formatBytes,
} from "../utils/pdfHelpers.js";
import { downloadBlob } from "../utils/download.js";

const PRESETS = [
  {
    id: "low",
    label: "Low compression",
    desc: "Best quality, larger file",
    quality: 0.85,
    scale: 1.6,
  },
  {
    id: "medium",
    label: "Medium compression",
    desc: "Balanced",
    quality: 0.6,
    scale: 1.2,
  },
  {
    id: "high",
    label: "High compression",
    desc: "Smallest file, lower quality",
    quality: 0.35,
    scale: 0.8,
  },
];

export default function CompressPdf() {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("target"); // 'target' | 'preset'
  const [targetKb, setTargetKb] = useState(500);
  const [preset, setPreset] = useState("medium");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null); // { bytes, kb, achieved }
  const [modalOpen, setModalOpen] = useState(false);

  const targetUnit =
    targetKb >= 1024 * 1024 ? "GB" : targetKb >= 1024 ? "MB" : "KB";
  const targetValueForDisplay =
    targetUnit === "GB"
      ? Number((targetKb / (1024 * 1024)).toFixed(3))
      : targetUnit === "MB"
        ? Number((targetKb / 1024).toFixed(2))
        : Number(targetKb);

  const handleTargetValueChange = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return;

    if (targetUnit === "KB") {
      setTargetKb(parsed);
      return;
    }

    if (targetUnit === "MB") {
      setTargetKb(parsed * 1024);
      return;
    }

    setTargetKb(parsed * 1024 * 1024);
  };

  const handleFiles = (files) => {
    setFile(files[0]);
    setResult(null);
  };

  const runCompress = async () => {
    setProcessing(true);
    setProgress(null);
    try {
      if (mode === "target") {
        const res = await compressToTargetSize(
          file,
          Number(targetKb),
          (done, total) => setProgress({ done, total }),
        );
        setResult(res);
      } else {
        const p = PRESETS.find((p) => p.id === preset);
        const bytes = await compressPdf(
          file,
          p.quality,
          p.scale,
          (done, total) => setProgress({ done, total }),
        );
        setResult({ bytes, kb: bytes.byteLength / 1024, achieved: true });
      }
      setModalOpen(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmDownload = (name) => {
    downloadBlob(bytesToBlob(result.bytes), name, "pdf");
    setModalOpen(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <ToolHeader
        icon={Minimize2}
        title="Compress PDF"
        subtitle="Shrink your PDF to an exact size, or pick a quality preset."
      />

      {!file && (
        <FileDropzone
          accept="application/pdf"
          onFiles={handleFiles}
          label="Drop your PDF here"
        />
      )}

      {file && (
        <div className="card p-6">
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-base-700 bg-base-800 p-3">
            <FileText size={20} className="text-flame-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-200">
                {file.name}
              </p>
              <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-xs text-gray-500 hover:text-flame-400"
            >
              Change
            </button>
          </div>

          <div className="mb-5 flex gap-2 rounded-lg bg-base-800 p-1">
            <button
              onClick={() => setMode("target")}
              className={`flex-1 rounded-md py-2 text-sm font-semibold ${
                mode === "target" ? "bg-flame-500 text-white" : "text-gray-400"
              }`}
            >
              Target size (KB)
            </button>
            <button
              onClick={() => setMode("preset")}
              className={`flex-1 rounded-md py-2 text-sm font-semibold ${
                mode === "preset" ? "bg-flame-500 text-white" : "text-gray-400"
              }`}
            >
              Quality preset
            </button>
          </div>

          {mode === "target" ? (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Target size in {targetUnit}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="50"
                  max={Math.max(200, Math.round(file.size / 1024))}
                  value={targetKb}
                  onChange={(e) => setTargetKb(Number(e.target.value))}
                  className="flex-1 accent-flame-500"
                />
                <input
                  type="number"
                  min="0"
                  step={targetUnit === "KB" ? 1 : 0.1}
                  value={targetValueForDisplay}
                  onChange={(e) => handleTargetValueChange(e.target.value)}
                  className="input-field w-28"
                />
                <span className="text-sm text-gray-500">{targetUnit}</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Current size: {formatBytes(file.size)}. PdfFlow will iteratively
                re-compress image content until it's at or under your target
                (best-effort — very text-only PDFs may not shrink much further).
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  className={`rounded-xl border-2 p-4 text-left transition ${
                    preset === p.id
                      ? "border-flame-500 bg-flame-500/5"
                      : "border-base-600 bg-base-800"
                  }`}
                >
                  <p className="text-sm font-bold text-gray-100">{p.label}</p>
                  <p className="mt-1 text-xs text-gray-500">{p.desc}</p>
                </button>
              ))}
            </div>
          )}

          {progress && (
            <p className="mt-4 text-xs text-gray-500">
              Processing page {progress.done} of {progress.total}…
            </p>
          )}

          <button
            onClick={runCompress}
            disabled={processing}
            className="btn-primary mt-6 w-full"
          >
            {processing ? "Compressing…" : "Compress PDF"}
          </button>

          {result && !modalOpen && (
            <div className="mt-4 rounded-lg border border-flame-500/30 bg-flame-500/5 p-4 text-sm">
              <p className="font-semibold text-flame-400">
                {result.achieved
                  ? "Target reached!"
                  : "Smallest possible size reached"}
              </p>
              <p className="mt-1 text-gray-400">
                New size: {formatBytes(result.kb * 1024)} (was{" "}
                {formatBytes(file.size)})
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="btn-secondary mt-3 text-sm"
              >
                <Download size={16} /> Download
              </button>
            </div>
          )}
        </div>
      )}

      <RenameModal
        open={modalOpen}
        defaultName={
          file ? file.name.replace(/\.pdf$/i, "") + "-compressed" : "compressed"
        }
        ext="pdf"
        sizeBytes={result?.bytes?.byteLength}
        onConfirm={handleConfirmDownload}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
