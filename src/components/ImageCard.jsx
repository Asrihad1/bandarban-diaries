import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Maximize2, Camera } from 'lucide-react';

export default function ImageCard({ image, index, onImageClick }) {
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(image.thumbnailLink || image.viewUrl);
  const [isLoaded, setIsLoaded] = useState(false);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);

  // Fallback to high-resolution preview URL if Google Drive uc view URL hits quota/rate limits
  const handleImageError = (e) => {
    if (!fallbackAttempted && image.previewUrl) {
      setFallbackAttempted(true);
      setCurrentSrc(image.previewUrl);
    } else {
      setHasError(true);
      // Fulfill requirement: set display: none on error
      if (e?.currentTarget) {
        e.currentTarget.style.display = 'none';
      }
    }
  };

  if (hasError) {
    return null; // Don't render broken media
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="group relative mb-5 break-inside-avoid overflow-hidden rounded-2xl bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 shadow-md hover:shadow-2xl hover:shadow-emerald-950/40 transition-all duration-300"
    >
      {/* Skeleton Pulse while loading */}
      {!isLoaded && (
        <div className="w-full h-64 bg-slate-800 animate-pulse flex items-center justify-center text-slate-600 text-xs font-mono">
          <span>Loading memory #{index + 1}...</span>
        </div>
      )}

      {/* Main Image */}
      <img
        src={currentSrc}
        alt={image.name || `Bandarban Memory #${index + 1}`}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={handleImageError}
        onClick={() => onImageClick(index)}
        className={`w-full h-auto object-cover cursor-pointer transition-transform duration-700 ease-out group-hover:scale-105 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Hover Overlay */}
      <div
        onClick={() => onImageClick(index)}
        className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 cursor-pointer"
      >
        {/* Top Badges */}
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium tracking-wider bg-slate-900/80 border border-slate-700/60 text-emerald-400 backdrop-blur-md">
            #{index + 1}
          </span>

          {image.metadata?.cameraModel && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-slate-300 bg-slate-900/70 backdrop-blur-sm border border-slate-800">
              <Camera className="w-2.5 h-2.5 text-emerald-400" />
              {image.metadata.cameraModel}
            </span>
          )}
        </div>

        {/* Bottom Actions & Details */}
        <div className="flex items-end justify-between gap-2">
          <div className="truncate max-w-[70%]">
            <p className="text-xs font-medium text-slate-200 truncate drop-shadow-sm">
              {image.name || `Memory #${index + 1}`}
            </p>
            {image.size && (
              <p className="text-[10px] text-slate-400 mt-0.5">{image.size}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View Fullscreen Icon */}
            <div
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-sm transition-colors"
              title="View in Lightbox"
            >
              <Maximize2 className="w-4 h-4" />
            </div>

            {/* Prominent Direct Download Button */}
            <a
              href={image.downloadUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-md shadow-emerald-500/30 transition-all duration-200 hover:scale-105 active:scale-95"
              title="Download Original File"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

