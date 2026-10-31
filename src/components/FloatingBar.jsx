import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Download, Package2, X, CheckCheck,
  Loader2, AlertCircle,
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function FloatingBar({ selectedFiles, onClearSelection }) {
  const [dlState, setDlState] = React.useState('idle'); // 'idle' | 'fetching' | 'zipping' | 'done' | 'error'
  const [progress, setProgress]   = React.useState(0);   // 0-100
  const [errorMsg, setErrorMsg]   = React.useState('');

  const count = selectedFiles.length;

  const handleDownload = async () => {
    if (dlState !== 'idle' || count === 0) return;

    setDlState('fetching');
    setProgress(0);
    setErrorMsg('');

    const zip     = new JSZip();
    const folder  = zip.folder('Bandarban_Diaries_Selection');
    const errors  = [];

    try {
      // ── Phase 1: Fetch blobs for every selected file ─────────────────────
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        try {
          /**
           * We use `export=download` here to guarantee the user gets the
           * exact, original-quality, full-resolution file — not a resized
           * Drive view copy.
           */
          const response = await fetch(file.downloadUrl, { mode: 'cors' });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const blob = await response.blob();
          folder.file(file.name, blob);
        } catch (err) {
          console.warn(`Skipped ${file.name}:`, err.message);
          errors.push(file.name);
        }

        setProgress(Math.round(((i + 1) / selectedFiles.length) * 70));
      }

      // ── Phase 2: Generate zip ─────────────────────────────────────────────
      setDlState('zipping');
      setProgress(72);

      const zipBlob = await zip.generateAsync(
        { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 3 } },
        (meta) => setProgress(72 + Math.round(meta.percent * 0.28))
      );

      setProgress(100);
      saveAs(zipBlob, 'Bandarban_Diaries_Selection.zip');

      setDlState('done');
      setTimeout(() => setDlState('idle'), 3000);
    } catch (err) {
      console.error('Bulk download failed:', err);
      setErrorMsg(err.message || 'Download failed. Please try again.');
      setDlState('error');
      setTimeout(() => setDlState('idle'), 4000);
    }
  };

  // ── Status copy helpers ───────────────────────────────────────────────────

  const buttonLabel = () => {
    switch (dlState) {
      case 'fetching': return `Fetching files… ${progress}%`;
      case 'zipping':  return `Zipping… ${progress}%`;
      case 'done':     return 'Downloaded!';
      case 'error':    return 'Failed — Retry?';
      default:         return `Download ${count} file${count !== 1 ? 's' : ''} (High-Res)`;
    }
  };

  const ButtonIcon = () => {
    switch (dlState) {
      case 'fetching':
      case 'zipping':  return <Loader2    className="w-4 h-4 animate-spin" />;
      case 'done':     return <CheckCheck className="w-4 h-4" />;
      case 'error':    return <AlertCircle className="w-4 h-4" />;
      default:         return <Package2   className="w-4 h-4" />;
    }
  };

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          key="floating-bar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0,  opacity: 1 }}
          exit={{   y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="
            fixed bottom-6 left-1/2 -translate-x-1/2
            z-50 flex items-center gap-3 px-5 py-3.5
            rounded-2xl bg-slate-900/95 backdrop-blur-xl
            border border-slate-700/80 shadow-2xl shadow-slate-950/70
            min-w-[340px] max-w-[90vw]
          "
        >
          {/* Selection badge */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="
              px-2.5 py-1 rounded-lg text-xs font-mono font-bold
              bg-emerald-500/20 border border-emerald-500/40 text-emerald-400
            ">
              {count}
            </span>
            <span className="text-sm text-slate-300 truncate">
              {count === 1 ? 'item' : 'items'} selected
            </span>
          </div>

          {/* Progress bar (visible while downloading) */}
          {(dlState === 'fetching' || dlState === 'zipping') && (
            <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl overflow-hidden bg-slate-800">
              <motion.div
                className="h-full bg-emerald-500 rounded-b-2xl"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          {/* Clear selection */}
          <button
            onClick={onClearSelection}
            title="Clear selection"
            className="
              p-2 rounded-xl text-slate-400 hover:text-white
              hover:bg-slate-800 border border-transparent hover:border-slate-700
              transition-colors cursor-pointer flex-shrink-0
            "
          >
            <X className="w-4 h-4" />
          </button>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={dlState !== 'idle' && dlState !== 'error'}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-xl
              text-sm font-semibold cursor-pointer flex-shrink-0
              transition-all duration-200 hover:scale-105 active:scale-95
              shadow-md disabled:cursor-not-allowed disabled:opacity-80
              ${dlState === 'done'
                ? 'bg-emerald-600 text-white'
                : dlState === 'error'
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }
            `}
          >
            <ButtonIcon />
            <span>{buttonLabel()}</span>
          </button>

          {/* Error message */}
          {dlState === 'error' && errorMsg && (
            <span className="absolute -top-8 left-0 right-0 text-center text-[11px] text-red-400 bg-red-950/80 border border-red-900 rounded-t-xl px-3 py-1">
              {errorMsg}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

