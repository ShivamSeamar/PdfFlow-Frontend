import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export default function FeatureCard({ to, icon: Icon, title, description, tag }) {
  return (
    <Link
      to={to}
      className="card group relative flex flex-col gap-4 p-6 transition-all hover:-translate-y-1 hover:border-flame-500/60 hover:shadow-glow"
    >
      {tag && (
        <span className="absolute right-4 top-4 rounded-full bg-flame-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-flame-400">
          {tag}
        </span>
      )}
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-flame-500/10 text-flame-400 transition-colors group-hover:bg-flame-500 group-hover:text-white">
        <Icon size={24} />
      </div>
      <div>
        <h3 className="flex items-center gap-1 text-lg font-bold text-gray-100">
          {title}
          <ArrowUpRight
            size={16}
            className="text-flame-500 opacity-0 transition-opacity group-hover:opacity-100"
          />
        </h3>
        <p className="mt-1 text-sm text-gray-400">{description}</p>
      </div>
    </Link>
  );
}
