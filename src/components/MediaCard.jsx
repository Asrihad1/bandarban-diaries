import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Square, Download, Play, Camera, Maximize2 } from 'lucide-react';

// ─── Card sub-components ──────────────────────────────────────────────────────

function SelectionCheckbox({ isSelected, onToggle }) {
  return (
    /**
     * CRITICAL: This overlay uses pointer-events-auto + high z-index so the
     * checkbox click registers even when a media element underneath would
     * normally swallow pointer events.
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
            ? 'bg-cyan-500 border-cyan-400 text-black'
            : 'bg-black/70 border-white/20 text-gray-300 hover:border-cyan-400'
          }
        `}
      >
        {isSelected
          ? <CheckSquare className="w-4 h-4" />
          : <Square className="w-4 h-4" />
        }
      </button>
    </div>
  );
}

// ─── Photo Card ───────────────────────────────────────────────────────────────

function PhotoCard({ file, isSelected, onToggleSelect, onOpenLightbox }) {
  // `streamUrl` is built by driveService with the API key of the account owning this file
  const directAltUrl = file.streamUrl;
  const primarySrc = file.imgSrc || file.thumbnailLink || directAltUrl || file.viewUrl;

  const [useFallback, setUseFallback] = useState(false);
  const [hasError, setHasError] = useState(false);

  const currentSrc = useFallback ? directAltUrl : primarySrc;

  const handleError = useCallback(() => {
    if (!useFallback && directAltUrl && primarySrc !== directAltUrl) {
      setUseFallback(true);
    } else {
      setHasError(true);
    }
  }, [useFallback, primarySrc, directAltUrl]);

  return (
    <div
      className={`
        relative group overflow-hidden rounded-2xl cursor-pointer bg-white/5 backdrop-blur-xl
        border transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.5)]
        ${isSelected
          ? 'border-cyan-500 shadow-cyan-500/30 shadow-xl'
          : 'border-white/10 hover:border-cyan-500/40'
        }
      `}
    >
      <SelectionCheckbox isSelected={isSelected} onToggle={onToggleSelect} />

      {hasError ? (
        <div
          onClick={onOpenLightbox}
          className="w-full h-48 sm:h-56 bg-white/5 flex flex-col items-center justify-center p-3 text-gray-500 text-center"
        >
          <Camera className="w-8 h-8 mb-1.5 opacity-60" />
          <p className="text-[11px] truncate max-w-full px-2">{file.name}</p>
        </div>
      ) : (
        <img
          src={currentSrc}
          alt={file.name}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={handleError}
          onClick={onOpenLightbox}
          className="w-full h-48 sm:h-56 object-cover rounded-lg transition-transform duration-500 group-hover:scale-105"
        />
      )}

      {/* Hover overlay */}
      <div
        onClick={onOpenLightbox}
        className="
          absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent
          opacity-0 group-hover:opacity-100 transition-opacity duration-300
          flex items-end justify-between p-3 pointer-events-none group-hover:pointer-events-auto
        "
      >
        <div className="flex flex-col gap-0.5">
          <p className="text-[11px] font-medium text-white truncate max-w-[160px]">
            {file.name}
          </p>
          {file.size && (
            <p className="text-[10px] text-gray-400">{file.size}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 text-gray-200">
            <Maximize2 className="w-3.5 h-3.5" />
          </div>
          <a
            href={file.downloadUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/30"
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

function VideoCard({ file, isSelected, onToggleSelect, onOpenLightbox }) {
  // IMPORTANT: Never fallback a video thumbnail <img> to `alt=media`, as that
  // forces the browser to download a multi-hundred-megabyte video stream inside <img>.
  const primarySrc =
    file.imgSrc ||
    file.thumbnailLink ||
    (file.id ? `https://drive.google.com/thumbnail?id=${file.id}&sz=w600` : null);

  const [useFallbackThumb, setUseFallbackThumb] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  const fallbackThumbUrl = `https://drive.google.com/thumbnail?id=${file.id}&sz=w600`;
  const currentSrc = useFallbackThumb ? fallbackThumbUrl : primarySrc;

  const handleThumbError = useCallback(() => {
    if (!useFallbackThumb && primarySrc !== fallbackThumbUrl) {
      setUseFallbackThumb(true);
    } else {
      setThumbFailed(true);
    }
  }, [useFallbackThumb, primarySrc, fallbackThumbUrl]);

  return (
    <div
      className={`
        relative group overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl
        border transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.5)] cursor-pointer
        ${isSelected
          ? 'border-cyan-500 shadow-cyan-500/30 shadow-xl'
          : 'border-white/10 hover:border-cyan-500/40'
        }
      `}
    >
      <SelectionCheckbox isSelected={isSelected} onToggle={onToggleSelect} />

      {/* Video badge */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 border border-white/15 text-cyan-400 text-[10px] font-semibold backdrop-blur-sm pointer-events-none">
        <Play className="w-2.5 h-2.5 fill-cyan-400" />
        <span>VIDEO</span>
      </div>

      <div
        onClick={onOpenLightbox}
        className="relative w-full h-48 sm:h-56 bg-black z-10 overflow-hidden cursor-pointer group/video"
      >
        {currentSrc && !thumbFailed ? (
          <img
            src={currentSrc}
            alt={file.name}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={handleThumbError}
            className="w-full h-48 sm:h-56 object-cover rounded-lg transition-transform duration-500 group-hover/video:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <Play className="w-8 h-8 text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover/video:bg-black/20 transition-colors">
          <div className="w-11 h-11 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30 transition-transform duration-200 group-hover/video:scale-110">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Footer bar with file info */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/60 border-t border-white/10">
        <div className="flex items-center gap-1.5 min-w-0" onClick={onOpenLightbox}>
          <Play className="w-3 h-3 text-cyan-400 flex-shrink-0" />
          <p className="text-[10px] text-gray-300 truncate">{file.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {file.size && (
            <p className="text-[10px] text-gray-400 flex-shrink-0">{file.size}</p>
          )}
          <a
            href={file.downloadUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all shadow-sm"
            title="Download Original"
          >
            <Download className="w-3 h-3" />
          </a>
        </div>
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

export default function MediaCard({ file, isSelected, onToggleSelect, onOpenLightbox }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className="break-inside-avoid will-change-transform transform-gpu"
    >
      {file.isVideo ? (
        <VideoCard
          key={file.id}
          file={file}
          isSelected={isSelected}
          onToggleSelect={onToggleSelect}
          onOpenLightbox={onOpenLightbox}
        />
      ) : (
        <PhotoCard
          key={file.id}
          file={file}
          isSelected={isSelected}
          onToggleSelect={onToggleSelect}
          onOpenLightbox={onOpenLightbox}
        />
      )}
    </motion.div>
  );
}

