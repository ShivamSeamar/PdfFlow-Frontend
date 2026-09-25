import React, { useEffect, useState } from "react";
import {
  FileUp,
  FileImage,
  Check,
  Download,
  Loader2,
  Square,
  CheckSquare,
} from "lucide-react";

import JSZip from "jszip";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

import FileDropzone from "../components/FileDropzone.jsx";
import ToolHeader from "../components/ToolHeader.jsx";
import { downloadBlob } from "../utils/download.js";

/* =========================================================
   PDF TO IMAGE
========================================================= */

export default function PdfToImage() {
  const [file, setFile] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [pages, setPages] = useState([]);

  const [format, setFormat] = useState("png");
  const [quality, setQuality] = useState(0.92);

  const [selectedPages, setSelectedPages] = useState([]);

  const [processing, setProcessing] = useState(false);
  const [loadingPages, setLoadingPages] = useState(false);

  /* =========================================================
     LOAD PDF
  ========================================================= */

  const handleFiles = async (files) => {
    const selectedFile = files?.[0];

    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }

    setFile(selectedFile);
    setPages([]);
    setSelectedPages([]);
    setPdf(null);

    setLoadingPages(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
      });

      const loadedPdf = await loadingTask.promise;

      setPdf(loadedPdf);

      const pageData = [];

      for (let pageNumber = 1; pageNumber <= loadedPdf.numPages; pageNumber++) {
        const page = await loadedPdf.getPage(pageNumber);

        const viewport = page.getViewport({
          scale: 0.25,
        });

        const canvas = document.createElement("canvas");

        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        pageData.push({
          pageNumber,
          thumbnail: canvas.toDataURL("image/jpeg", 0.75),
        });
      }

      setPages(pageData);
    } catch (error) {
      console.error("PDF loading error:", error);

      alert("Unable to read this PDF. Please make sure the PDF is valid.");

      setFile(null);
    } finally {
      setLoadingPages(false);
    }
  };

  /* =========================================================
     SELECT / UNSELECT PAGE
  ========================================================= */

  const togglePage = (pageNumber) => {
    setSelectedPages((previous) => {
      if (previous.includes(pageNumber)) {
        return previous.filter((page) => page !== pageNumber);
      }

      return [...previous, pageNumber].sort((a, b) => a - b);
    });
  };

  /* =========================================================
     SELECT ALL
  ========================================================= */

  const selectAllPages = () => {
    setSelectedPages(pages.map((page) => page.pageNumber));
  };

  /* =========================================================
     DESELECT ALL
  ========================================================= */

  const deselectAllPages = () => {
    setSelectedPages([]);
  };

  /* =========================================================
     GET MIME TYPE
  ========================================================= */

  const getMimeType = () => {
    if (format === "jpg" || format === "jpeg") {
      return "image/jpeg";
    }

    return "image/png";
  };

  /* =========================================================
     GET FILE EXTENSION
  ========================================================= */

  const getExtension = () => {
    if (format === "jpeg") return "jpeg";

    return format;
  };

  /* =========================================================
     RENDER PAGE
  ========================================================= */

  const renderPageToBlob = async (pageNumber) => {
    const page = await pdf.getPage(pageNumber);

    /*
     * Higher scale = better image quality.
     */
    const scale = 2;

    const viewport = page.getViewport({
      scale,
    });

    const canvas = document.createElement("canvas");

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    const context = canvas.getContext("2d", {
      alpha: format === "png",
    });

    /*
     * PNG has transparent background by default.
     * JPG/JPEG need white background.
     */
    if (format === "jpg" || format === "jpeg") {
      context.fillStyle = "#ffffff";

      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Unable to create image."));
          }
        },
        getMimeType(),
        format === "png" ? undefined : quality,
      );
    });
  };

  /* =========================================================
     DOWNLOAD SINGLE IMAGE
  ========================================================= */

  const downloadSinglePage = async (pageNumber) => {
    try {
      setProcessing(true);

      const blob = await renderPageToBlob(pageNumber);

      const extension = getExtension();

      downloadBlob(blob, `page-${pageNumber}.${extension}`, extension);
    } catch (error) {
      console.error(error);

      alert("Unable to convert the selected page.");
    } finally {
      setProcessing(false);
    }
  };

  /* =========================================================
     DOWNLOAD SELECTED / ALL
  ========================================================= */

  const convertAndDownload = async () => {
    if (!pdf) return;

    setProcessing(true);

    try {
      /*
       * If user selected pages,
       * use selected pages.
       *
       * If user selected nothing,
       * use ALL pages.
       */
      const pagesToConvert =
        selectedPages.length > 0
          ? selectedPages
          : pages.map((page) => page.pageNumber);

      if (pagesToConvert.length === 0) {
        alert("No pages available.");
        return;
      }

      /*
       * ONE PAGE
       *
       * Download directly.
       */
      if (pagesToConvert.length === 1) {
        const pageNumber = pagesToConvert[0];

        const blob = await renderPageToBlob(pageNumber);

        const extension = getExtension();

        downloadBlob(blob, `page-${pageNumber}.${extension}`, extension);

        return;
      }

      /*
       * MULTIPLE PAGES
       *
       * Create ZIP.
       */
      const zip = new JSZip();

      const extension = getExtension();

      for (let i = 0; i < pagesToConvert.length; i++) {
        const pageNumber = pagesToConvert[i];

        const blob = await renderPageToBlob(pageNumber);

        zip.file(`page-${pageNumber}.${extension}`, blob);
      }

      /*
       * Generate ZIP
       */
      const zipBlob = await zip.generateAsync({
        type: "blob",
      });

      /*
       * Download ZIP
       */
      downloadBlob(zipBlob, `pdf-pages-${format}.zip`, "zip");
    } catch (error) {
      console.error("PDF to image conversion error:", error);

      alert("Something went wrong while converting the PDF.");
    } finally {
      setProcessing(false);
    }
  };

  /* =========================================================
     RESET
  ========================================================= */

  const resetFile = () => {
    setFile(null);
    setPdf(null);
    setPages([]);
    setSelectedPages([]);
    setProcessing(false);
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <ToolHeader
        icon={FileUp}
        title="PDF to Image"
        subtitle="Convert PDF pages into JPG, JPEG or PNG images."
      />

      {/* =====================================================
          UPLOAD
      ===================================================== */}

      {!file && (
        <FileDropzone
          accept=".pdf,application/pdf"
          onFiles={handleFiles}
          label="Drop your PDF file here"
        />
      )}

      {/* =====================================================
          FILE AREA
      ===================================================== */}

      {file && (
        <div className="card p-5 sm:p-6">
          {/* =================================================
              FILE INFO
          ================================================= */}

          <div className="mb-6 flex items-center gap-3 rounded-xl border border-base-700 bg-base-800 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-flame-500/10">
              <FileImage size={20} className="text-flame-400" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-200">
                {file.name}
              </p>

              <p className="text-xs text-gray-500">
                {pages.length > 0
                  ? `${pages.length} page${pages.length > 1 ? "s" : ""}`
                  : "Reading PDF..."}
              </p>
            </div>

            <button
              onClick={resetFile}
              className="ml-auto shrink-0 text-xs text-gray-500 transition hover:text-flame-400"
            >
              Change
            </button>
          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loadingPages && (
            <div className="flex flex-col items-center justify-center py-14">
              <Loader2 size={32} className="animate-spin text-flame-400" />

              <p className="mt-3 text-sm text-gray-400">Loading PDF pages...</p>
            </div>
          )}

          {/* =================================================
              PAGE SELECTION
          ================================================= */}

          {!loadingPages && pages.length > 0 && (
            <>
              {/* =============================================
                  FORMAT
              ============================================= */}

              <div className="mb-6">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Image Format
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {["png", "jpg", "jpeg"].map((imageFormat) => (
                    <button
                      key={imageFormat}
                      type="button"
                      onClick={() => setFormat(imageFormat)}
                      className={`
                          rounded-lg
                          py-2.5
                          text-sm
                          font-semibold
                          uppercase
                          transition
                          ${
                            format === imageFormat
                              ? "bg-flame-500 text-white shadow-lg shadow-flame-500/20"
                              : "bg-base-800 text-gray-400 hover:bg-base-700 hover:text-gray-200"
                          }
                        `}
                    >
                      {imageFormat}
                    </button>
                  ))}
                </div>
              </div>

              {/* =============================================
                  JPEG QUALITY
              ============================================= */}

              {(format === "jpg" || format === "jpeg") && (
                <div className="mb-6">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Image Quality
                    </label>

                    <span className="text-xs font-semibold text-flame-400">
                      {Math.round(quality * 100)}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0.5"
                    max="1"
                    step="0.05"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                </div>
              )}

              {/* =============================================
                  PAGE SELECTION HEADER
              ============================================= */}

              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-200">
                    Select Pages
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    {selectedPages.length > 0
                      ? `${selectedPages.length} page${
                          selectedPages.length > 1 ? "s" : ""
                        } selected`
                      : "No pages selected — all pages will be converted"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllPages}
                    className="rounded-lg bg-base-800 px-3 py-2 text-xs font-semibold text-gray-400 transition hover:bg-base-700 hover:text-flame-400"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    onClick={deselectAllPages}
                    className="rounded-lg bg-base-800 px-3 py-2 text-xs font-semibold text-gray-400 transition hover:bg-base-700 hover:text-flame-400"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* =============================================
                  PAGE GRID
              ============================================= */}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {pages.map((page) => {
                  const selected = selectedPages.includes(page.pageNumber);

                  return (
                    <button
                      key={page.pageNumber}
                      type="button"
                      onClick={() => togglePage(page.pageNumber)}
                      className={`
                        group
                        relative
                        overflow-hidden
                        rounded-xl
                        border
                        bg-base-800
                        text-left
                        transition
                        ${
                          selected
                            ? "border-flame-500 ring-2 ring-flame-500/20"
                            : "border-base-700 hover:border-flame-500/50"
                        }
                      `}
                    >
                      {/* Thumbnail */}

                      <div className="relative aspect-[3/4] overflow-hidden bg-white">
                        <img
                          src={page.thumbnail}
                          alt={`Page ${page.pageNumber}`}
                          className="h-full w-full object-contain"
                        />

                        {/* Selection Overlay */}

                        {selected && (
                          <div className="absolute inset-0 bg-flame-500/10" />
                        )}

                        {/* Checkbox */}

                        <div
                          className={`
                            absolute
                            right-2
                            top-2
                            flex
                            h-6
                            w-6
                            items-center
                            justify-center
                            rounded-md
                            ${
                              selected
                                ? "bg-flame-500 text-white"
                                : "bg-black/60 text-gray-300"
                            }
                          `}
                        >
                          {selected ? (
                            <Check size={15} />
                          ) : (
                            <Square size={15} />
                          )}
                        </div>
                      </div>

                      {/* Page Number */}

                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-xs font-semibold text-gray-300">
                          Page {page.pageNumber}
                        </span>

                        {selected && (
                          <span className="text-[10px] font-semibold uppercase text-flame-400">
                            Selected
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* =============================================
                  DOWNLOAD INFO
              ============================================= */}

              <div className="mt-6 rounded-xl border border-base-700 bg-base-800/70 p-4">
                <div className="flex gap-3">
                  <div className="mt-0.5 shrink-0">
                    <CheckSquare size={18} className="text-flame-400" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-200">
                      Download behavior
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Select pages to convert only those pages. If you don't
                      select any page, all PDF pages will be converted. Multiple
                      pages are automatically packaged into a ZIP file.
                    </p>
                  </div>
                </div>
              </div>

              {/* =============================================
                  DOWNLOAD BUTTON
              ============================================= */}

              <button
                onClick={convertAndDownload}
                disabled={processing}
                className="
                  btn-primary
                  mt-5
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {processing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Download size={18} />

                    {selectedPages.length === 1
                      ? `Download Page ${selectedPages[0]}`
                      : selectedPages.length > 1
                        ? `Download ${selectedPages.length} Pages`
                        : `Download All Pages`}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
