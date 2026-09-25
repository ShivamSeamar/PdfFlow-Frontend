import React from "react";
import {
  PenLine,
  Minimize2,
  Scissors,
  ImagePlus,
  Combine,
  FileText,
  FileSpreadsheet,
  FileUp,
  Lock,
  LayoutGrid,
} from "lucide-react";
import FeatureCard from "../components/FeatureCard.jsx";

const features = [
  {
    to: "/edit-pdf",
    icon: PenLine,
    title: "Edit PDF",
    description:
      "Add text, shapes, highlights and images — Word-style editing, right in the browser.",
    tag: "Popular",
  },
  {
    to: "/compress-pdf",
    icon: Minimize2,
    title: "Compress PDF",
    description:
      "Shrink file size to an exact KB target without wrecking quality.",
  },
  {
    to: "/split-pdf",
    icon: Scissors,
    title: "Split PDF",
    description: "Pick pages or ranges and split one PDF into several files.",
  },
  {
    to: "/jpg-to-pdf",
    icon: ImagePlus,
    title: "JPG to PDF",
    description:
      "Turn JPG or JPEG images from your file manager into a clean PDF.",
  },
  {
    to: "/pdf-to-image",
    icon: ImagePlus,
    title: "PDF to Image",
    description: "Convert PDF pages into high-quality images.",
  },
  {
    to: "/combine-pdf",
    icon: Combine,
    title: "Combine PDF",
    description: "Merge multiple PDFs into a single document in any order.",
  },
  {
    to: "/organize-crop-pdf",
    icon: LayoutGrid,
    title: "Organize & Crop PDF",
    description: "Reorder, rotate, delete and crop pages with drag-and-drop.",
  },
  {
    to: "/word-to-pdf",
    icon: FileText,
    title: "Word to PDF",
    description: "Convert Word documents into clean PDFs.",
  },
  {
    to: "/excel-to-pdf",
    icon: FileUp,
    title: "Excel to PDF",
    description: "Turn spreadsheets into paginated, print-ready PDFs.",
  },
  {
    to: "/pdf-to-word",
    icon: FileText,
    title: "PDF to Word",
    description: "Convert PDF pages into an editable Word (.docx) document.",
  },
  {
    to: "/pdf-to-excel",
    icon: FileSpreadsheet,
    title: "PDF to Excel",
    description: "Pull tables out of a PDF straight into an Excel spreadsheet.",
  },

  {
    to: "/protect-unlock-pdf",
    icon: Lock,
    title: "Protect & Unlock PDF",
    description: "Lock a PDF with a password, or remove one you already know.",
  },
];

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-flame-500/30 bg-flame-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-flame-400">
            All tools · 1 workspace
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Every PDF tool you'll ever
            <span className="bg-gradient-to-r from-flame-400 to-flame-600 bg-clip-text text-transparent">
              {" "}
              need
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-gray-400 sm:text-lg">
            Edit, compress, split, merge, convert, protect and organize your
            PDFs — fast, private, and beautifully simple.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a href="#tools" className="btn-primary">
              Explore Tools
            </a>
            <a href="#tools" className="btn-secondary">
              How it works
            </a>
          </div>
        </div>
      </section>

      <section
        id="tools"
        className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-24 sm:px-6 lg:px-8"
      >
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Pick a tool to get started
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Click any card to open the full tool.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.slice(0, 9).map((f) => (
            <FeatureCard key={f.to} {...f} />
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-8">
          <h3 className="mb-6 text-center text-xl font-bold tracking-wide sm:text-2xl bg-gradient-to-r from-flame-400 to-flame-600 bg-clip-text text-transparent hover:text-flame-400 transition hover:taxt-shadow-lg">
            Upcoming Features
          </h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.slice(9).map((f) => (
              <FeatureCard key={f.to} {...f} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
