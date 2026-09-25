import React, { useState } from 'react';
import { FileUp, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import FileDropzone from '../components/FileDropzone.jsx';
import RenameModal from '../components/RenameModal.jsx';
import ToolHeader from '../components/ToolHeader.jsx';
import { downloadBlob } from '../utils/download.js';

export default function ExcelToPdf() {
  const [file, setFile] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [orientation, setOrientation] = useState('landscape');
  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleFiles = async (files) => {
    const f = files[0];
    setFile(f);
    const buf = await f.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    setSheetNames(wb.SheetNames);
    setSelectedSheet(wb.SheetNames[0]);
  };

  const runConvert = async () => {
    setProcessing(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[selectedSheet];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
      const marginX = 30;
      const marginY = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const colCount = Math.max(...rows.map((r) => r.length), 1);
      const colWidth = (pageWidth - marginX * 2) / colCount;
      const rowHeight = 22;

      let y = marginY;
      doc.setFontSize(9);
      rows.forEach((row, rIdx) => {
        if (y + rowHeight > pageHeight - marginY) {
          doc.addPage();
          y = marginY;
        }
        let x = marginX;
        const isHeader = rIdx === 0;
        row.forEach((cell) => {
          if (isHeader) {
            doc.setFillColor(255, 92, 10);
            doc.rect(x, y, colWidth, rowHeight, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont(undefined, 'bold');
          } else {
            doc.setDrawColor(220, 220, 220);
            doc.rect(x, y, colWidth, rowHeight);
            doc.setTextColor(30, 30, 30);
            doc.setFont(undefined, 'normal');
          }
          const text = String(cell ?? '').slice(0, 40);
          doc.text(text, x + 4, y + 14);
          x += colWidth;
        });
        y += rowHeight;
      });

      const blob = doc.output('blob');
      setResultBlob(blob);
      setModalOpen(true);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <ToolHeader icon={FileUp} title="Excel to PDF" subtitle="Turn a spreadsheet into a paginated, print-ready PDF." />

      {!file && (
        <FileDropzone
          accept=".xlsx,.xls,.csv"
          onFiles={handleFiles}
          label="Drop your Excel or CSV file here"
        />
      )}

      {file && (
        <div className="card p-6">
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-base-700 bg-base-800 p-3">
            <FileSpreadsheet size={20} className="text-flame-400" />
            <p className="truncate text-sm font-semibold text-gray-200">{file.name}</p>
            <button onClick={() => setFile(null)} className="ml-auto text-xs text-gray-500 hover:text-flame-400">
              Change
            </button>
          </div>

          {sheetNames.length > 1 && (
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Sheet
              </label>
              <select
                value={selectedSheet}
                onChange={(e) => setSelectedSheet(e.target.value)}
                className="input-field"
              >
                {sheetNames.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Orientation
            </label>
            <div className="flex gap-2">
              {['landscape', 'portrait'].map((o) => (
                <button
                  key={o}
                  onClick={() => setOrientation(o)}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize ${
                    orientation === o ? 'bg-flame-500 text-white' : 'bg-base-800 text-gray-400'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          <button onClick={runConvert} disabled={processing} className="btn-primary w-full">
            {processing ? 'Converting…' : 'Convert to PDF'}
          </button>
        </div>
      )}

      <RenameModal
        open={modalOpen}
        defaultName={file ? file.name.replace(/\.(xlsx|xls|csv)$/i, '') : 'spreadsheet'}
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
