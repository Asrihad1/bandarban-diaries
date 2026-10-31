import React from 'react';
import { Heart, FolderOpen, ArrowUp, Compass } from 'lucide-react';

export default function Footer({ onScrollToTop }) {
  return (
    <footer className="relative z-10 bg-slate-950 border-t border-slate-900 py-12 px-4 sm:px-6 lg:px-8 text-center text-slate-400">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left branding */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2 text-white font-bold text-base tracking-tight">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Into the Hills: The Bandarban Diaries</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dedicated to 9 friends, 437 unforgettable memories, and the rugged beauty of Bangladesh.
          </p>
        </div>

        {/* Center / Right Links */}
        <div className="flex items-center gap-4">
          <a
            href="https://drive.google.com/drive/folders/1BNXR0LUJFUmhCIOvgMg_wp7M6LhCfPTr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open Google Drive Folder</span>
          </a>

          <button
            onClick={onScrollToTop}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 border border-slate-800 transition-colors cursor-pointer"
            title="Back to Top"
            aria-label="Back to top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-900/80 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
        <span>Captured with passion across Bandarban</span>
        <span>•</span>
        <span className="flex items-center gap-1 text-slate-400">
          Crafted with <Heart className="w-3 h-3 text-emerald-500 fill-emerald-500 inline" /> for the crew
        </span>
      </div>
    </footer>
  );
}

