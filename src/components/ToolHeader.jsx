import React from 'react';

export default function ToolHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-8 flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-flame-500/10 text-flame-400">
        <Icon size={24} />
      </div>
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}
