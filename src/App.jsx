import React, { useState, useEffect, useCallback } from 'react';
import Hero       from './components/Hero';
import Gallery    from './components/Gallery';
import Lightbox   from './components/Lightbox';
import FloatingBar from './components/FloatingBar';
import { fetchAllDriveMedia } from './services/driveService';

export default function App() {
  // ── Media state ─────────────────────────────────────────────────────────────
  const [media,       setMedia]       = useState([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [error,       setError]       = useState(null);

  // ── Selection state (photos + videos) ───────────────────────────────────────
  const [selectedFiles, setSelectedFiles] = useState([]);

  // ── Lightbox state (photos only — videos play inline) ───────────────────────
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen,  setLightboxOpen]  = useState(false);

  // Only photos go into the lightbox navigation list
  const photos = media.filter((m) => m.isImage);

  // ── Load all Drive media ─────────────────────────────────────────────────────
  const loadMedia = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLoadedCount(0);

    try {
      const files = await fetchAllDriveMedia((count) => setLoadedCount(count));
      setMedia(files);
    } catch (err) {
      setError(err.message || 'Unable to load media from Google Drive.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadMedia(); }, [loadMedia]);

  // ── Selection handlers ───────────────────────────────────────────────────────
  const handleToggleSelect = useCallback((file) => {
    setSelectedFiles((prev) =>
      prev.some((f) => f.id === file.id)
        ? prev.filter((f) => f.id !== file.id)
        : [...prev, file]
    );
  }, []);

  const handleSelectAll = useCallback((files) => {
    setSelectedFiles((prev) => {
      const newIds = new Set(files.map((f) => f.id));
      const kept   = prev.filter((f) => !newIds.has(f.id)); // avoid duplicates
      return [...kept, ...files];
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  // ── Lightbox handlers ────────────────────────────────────────────────────────
  const handleOpenLightbox = useCallback((photoIndex) => {
    setLightboxIndex(photoIndex);
    setLightboxOpen(true);
  }, []);

  const handleCloseLightbox = useCallback(() => setLightboxOpen(false), []);

  const handlePrev = useCallback(() =>
    setLightboxIndex((i) => (i > 0 ? i - 1 : photos.length - 1)),
  [photos.length]);

  const handleNext = useCallback(() =>
    setLightboxIndex((i) => (i < photos.length - 1 ? i + 1 : 0)),
  [photos.length]);

  // ── Scroll helpers ───────────────────────────────────────────────────────────
  const scrollToGallery = () =>
    document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">

      <Hero
        totalMedia={media.length || 437}
        onScrollToGallery={scrollToGallery}
      />

      <Gallery
        media={media}
        isLoading={isLoading}
        loadedCount={loadedCount}
        error={error}
        selectedFiles={selectedFiles}
        onToggleSelect={handleToggleSelect}
        onOpenLightbox={handleOpenLightbox}
        onRetry={loadMedia}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
      />

      {/* Lightbox — photos only; videos play inline via iframes */}
      <Lightbox
        images={photos}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={handleCloseLightbox}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {/* Floating action bar — appears when ≥1 file is selected */}
      <FloatingBar
        selectedFiles={selectedFiles}
        onClearSelection={handleClearSelection}
      />
    </div>
  );
}
