# PdfFlow

A full MERN-stack PDF toolkit — edit, compress, split, merge, convert, protect and organize
PDFs, in a dark/orange themed, fully responsive UI.

## Structure

```
pdfflow/
  frontend/   React + Vite + Tailwind (all the UI, client-side PDF logic)
  backend/    Express + MongoDB (only for the jobs that truly need a server)
```

## What runs where, and why

Most tools run **entirely in the browser** (via `pdf-lib`, `pdfjs-dist`, `jspdf`, `xlsx`) —
nothing is uploaded anywhere:

- Edit PDF, Compress PDF, Split PDF, Combine PDF, JPG/JPEG to PDF, Excel to PDF,
  Organize & Crop PDF

Three tools call the Express backend because they need capabilities no browser library
provides:

- **PDF → Word / PDF → Excel** — real layout reconstruction needs LibreOffice
  (`soffice --headless --convert-to docx|xlsx`) or a cloud conversion API. See
  `backend/routes/convert.js` for both integration points.
- **Protect / Unlock PDF** — standards-compliant PDF encryption is handled with the
  `qpdf` CLI. See `backend/routes/protect.js`.

## Getting started

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev         # http://localhost:5000
```

Backend prerequisites for full functionality:

```bash
# Ubuntu/Debian
sudo apt-get install libreoffice qpdf

# macOS
brew install --cask libreoffice
brew install qpdf
```

MongoDB is optional — it's only used to log conversion job history
(`backend/models/Document.js`); the app still works without it, it just won't persist
job records.

## Theming

Colors live in `frontend/tailwind.config.js` under the `base` (near-black grays) and
`flame` (orange) palettes — tweak those to adjust the whole theme in one place.

## Notes on "MS Word–style" PDF editing

The Edit PDF tool lets you click to place text, boxes and highlights directly on a
rendered preview of each page, then bakes them into the PDF with `pdf-lib`. This covers
adding/annotating content (the most common "edit a PDF" need). Full re-flowing,
paragraph-level editing of existing PDF text (like Word does with .docx) isn't something
any browser or server library does reliably, because PDFs don't store text as editable
paragraphs — only positioned glyphs. If you need that, the practical path is
PDF → Word (already wired up), edit in Word, then Word → PDF back.
