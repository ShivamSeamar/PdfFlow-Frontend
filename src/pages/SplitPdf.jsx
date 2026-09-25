import React, { useState } from "react";
import {
  Scissors,
  Download,
  Package,
  CheckSquare,
  Square,
  Layers,
} from "lucide-react";
import FileDropzone from "../components/FileDropzone.jsx";
import RenameModal from "../components/RenameModal.jsx";
import ToolHeader from "../components/ToolHeader.jsx";
import { getPageCount, renderPageToDataUrl } from "../utils/pdfRender.js";
import { splitPdf, extractPages, bytesToBlob } from "../utils/pdfHelpers.js";
import { downloadBlob } from "../utils/download.js";

export default function SplitPdf() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbs, setThumbs] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeImg, setActiveImg] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [rangeText, setRangeText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [outputs, setOutputs] = useState(null);
  const [modalIndex, setModalIndex] = useState(null);

  const handleFiles = async (files) => {
    const f = files[0];
    setFile(f);
    setOutputs(null);
    setSelected(new Set());
    const count = await getPageCount(f);
    setPageCount(count);
    setRangeText(`1-${count}`);

    const { dataUrl } = await renderPageToDataUrl(f, 0, 1.4);
    setActiveIdx(0);
    setActiveImg(dataUrl);

    const thumbList = new Array(count).fill(null);
    setThumbs(thumbList);
    for (let i = 0; i < count; i++) {
      renderPageToDataUrl(f, i, 0.22).then(({ dataUrl }) => {
        setThumbs((prev) => {
          const next = [...prev];
          next[i] = dataUrl;
          return next;
        });
      });
    }
  };

  const openPage = async (idx) => {
    setActiveIdx(idx);
    const { dataUrl } = await renderPageToDataUrl(file, idx, 1.4);
    setActiveImg(dataUrl);
  };

  const toggleSelect = (idx) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const parseRanges = (text) => {
    const parts = text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const ranges = [];
    for (const part of parts) {
      if (part.includes("-")) {
        const [a, b] = part.split("-").map((n) => parseInt(n.trim(), 10));
        if (!isNaN(a) && !isNaN(b))
          ranges.push([Math.max(0, a - 1), Math.min(pageCount - 1, b - 1)]);
      } else {
        const n = parseInt(part, 10);
        if (!isNaN(n)) ranges.push([n - 1, n - 1]);
      }
    }
    return ranges;
  };

  const runSplitByRanges = async () => {
    setProcessing(true);
    try {
      const ranges = parseRanges(rangeText);
      const results = await splitPdf(file, ranges);
      const base = file.name.replace(/\.pdf$/i, "");
      setOutputs(
        results.map((bytes, i) => ({ name: `${base}-part-${i + 1}`, bytes })),
      );
    } finally {
      setProcessing(false);
    }
  };

  const runCollectSelected = async () => {
    if (selected.size === 0) return;
    setProcessing(true);
    try {
      const indices = [...selected].sort((a, b) => a - b);
      const bytes = await extractPages(file, indices);
      const base = file.name.replace(/\.pdf$/i, "");
      setOutputs([{ name: `${base}-selected-pages`, bytes }]);
    } finally {
      setProcessing(false);
    }
  };

  const downloadAll = () =>
    outputs.forEach((o) => downloadBlob(bytesToBlob(o.bytes), o.name, "pdf"));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ToolHeader
        icon={Scissors}
        title="Split PDF"
        subtitle="Tick pages to collect into one PDF, or type ranges to split into separate files."
      />

      {!file && (
        <FileDropzone
          accept="application/pdf"
          onFiles={handleFiles}
          label="Drop your PDF here"
        />
      )}

      {file && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr]">
          {/* Left: small previews with select checkboxes */}
          <div className="order-2 lg:order-none">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {pageCount} page(s)
            </p>
            <div
              className="flex gap-2 overflow-x-auto pr-1 lg:flex-col lg:gap-3 lg:overflow-y-auto lg:pr-2"
              style={{ maxHeight: "calc(100vh - 16rem)" }}
            >
              {thumbs.map((src, idx) => (
                <div
                  key={idx}
                  className={`shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 ${
                    activeIdx === idx ? "border-flame-500" : "border-base-700"
                  }`}
                >
                  <div className="relative" onClick={() => openPage(idx)}>
                    {src ? (
                      <img
                        src={src}
                        alt={`Page ${idx + 1}`}
                        className="w-20 lg:w-full"
                      />
                    ) : (
                      <div className="flex h-24 w-20 items-center justify-center bg-base-800 text-[10px] text-gray-600 lg:w-full">
                        …
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(idx);
                      }}
                      className="absolute right-1 top-1 rounded bg-base-950/80 p-0.5 text-flame-400"
                    >
                      {selected.has(idx) ? (
                        <CheckSquare size={16} />
                      ) : (
                        <Square size={16} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                  <span className="block bg-base-800 py-0.5 text-center text-[10px] text-gray-400">
                    {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: full preview + controls */}
          <div className="order-1 lg:order-none">
            <div className="card mb-4 overflow-hidden p-3">
              {activeImg ? (
                <img
                  src={activeImg}
                  alt={`Page ${activeIdx + 1}`}
                  className="mx-auto max-h-[70vh] w-auto"
                />
              ) : (
                <div className="p-16 text-center text-sm text-gray-500">
                  Loading…
                </div>
              )}
            </div>

            <div className="card grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-gray-200">
                  <Layers size={16} className="text-flame-400" /> Collect
                  selected pages
                </p>
                <p className="mb-3 text-xs text-gray-500">
                  {selected.size} page(s) ticked on the left will be combined,
                  in page order, into a single PDF.
                </p>
                <button
                  onClick={runCollectSelected}
                  disabled={processing || selected.size === 0}
                  className="btn-primary w-full text-sm"
                >
                  {processing
                    ? "Working…"
                    : `Collect ${selected.size || ""} page(s)`}
                </button>
              </div>

              <div>
                <p className="mb-2 text-sm font-bold text-gray-200">
                  Split by ranges
                </p>
                <input
                  value={rangeText}
                  onChange={(e) => setRangeText(e.target.value)}
                  className="input-field mb-3"
                  placeholder="1-3, 5, 8-10"
                />
                <button
                  onClick={runSplitByRanges}
                  disabled={processing}
                  className="btn-secondary w-full text-sm"
                >
                  {processing ? "Working…" : "Split into separate files"}
                </button>
              </div>
            </div>

            {outputs && (
              <div className="card mt-4 p-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-300">
                    {outputs.length} file(s) ready
                  </p>
                  {outputs.length > 1 && (
                    <button
                      onClick={downloadAll}
                      className="btn-secondary text-xs"
                    >
                      <Package size={14} /> Download all
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {outputs.map((o, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-base-700 bg-base-800 px-4 py-2.5"
                    >
                      <span className="text-sm text-gray-300">
                        {o.name}.pdf
                      </span>
                      <button
                        onClick={() => setModalIndex(i)}
                        className="text-flame-400 hover:text-flame-300"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <RenameModal
        open={modalIndex !== null}
        defaultName={outputs?.[modalIndex]?.name}
        ext="pdf"
        sizeBytes={outputs?.[modalIndex]?.bytes?.byteLength}
        onConfirm={(name) => {
          downloadBlob(bytesToBlob(outputs[modalIndex].bytes), name, "pdf");
          setModalIndex(null);
        }}
        onClose={() => setModalIndex(null)}
      />
    </div>
  );
}
