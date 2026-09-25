import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Flame, Menu, X } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/#tools", label: "Tools" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-base-700 bg-base-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-extrabold tracking-tight"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-flame-500 shadow-glow">
            <Flame size={20} className="text-white" />
          </span>
          <span>
            Pdf<span className="text-flame-500">Flow</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-gray-300 transition hover:text-flame-400"
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden md:block">
          <Link to="/#tools" className="btn-primary text-sm">
            Get Started
          </Link>
        </div>

        <button
          className="md:hidden text-gray-200"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-base-700 bg-base-900 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-gray-300 hover:text-flame-400"
              >
                {l.label}
              </NavLink>
            ))}
            <Link
              to="/#tools"
              onClick={() => setOpen(false)}
              className="btn-primary w-full text-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
