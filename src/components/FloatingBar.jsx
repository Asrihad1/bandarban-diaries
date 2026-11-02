import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Download, X, CheckCheck,
  Loader2, AlertCircle,
} from 'lucide-react';
import { altMediaUrl } from '../services/driveService';

function StatusIcon({ state }) {
  switch (state) {
    case 'fetching': return <Loader2 className="w-4 h-4 animate-spin" />;
    case 'done': return <CheckCheck className="w-4 h-4" />;
    case 'error': return <AlertCircle className="w-4 h-4" />;
    default: return <Download className="w-4 h-4" />;
  }
}

export default function FloatingBar({ selectedFiles, apiKey, onClearSelection }) {
  const [dlState, setDlState] = React.useState('idle'); // 'idle' | 'fetching' | 'done' | 'error'
  const [progress, setProgress] = React.useState(0);   // 0-100
  const [errorMsg, setErrorMsg] = React.useState('');

  const count = selectedFiles.length;

  const handleDownload = async () => {
    if ((dlState !== 'idle' && dlState !== 'error') || count === 0) return;

    setDlState('fetching');
    setProgress(0);
    setErrorMsg('');

    const errors = [];

    try {
      // ── Fetch each file and trigger a native browser download ─────────────
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        try {
          /**
           * Use the official Drive API v3 `alt=media` endpoint to fetch the
           * raw file blob directly — no zip, no proxy, no redirect chain.
           * `file.streamUrl` is already bound to the API key of the account
           * that owns this district's folder.
           */
          const apiUrl = file.streamUrl || altMediaUrl(file.id, apiKey);
          const response = await fetch(apiUrl);
          if (!response.ok) throw new Error(`Failed to fetch file ${file.id}`);
          const blob = await response.blob();

          // Create a temporary object URL and trigger a native download
          const objectUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = objectUrl;
          a.download = file.name; // preserves original filename + extension
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          // Delay revoking URL so browser has time to finish saving the blob
          setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60000);

          // Small delay between downloads so the browser doesn't block the queue
          await new Promise(r => setTimeout(r, 600));
        } catch (err) {
          console.warn(`Direct blob fetch failed for ${file.name}, trying downloadUrl fallback:`, err.message);
          try {
            const fallbackLink = file.downloadUrl || `https://drive.google.com/uc?export=download&id=${file.id}`;
            const a = document.createElement('a');
            a.href = fallbackLink;
            a.download = file.name;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } catch {
            errors.push(file.name);
          }
        }

        setProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }

      if (errors.length > 0) {
        throw new Error(`Failed to download ${errors.length} file(s).`);
      }

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
      case 'fetching': return `Downloading… ${progress}%`;
      case 'done': return 'Downloaded!';
      case 'error': return 'Failed — Retry?';
      default: return `Download ${count} file${count !== 1 ? 's' : ''} (High-Res)`;
    }
  };

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          key="floating-bar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="
            fixed bottom-6 left-1/2 -translate-x-1/2
            z-50 flex items-center gap-3 px-6 py-4
            rounded-2xl bg-white/5 backdrop-blur-xl
            border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]
            min-w-[340px] max-w-[90vw] will-change-transform transform-gpu
          "
        >
          {/* Selection badge */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="
              px-2.5 py-1 rounded-lg text-xs font-mono font-bold
              bg-cyan-500/20 border border-cyan-500/40 text-cyan-400
            ">
              {count}
            </span>
            <span className="text-sm text-gray-300 truncate">
              {count === 1 ? 'item' : 'items'} selected
            </span>
          </div>

          {/* Progress bar (visible while downloading) */}
          {dlState === 'fetching' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl overflow-hidden bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-b-2xl"
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
              p-2 rounded-xl text-gray-400 hover:text-white
              hover:bg-white/10 border border-transparent hover:border-white/10
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
              disabled:cursor-not-allowed disabled:opacity-80
              ${dlState === 'done'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                : dlState === 'error'
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/30'
              }
            `}
          >
            <StatusIcon state={dlState} />
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

