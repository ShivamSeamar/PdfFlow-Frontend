import React, { useState } from "react";
import { FileUp, FileText } from "lucide-react";
import mammoth from "mammoth";
import { jsPDF } from "jspdf";

import FileDropzone from "../components/FileDropzone.jsx";
import RenameModal from "../components/RenameModal.jsx";
import ToolHeader from "../components/ToolHeader.jsx";
import { downloadBlob } from "../utils/download.js";

export default function WordToPdf() {
  const [file, setFile] = useState(null);
  const [orientation, setOrientation] = useState("portrait");
  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleFiles = async (files) => {
    const f = files[0];

    if (!f) return;

    setFile(f);
  };

  const runConvert = async () => {
    if (!file) return;

    setProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();

      const doc = new jsPDF({
        orientation,
        unit: "pt",
        format: "a4",
      });

      const marginX = 38;
      const marginY = 38;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - marginX * 2;

      const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
      const html = htmlResult.value || "";

      if (!html.trim()) {
        const fallback = await mammoth.extractRawText({ arrayBuffer });
        const text = fallback.value || "";
        const pageHeight = doc.internal.pageSize.getHeight();
        let y = marginY;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);

        const paragraphs = text.split(/\r?\n/);

        paragraphs.forEach((paragraph) => {
          const cleanText = paragraph.trim();

          if (!cleanText) {
            y += 10;
            return;
          }

          const lines = doc.splitTextToSize(cleanText, contentWidth);

          lines.forEach((line) => {
            if (y + 18 > pageHeight - marginY) {
              doc.addPage();
              y = marginY;
              doc.setFont("helvetica", "normal");
              doc.setFontSize(11);
              doc.setTextColor(30, 30, 30);
            }

            doc.text(line, marginX, y);
            y += 16;
          });

          y += 6;
        });

        const blob = doc.output("blob");
        setResultBlob(blob);
        setModalOpen(true);
        return;
      }

      const wrapper = document.createElement("div");
      wrapper.innerHTML = html;
      wrapper.style.width = `${contentWidth}px`;
      wrapper.style.maxWidth = `${contentWidth}px`;
      wrapper.style.padding = "0 0 6px";
      wrapper.style.boxSizing = "border-box";
      wrapper.style.color = "#111827";
      wrapper.style.fontFamily = "Arial, Helvetica, sans-serif";
      wrapper.style.fontSize = "11pt";
      wrapper.style.lineHeight = "1.35";
      wrapper.style.letterSpacing = "0";
      wrapper.style.wordBreak = "break-word";
      wrapper.style.overflowWrap = "anywhere";
      wrapper.style.margin = "0";
      wrapper.style.position = "relative";

      const blockElements = wrapper.querySelectorAll(
        "p, li, div, table, tr, td, th, h1, h2, h3, h4, h5, h6, ul, ol",
      );
      blockElements.forEach((element) => {
        element.style.maxWidth = "100%";
        element.style.wordBreak = "break-word";
        element.style.overflowWrap = "anywhere";
        element.style.marginTop = "0";
        element.style.marginBottom = "4px";
        element.style.padding = "0";
      });

      const formattedHtml = document.createElement("div");
      formattedHtml.style.width = `${contentWidth}px`;
      formattedHtml.style.maxWidth = `${contentWidth}px`;
      formattedHtml.style.padding = "0 2px 6px";
      formattedHtml.style.boxSizing = "border-box";
      formattedHtml.appendChild(wrapper);

      await new Promise((resolve, reject) => {
        try {
          doc.html(formattedHtml, {
            callback: (generatedPdf) => {
              resolve(generatedPdf.output("blob"));
            },
            x: marginX,
            y: marginY,
            width: contentWidth,
            windowWidth: 900,
            autoPaging: true,
            margin: [marginY, marginX, marginY, marginX],
            html2canvas: {
              scale: 0.9,
              useCORS: true,
              backgroundColor: "#ffffff",
              allowTaint: true,
            },
          });
        } catch (error) {
          reject(error);
        }
      }).then((blob) => {
        setResultBlob(blob);
        setModalOpen(true);
      });
    } catch (error) {
      console.error("Word to PDF conversion error:", error);

      alert(
        "Unable to convert this Word document. Please try another .docx file.",
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}

      <ToolHeader
        icon={FileUp}
        title="Word to PDF"
        subtitle="Convert your Word document into a clean, paginated PDF."
      />

      {/* Upload */}

      {!file && (
        <FileDropzone
          accept=".docx"
          onFiles={handleFiles}
          label="Drop your Word document here"
        />
      )}

      {/* File Selected */}

      {file && (
        <div className="card p-6">
          {/* File Information */}

          <div className="mb-5 flex items-center gap-3 rounded-lg border border-base-700 bg-base-800 p-3">
            <FileText size={20} className="text-flame-400" />

            <p className="truncate text-sm font-semibold text-gray-200">
              {file.name}
            </p>

            <button
              onClick={() => {
                setFile(null);
                setResultBlob(null);
              }}
              className="ml-auto text-xs text-gray-500 transition hover:text-flame-400"
            >
              Change
            </button>
          </div>

          {/* Orientation */}

          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Orientation
            </label>

            <div className="flex gap-2">
              {["portrait", "landscape"].map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOrientation(o)}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition ${
                    orientation === o
                      ? "bg-flame-500 text-white"
                      : "bg-base-800 text-gray-400 hover:bg-base-700 hover:text-gray-200"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          {/* Convert Button */}

          <button
            onClick={runConvert}
            disabled={processing}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processing ? "Converting…" : "Convert to PDF"}
          </button>
        </div>
      )}

      {/* Rename / Download */}

      <RenameModal
        open={modalOpen}
        defaultName={file ? file.name.replace(/\.docx$/i, "") : "document"}
        ext="pdf"
        sizeBytes={resultBlob?.size}
        onConfirm={(name) => {
          downloadBlob(resultBlob, name, "pdf");
          setModalOpen(false);
        }}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
