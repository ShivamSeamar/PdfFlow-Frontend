import React from "react";
import { Link } from "react-router-dom";
import {
  Flame,
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
} from "lucide-react";

const tools = [
  { to: "/edit-pdf", label: "Edit PDF" },
  { to: "/compress-pdf", label: "Compress PDF" },
  { to: "/split-pdf", label: "Split PDF" },
  { to: "/jpg-to-pdf", label: "JPG to PDF" },
  { to: "/combine-pdf", label: "Combine PDF" },
  { to: "/pdf-to-word", label: "PDF to Word" },
  { to: "/pdf-to-excel", label: "PDF to Excel" },
  { to: "/excel-to-pdf", label: "Excel to PDF" },
  { to: "/protect-unlock-pdf", label: "Protect & Unlock PDF" },
  { to: "/organize-crop-pdf", label: "Organize & Crop PDF" },
];

// TODO: swap these placeholders for your real handles/links.
const socials = [
  { icon: Github, href: "https://github.com/ShivamSeamar/", label: "GitHub" },
  { icon: Twitter, href: "https://x.com/your-handle", label: "X / Twitter" },
  {
    icon: Linkedin,
    href: "https://www.linkedin.com/in/shivamseamar25",
    label: "LinkedIn",
  },
  {
    icon: Instagram,
    href: "https://instagram.com/shivamseamar25",
    label: "Instagram",
  },
  { icon: Mail, href: "shivam101203gmail.com", label: "Email" },
];

const PUBLISHER_NAME = "Shivam Seamar"; // TODO: replace with your real name or company name.

export default function Footer() {
  return (
    <footer className="border-t border-base-700 bg-base-950">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link
              to="/"
              className="flex items-center gap-2 text-lg font-extrabold"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-flame-500">
                <Flame size={16} className="text-white" />
              </span>
              Pdf<span className="text-flame-500">Flow</span>
            </Link>
            <p className="mt-3 text-sm text-gray-500">
              Every PDF tool you need, in one fast, private, dark-themed
              workspace.
            </p>
            <div className="mt-4 flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-base-800 text-gray-400 transition hover:bg-flame-500 hover:text-white"
                >
                  <s.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wide text-gray-400">
              Tools
            </h4>
            <ul className="grid grid-cols-1 gap-2.5">
              {tools.slice(0, 5).map((t) => (
                <li key={t.to}>
                  <Link
                    to={t.to}
                    className="text-sm text-gray-500 transition hover:text-flame-400"
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wide text-gray-400 lg:invisible">
              Tools
            </h4>
            <ul className="grid grid-cols-1 gap-2.5">
              {tools.slice(5).map((t) => (
                <li key={t.to}>
                  <Link
                    to={t.to}
                    className="text-sm text-gray-500 transition hover:text-flame-400"
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wide text-gray-400">
              About
            </h4>
            <p className="text-sm leading-relaxed text-gray-500">
              {/* TODO: replace with your real bio */}
              PdfFlow was built by{" "}
              <span className="text-flame-500">{PUBLISHER_NAME}</span> to make
              everyday PDF work — editing, converting, compressing, protecting —
              fast and free, without uploading files to a stranger's server
              whenever the browser can do the job itself. Add your own story,
              background, or mission here.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-base-800 pt-8 text-sm text-gray-600 sm:flex-row">
          <p>© {new Date().getFullYear()} PdfFlow. All rights reserved.</p>
          <p>
            Published by{" "}
            <span className="font-semibold text-flame-500">
              {PUBLISHER_NAME}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
