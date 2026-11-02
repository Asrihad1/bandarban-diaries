import React from 'react';
import { Heart, FolderOpen, ArrowUp, Compass } from 'lucide-react';

export default function Footer({ onScrollToTop, districtName = 'Bangladesh', folderId }) {
  const driveLink = folderId
    ? `https://drive.google.com/drive/folders/${folderId}`
    : 'https://drive.google.com/drive/folders/1BNXR0LUJFUmhCIOvgMg_wp7M6LhCfPTr';

  return (
    <footer className="relative z-10 bg-black border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8 text-center text-gray-400">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left branding */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2 text-white font-extrabold text-base tracking-tight">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>The Travel Diaries</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            64 Districts Challenge · Exploring the breathtaking beauty of Bangladesh.
          </p>
        </div>

        {/* Center / Right Links */}
        <div className="flex items-center gap-4">
          <a
            href={driveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-gray-300 bg-white/5 backdrop-blur-xl border border-white/10 hover:border-cyan-500/40 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open Google Drive Folder</span>
          </a>

          <button
            onClick={onScrollToTop}
            className="p-2.5 rounded-xl bg-white/5 backdrop-blur-xl hover:bg-white/10 text-gray-400 hover:text-cyan-400 border border-white/10 transition-colors cursor-pointer"
            title="Back to Top"
            aria-label="Back to top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10 text-[11px] text-white/50 flex items-center justify-center gap-1.5">
        <span>Captured with passion across {districtName}</span>
        <span>•</span>
        <span className="flex items-center gap-1 text-white/50">
          Crafted with <Heart className="w-3 h-3 text-cyan-400 fill-cyan-400 inline" /> for the crew
        </span>
      </div>
    </footer>
  );
}

