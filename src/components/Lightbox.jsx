import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, Calendar, Camera, HardDrive, ExternalLink } from 'lucide-react';

export default function Lightbox({ images, currentIndex, isOpen, onClose, onPrev, onNext }) {
  const img = images[currentIndex];

  // ── Keyboard navigation ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowLeft')   onPrev();
      if (e.key === 'ArrowRight')  onNext();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, onPrev, onNext]);

  if (!isOpen || !img) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="lightbox-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/92 backdrop-blur-2xl"
      >
        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <div
          className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-slate-950/80 to-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-slate-800/80 border border-slate-700 text-emerald-400">
            {currentIndex + 1} / {images.length}
          </span>

          <div className="flex items-center gap-3">
            <a
              href={img.downloadUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download High-Res</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Prev / Next arrows ───────────────────────────────────────────── */}
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 z-20 p-3 rounded-full bg-slate-900/70 hover:bg-slate-800 text-slate-200 hover:text-emerald-400 border border-slate-800 shadow-xl backdrop-blur-md transition-all hover:scale-110 active:scale-90 cursor-pointer"
          aria-label="Previous photo"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 z-20 p-3 rounded-full bg-slate-900/70 hover:bg-slate-800 text-slate-200 hover:text-emerald-400 border border-slate-800 shadow-xl backdrop-blur-md transition-all hover:scale-110 active:scale-90 cursor-pointer"
          aria-label="Next photo"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* ── Center image ─────────────────────────────────────────────────── */}
        <div
          className="relative flex items-center justify-center max-w-7xl w-full mx-4 py-20"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.img
            key={img.id}
            src={img.lhPreview || img.imgSrc || img.thumbnailLink || img.viewUrl}
            alt={img.name}
            referrerPolicy="no-referrer"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800/60"
            onError={(e) => {
              if (img.viewUrl && e.currentTarget.src !== img.viewUrl) {
                e.currentTarget.src = img.viewUrl;
              }
            }}
          />
        </div>

        {/* ── Bottom metadata bar ───────────────────────────────────────────── */}
        <div
          className="absolute bottom-0 inset-x-0 z-20 flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-gradient-to-t from-slate-950/90 to-transparent border-t border-slate-800/40"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-4 flex-wrap text-xs text-slate-400">
            {img.metadata?.cameraModel && (
              <span className="flex items-center gap-1.5 text-slate-300">
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                {img.metadata.cameraMake ? `${img.metadata.cameraMake} ` : ''}
                {img.metadata.cameraModel}
              </span>
            )}
            {img.metadata?.time && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {img.metadata.time}
              </span>
            )}
            {img.size && (
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5" />
                {img.size}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-400 hidden sm:inline">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">←</kbd>
              {' '}<kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">→</kbd>
              {' '}<kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Esc</kbd>
            </span>
            <a
              href={`https://drive.google.com/file/d/${img.id}/view`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span>Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
