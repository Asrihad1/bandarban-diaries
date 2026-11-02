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
      className="group relative mb-5 break-inside-avoid overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all duration-300 will-change-transform transform-gpu"
    >
      {/* Skeleton Pulse while loading */}
      {!isLoaded && (
        <div className="w-full h-64 bg-white/5 animate-pulse flex items-center justify-center text-gray-500 text-xs font-mono">
          <span>Loading memory #{index + 1}...</span>
        </div>
      )}

      {/* Main Image */}
      <img
        src={currentSrc}
        alt={image.name || `Travel Diaries Memory #${index + 1}`}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
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
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 cursor-pointer"
      >
        {/* Top Badges */}
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium tracking-wider bg-black/75 border border-white/15 text-cyan-400 backdrop-blur-md">
            #{index + 1}
          </span>

          {image.metadata?.cameraModel && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-gray-300 bg-black/70 backdrop-blur-sm border border-white/10">
              <Camera className="w-2.5 h-2.5 text-cyan-400" />
              {image.metadata.cameraModel}
            </span>
          )}
        </div>

        {/* Bottom Actions & Details */}
        <div className="flex items-end justify-between gap-2">
          <div className="truncate max-w-[70%]">
            <p className="text-xs font-medium text-white truncate drop-shadow-sm">
              {image.name || `Memory #${index + 1}`}
            </p>
            {image.size && (
              <p className="text-[10px] text-gray-400 mt-0.5">{image.size}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View Fullscreen Icon */}
            <div
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white border border-white/15 backdrop-blur-sm transition-colors"
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
              className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/30 transition-all duration-200 hover:scale-105 active:scale-95"
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

