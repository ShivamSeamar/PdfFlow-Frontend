import React, { useState, useRef, useEffect } from "react";
import {
  LayoutGrid,
  RotateCw,
  Trash2,
  GripVertical,
  RefreshCcw,
} from "lucide-react";
import FileDropzone from "../components/FileDropzone.jsx";
import RenameModal from "../components/RenameModal.jsx";
import ToolHeader from "../components/ToolHeader.jsx";
import { getPageCount, renderPageToDataUrl } from "../utils/pdfRender.js";
import { organizePdf, cropPdf, bytesToBlob } from "../utils/pdfHelpers.js";
import { downloadBlob } from "../utils/download.js";

const FULL_CROP = { left: 0, top: 0, right: 0, bottom: 0 };

const clampCropValue = (value) =>
  Math.min(100, Math.max(0, Number(value || 0)));

export default function OrganizeCropPdf() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]); // { index, rotation }
  const [thumbs, setThumbs] = useState([]);
  const [activePos, setActivePos] = useState(0); // position in `pages` array
  const [activeImg, setActiveImg] = useState(null);
  const [pdfDims, setPdfDims] = useState({ w: 1, h: 1 });
  const [dragIdx, setDragIdx] = useState(null);
  const [crop, setCrop] = useState(FULL_CROP);
  const [applyToAll, setApplyToAll] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resultBytes, setResultBytes] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const stageRef = useRef(null);
  const drawing = useRef(null);

  const persistCurrentCrop = (nextCrop = crop) => {
    setPages((prev) =>
      prev.map((page, index) =>
        index === activePos ? { ...page, crop: nextCrop } : page,
      ),
    );
    setCrop(nextCrop);
  };

  const handleFiles = async (files) => {
    const f = files[0];
    setFile(f);
    const count = await getPageCount(f);
    setPages(
      Array.from({ length: count }, (_, i) => ({
        index: i,
        rotation: 0,
        crop: FULL_CROP,
      })),
    );
    setResultBytes(null);
    setCrop(FULL_CROP);

    await openPreview(f, 0);

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

  const openPreview = async (f, pageIndex) => {
    const { dataUrl, pdfWidth, pdfHeight } = await renderPageToDataUrl(
      f,
      pageIndex,
      1.5,
    );
    setActiveImg(dataUrl);
    setPdfDims({ w: pdfWidth, h: pdfHeight });
  };

  const selectPos = async (pos) => {
    if (pages[activePos]) {
      persistCurrentCrop(crop);
    }
    setActivePos(pos);
    const nextCrop = pages[pos]?.crop || FULL_CROP;
    setCrop(nextCrop);
    await openPreview(file, pages[pos].index);
  };

  const rotate = (pos) =>
    setPages((prev) =>
      prev.map((p, i) =>
        i === pos ? { ...p, rotation: (p.rotation + 90) % 360 } : p,
      ),
    );

  const remove = (pos) => {
    setPages((prev) => prev.filter((_, i) => i !== pos));
    if (pos === activePos) setActivePos(0);
  };

  const onDrop = (pos) => {
    if (dragIdx === null || dragIdx === pos) return;
    setPages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(pos, 0, moved);
      return next;
    });
    setDragIdx(null);
  };

  // --- drag-to-crop on the right-hand full preview ---
  const posFromEvent = (e) => {
    const rect = stageRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    return { x, y };
  };

  const onMouseDown = (e) => {
    const p = posFromEvent(e);
    drawing.current = { startX: p.x, startY: p.y };
    const nextCrop = {
      left: p.x * 100,
      top: p.y * 100,
      right: 100 - p.x * 100,
      bottom: 100 - p.y * 100,
    };
    persistCurrentCrop(nextCrop);
  };

  const onMouseMove = (e) => {
    if (!drawing.current) return;
    const p = posFromEvent(e);
    const { startX, startY } = drawing.current;
    const left = Math.min(startX, p.x) * 100;
    const top = Math.min(startY, p.y) * 100;
    const right = (1 - Math.max(startX, p.x)) * 100;
    const bottom = (1 - Math.max(startY, p.y)) * 100;
    persistCurrentCrop({ left, top, right, bottom });
  };

  const onMouseUp = () => {
    drawing.current = null;
  };

  const updateCropField = (field, value) => {
    const nextValue = clampCropValue(value);
    const next = { ...crop, [field]: nextValue };
    const usedWidth = 100 - next.left - next.right;
    const usedHeight = 100 - next.top - next.bottom;

    if (usedWidth < 5) {
      if (field === "left") next.right = Math.max(0, 95 - next.left);
      if (field === "right") next.left = Math.max(0, 95 - next.right);
    }

    if (usedHeight < 5) {
      if (field === "top") next.bottom = Math.max(0, 95 - next.top);
      if (field === "bottom") next.top = Math.max(0, 95 - next.bottom);
    }

    persistCurrentCrop(next);
  };

  const resetCrop = () => persistCurrentCrop(FULL_CROP);

  const saveCurrentPage = async () => {
    if (!pages[activePos]) return;
    const currentCrop = pages[activePos]?.crop || crop;
    const cropArea = {
      left: (currentCrop.left / 100) * pdfDims.w,
      top: (currentCrop.top / 100) * pdfDims.h,
      right: (currentCrop.right / 100) * pdfDims.w,
      bottom: (currentCrop.bottom / 100) * pdfDims.h,
    };

    const hasCrop =
      currentCrop.left > 0 ||
      currentCrop.top > 0 ||
      currentCrop.right > 0 ||
      currentCrop.bottom > 0;

    let sourceFile = file;
    if (hasCrop) {
      const targetIndices = applyToAll ? null : [pages[activePos].index];
      const croppedBytes = await cropPdf(file, cropArea, targetIndices);
      sourceFile = new File([croppedBytes], file.name, {
        type: "application/pdf",
      });
    }

    const bytes = await organizePdf(sourceFile, pages);
    setResultBytes(bytes);
    return bytes;
  };

  const runSave = async () => {
    setProcessing(true);
    try {
      await saveCurrentPage();
    } finally {
      setProcessing(false);
    }
  };

  const activeRotation = pages[activePos]?.rotation || 0;
  const selectionLeft = Math.min(crop.left, 100 - crop.right);
  const selectionTop = Math.min(crop.top, 100 - crop.bottom);
  const selectionWidth = Math.max(0, 100 - crop.left - crop.right);
  const selectionHeight = Math.max(0, 100 - crop.top - crop.bottom);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ToolHeader
        icon={LayoutGrid}
        title="Organize & Crop PDF"
        subtitle="Reorder, rotate and delete pages on the left. Drag on the preview to crop the active page."
      />

      {!file && (
        <FileDropzone
          accept="application/pdf"
          onFiles={handleFiles}
          label="Drop your PDF here"
        />
      )}

      {file && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
          {/* Left: reorder / rotate / delete */}
          <div className="order-2 lg:order-none">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {pages.length} page(s) — drag to reorder
            </p>
            <div
              className="flex gap-3 overflow-x-auto pr-1 lg:flex-col lg:gap-3 lg:overflow-y-auto lg:pr-2"
              style={{ maxHeight: "calc(100vh - 16rem)" }}
            >
              {pages.map((p, pos) => (
                <div
                  key={p.index}
                  draggable
                  onDragStart={() => setDragIdx(pos)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(pos)}
                  onClick={() => selectPos(pos)}
                  className={`page-thumb shrink-0 ${activePos === pos ? "selected" : ""}`}
                  style={{ width: 120 }}
                >
                  <span className="absolute left-2 top-2 rounded bg-base-950/80 px-1.5 py-0.5 text-[10px] font-medium text-gray-200">
                    {pos + 1}
                  </span>
                  {thumbs[p.index] ? (
                    <img
                      src={thumbs[p.index]}
                      alt=""
                      className="h-28 w-full rounded bg-base-700 object-contain transition-transform"
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                    />
                  ) : (
                    <div className="flex h-28 w-full items-center justify-center rounded bg-base-700 text-[10px] text-gray-500">
                      …
                    </div>
                  )}
                  <div className="flex w-full items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        rotate(pos);
                      }}
                      className="text-gray-400 hover:text-flame-400"
                    >
                      <RotateCw size={14} />
                    </button>
                    <GripVertical
                      size={14}
                      className="cursor-grab text-gray-600"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(pos);
                      }}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: full preview + crop */}
          <div className="order-1 lg:order-none">
            <div className="card p-3">
              {activeImg ? (
                <div
                  ref={stageRef}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={onMouseUp}
                  className="relative mx-auto max-h-[70vh] w-fit cursor-crosshair select-none overflow-hidden"
                >
                  <img
                    src={activeImg}
                    alt=""
                    draggable={false}
                    className="max-h-[70vh] w-auto select-none transition-transform"
                    style={{ transform: `rotate(${activeRotation}deg)` }}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-black/55"
                    style={{
                      clipPath: `polygon(0 0, 100% 0, 100% ${selectionTop}%, ${selectionLeft}% ${selectionTop}%, ${selectionLeft}% ${selectionTop + selectionHeight}%, 100% ${selectionTop + selectionHeight}%, 100% 100%, 0 100%, 0 0, 0 0)`,
                    }}
                  />
                  <div
                    className="pointer-events-none absolute border-2 border-flame-500 bg-flame-500/10"
                    style={{
                      left: `${selectionLeft}%`,
                      top: `${selectionTop}%`,
                      width: `${selectionWidth}%`,
                      height: `${selectionHeight}%`,
                    }}
                  />
                </div>
              ) : (
                <div className="p-16 text-center text-sm text-gray-500">
                  Loading…
                </div>
              )}
            </div>

            <div className="card mt-4 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={applyToAll}
                    onChange={(e) => setApplyToAll(e.target.checked)}
                    className="h-4 w-4 accent-flame-500"
                  />
                  Apply this crop to all pages
                </label>
                <button onClick={resetCrop} className="btn-secondary text-xs">
                  <RefreshCcw size={14} /> Reset crop
                </button>
                <button
                  onClick={() => {
                    persistCurrentCrop(crop);
                    runSave();
                  }}
                  disabled={processing}
                  className="btn-secondary text-xs"
                >
                  Save page
                </button>
                <button
                  onClick={runSave}
                  disabled={processing}
                  className="btn-primary ml-auto text-sm"
                >
                  {processing ? "Saving…" : "Save changes"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { key: "left", label: "Left" },
                  { key: "top", label: "Top" },
                  { key: "right", label: "Right" },
                  { key: "bottom", label: "Bottom" },
                ].map(({ key, label }) => (
                  <label key={key} className="block text-xs text-gray-400">
                    <span className="mb-1 block">{label} (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={Math.round(crop[key])}
                      onChange={(e) => updateCropField(key, e.target.value)}
                      className="input-field"
                    />
                  </label>
                ))}
              </div>
            </div>

            {resultBytes && (
              <div className="card mt-4 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-200">
                      Cropped PDF ready
                    </p>
                    <p className="text-xs text-gray-500">
                      {file
                        ? file.name.replace(/\.pdf$/i, "") + "-cropped.pdf"
                        : "cropped-result.pdf"}
                    </p>
                  </div>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="btn-secondary text-xs"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            )}

            <p className="mt-2 text-xs text-gray-500">
              Drag on the preview to crop the visible area, or enter precise
              left, top, right and bottom values in percent.
            </p>
          </div>
        </div>
      )}

      <RenameModal
        open={modalOpen}
        defaultName={
          file ? file.name.replace(/\.pdf$/i, "") + "-organized" : "organized"
        }
        ext="pdf"
        sizeBytes={resultBytes?.byteLength}
        onConfirm={(name) => {
          downloadBlob(bytesToBlob(resultBytes), name, "pdf");
          setModalOpen(false);
        }}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
