import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Square, Download, Play, Camera, Maximize2 } from 'lucide-react';

// ─── Card sub-components ──────────────────────────────────────────────────────

function SelectionCheckbox({ isSelected, onToggle }) {
  return (
    /**
     * CRITICAL: This overlay uses pointer-events-auto + high z-index so the
     * checkbox click registers even when an iframe (video) underneath would
     * normally swallow all pointer events.
     */
    <div
      className="absolute top-2 left-2 z-20 pointer-events-auto"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onToggle();
      }}
    >
      <button
        aria-label={isSelected ? 'Deselect file' : 'Select file'}
        className={`
          flex items-center justify-center w-7 h-7 rounded-md border-2 shadow-md backdrop-blur-md
          transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer
          ${isSelected
            ? 'bg-emerald-500 border-emerald-400 text-slate-950'
            : 'bg-slate-900/80 border-slate-600 text-slate-300 hover:border-emerald-400'
          }
        `}
      >
        {isSelected
          ? <CheckSquare className="w-4 h-4" />
          : <Square      className="w-4 h-4" />
        }
      </button>
    </div>
  );
}

// ─── Photo Card ───────────────────────────────────────────────────────────────

function PhotoCard({ file, isSelected, onToggleSelect, onOpenLightbox }) {
  const [src, setSrc]         = React.useState(file.lhPreview || file.viewUrl);
  const [visible, setVisible] = React.useState(true);
  const [loaded, setLoaded]   = React.useState(false);
  const [fallback, setFallback] = React.useState(false);

  const handleError = React.useCallback(() => {
    if (!fallback && file.viewUrl && src !== file.viewUrl) {
      setFallback(true);
      setSrc(file.viewUrl);
    } else {
      setVisible(false); // hide completely on double-error
    }
  }, [fallback, file.viewUrl, src]);

  if (!visible) return null;

  return (
    <div
      className={`
        relative group overflow-hidden rounded-2xl cursor-pointer
        border-2 transition-all duration-300 shadow-md
        ${isSelected
          ? 'border-emerald-500 shadow-emerald-500/30 shadow-xl'
          : 'border-slate-800 hover:border-slate-600'
        }
      `}
    >
      <SelectionCheckbox isSelected={isSelected} onToggle={onToggleSelect} />

      {/* Skeleton while loading */}
      {!loaded && (
        <div className="w-full h-56 bg-slate-800 animate-pulse flex items-center justify-center">
          <Camera className="w-6 h-6 text-slate-600" />
        </div>
      )}

      <img
        src={src}
        alt={file.name}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={handleError}
        onClick={onOpenLightbox}
        className={`
          w-full h-auto object-cover
          transition-transform duration-700 group-hover:scale-105
          ${loaded ? 'opacity-100' : 'opacity-0 h-0'}
        `}
      />

      {/* Hover overlay */}
      <div
        onClick={onOpenLightbox}
        className="
          absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent
          opacity-0 group-hover:opacity-100 transition-opacity duration-300
          flex items-end justify-between p-3 pointer-events-none group-hover:pointer-events-auto
        "
      >
        <div className="flex flex-col gap-0.5">
          <p className="text-[11px] font-medium text-slate-200 truncate max-w-[160px]">
            {file.name}
          </p>
          {file.size && (
            <p className="text-[10px] text-slate-400">{file.size}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300">
            <Maximize2 className="w-3.5 h-3.5" />
          </div>
          <a
            href={file.downloadUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-md"
            title="Download Original"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Video Card ───────────────────────────────────────────────────────────────

function VideoCard({ file, isSelected, onToggleSelect }) {
  return (
    <div
      className={`
        relative group overflow-hidden rounded-2xl
        border-2 transition-all duration-300 shadow-md
        ${isSelected
          ? 'border-emerald-500 shadow-emerald-500/30 shadow-xl'
          : 'border-slate-800 hover:border-slate-600'
        }
      `}
    >
      {/*
       * CRITICAL z-index fix:
       * The SelectionCheckbox sits in a z-20 pointer-events-auto div,
       * so it intercepts clicks BEFORE they reach the iframe below.
       */}
      <SelectionCheckbox isSelected={isSelected} onToggle={onToggleSelect} />

      {/* Video badge */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-emerald-400 text-[10px] font-semibold backdrop-blur-sm pointer-events-none">
        <Play className="w-2.5 h-2.5 fill-emerald-400" />
        <span>VIDEO</span>
      </div>

      {/*
       * Drive preview iframe — smooth playback without throttle.
       * The container below handles z-layering; the iframe gets z-10 so it
       * sits under the z-20 checkbox overlay.
       */}
      <div className="relative w-full aspect-video bg-slate-900 z-10">
        <iframe
          src={file.previewUrl}
          title={file.name}
          width="100%"
          height="100%"
          allow="autoplay"
          className="absolute inset-0 w-full h-full border-none"
          loading="lazy"
        />
      </div>

      {/* Footer bar with file info */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-t border-slate-800">
        <div className="flex items-center gap-1.5 min-w-0">
          <Play className="w-3 h-3 text-emerald-400 flex-shrink-0" />
          <p className="text-[10px] text-slate-300 truncate">{file.name}</p>
        </div>
        {file.size && (
          <p className="text-[10px] text-slate-400 flex-shrink-0 ml-2">{file.size}</p>
        )}
      </div>
    </div>
  );
}

// ─── Animated wrapper ─────────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function MediaCard({ file, index, isSelected, onToggleSelect, onOpenLightbox }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className="mb-5 break-inside-avoid"
    >
      {file.isVideo ? (
        <VideoCard
          file={file}
          isSelected={isSelected}
          onToggleSelect={onToggleSelect}
        />
      ) : (
        <PhotoCard
          file={file}
          isSelected={isSelected}
          onToggleSelect={onToggleSelect}
          onOpenLightbox={onOpenLightbox}
        />
      )}
    </motion.div>
  );
}

