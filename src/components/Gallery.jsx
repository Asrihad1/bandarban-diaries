import React, { useState, useMemo } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import MediaCard from './MediaCard';
import { altMediaUrl } from '../services/driveService';
import {
  Search, SlidersHorizontal, Image as ImageIcon, Video,
  Layers, AlertCircle, RefreshCw, CheckCheck, Square, ArrowLeft, Download,
} from 'lucide-react';

// ── Filter pill button ────────────────────────────────────────────────────────
function FilterPill({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
        border transition-all duration-200 cursor-pointer
        ${active
          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400'
          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-300'
        }
      `}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
      {count !== undefined && (
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${active ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Gallery ─────────────────────────────────────────────────────────────────

export default function Gallery({
  media,
  isLoading,
  loadedCount,
  error,
  selectedFiles,
  onToggleSelect,
  onRetry,
  onSelectAll,
  onClearSelection,
  onBack,
  districtName = 'Bandarban',
  apiKey, // Google Drive API key of the account that owns this district's folder
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setType] = useState('all'); // 'all' | 'photos' | 'videos'
  const [sortBy, setSort] = useState('default');
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const photoCount = useMemo(() => media.filter((m) => m.isImage).length, [media]);
  const videoCount = useMemo(() => media.filter((m) => m.isVideo).length, [media]);

  const filtered = useMemo(() => {
    let items = [...media];

    if (typeFilter === 'photos') items = items.filter((m) => m.isImage);
    if (typeFilter === 'videos') items = items.filter((m) => m.isVideo);

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.metadata?.cameraModel?.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'name') items.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'type') items.sort((a, b) => +b.isVideo - +a.isVideo);

    return items;
  }, [media, typeFilter, search, sortBy]);

  // ── Slides mapping for Lightbox ─────────────────────────────────────────────
  const slides = useMemo(() => {
    return filtered.map((file) => {
      const isVideoFile = file.isVideo || (file.mimeType && file.mimeType.includes('video'));
      const highResUrl = altMediaUrl(file.id, apiKey);

      if (isVideoFile) {
        return {
          type: 'drive-video',
          title: file.name,
          previewUrl: `https://drive.google.com/file/d/${file.id}/preview`,
          poster: file.thumbnailLink || file.imgSrc,
          file,
        };
      }

      return {
        type: 'image',
        src: highResUrl,
        alt: file.name,
        file,
      };
    });
  }, [filtered, apiKey]);

  // ── Lightbox slide direct download ──────────────────────────────────────────
  const handleDownloadSlide = async (slide) => {
    if (!slide || !slide.file) return;
    const file = slide.file;
    try {
      const apiUrl = altMediaUrl(file.id, apiKey);
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60000);
    } catch (err) {
      console.warn('Direct blob download failed, falling back:', err);
      if (file.downloadUrl) {
        const a = document.createElement('a');
        a.href = file.downloadUrl;
        a.download = file.name;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }
  };

  const selectedIdSet = useMemo(() => new Set(selectedFiles.map((s) => s.id)), [selectedFiles]);

  const allFilteredSelected =
    filtered.length > 0 &&
    filtered.every((m) => selectedIdSet.has(m.id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      onClearSelection();
    } else {
      onSelectAll(filtered);
    }
  };

  return (
    <section id="gallery" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* ── Back button ─────────────────────────────────────────────────────── */}
      {onBack && (
        <button
          onClick={onBack}
          className="
            mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-xl
            text-sm font-medium text-slate-400 hover:text-white
            bg-slate-900 border border-slate-800 hover:border-slate-600
            transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer
          "
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Districts
        </button>
      )}

      {/* ── Section header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 pb-7 border-b border-slate-800 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              {isLoading ? 'Loading Memories…' : `${media.length} Memories`} · {districtName}
            </p>
            <h2 className="text-3xl font-bold text-white mt-0.5">{districtName} Visual Chronicles</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-lg">
              Click any photo to open it full-screen. Videos play inline. Select items and download directly in original quality.
            </p>
          </div>

          {/* Search + Sort */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search files or device…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200 placeholder-slate-500 transition-colors w-56"
              />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={sortBy}
                onChange={(e) => setSort(e.target.value)}
                className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="default" className="bg-slate-900">Timeline Order</option>
                <option value="name" className="bg-slate-900">File Name</option>
                <option value="type" className="bg-slate-900">Type (Videos First)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter pills + Select-All */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill
            active={typeFilter === 'all'}
            onClick={() => setType('all')}
            icon={Layers}
            label="All Media"
            count={media.length}
          />
          <FilterPill
            active={typeFilter === 'photos'}
            onClick={() => setType('photos')}
            icon={ImageIcon}
            label="Photos"
            count={photoCount}
          />
          <FilterPill
            active={typeFilter === 'videos'}
            onClick={() => setType('videos')}
            icon={Video}
            label="Videos"
            count={videoCount}
          />

          {filtered.length > 0 && (
            <button
              onClick={handleToggleSelectAll}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-800 bg-slate-900 text-slate-400 hover:border-emerald-500/60 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              {allFilteredSelected
                ? <><Square className="w-3.5 h-3.5" /> Deselect All</>
                : <><CheckCheck className="w-3.5 h-3.5" /> Select All Visible ({filtered.length})</>
              }
            </button>
          )}
        </div>
      </div>

      {/* ── Loading state ───────────────────────────────────────────────────── */}
      {isLoading && media.length === 0 && (
        <div className="py-28 flex flex-col items-center justify-center text-center">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
            <Layers className="absolute inset-0 m-auto w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-lg font-medium text-white">Fetching from Google Drive…</h3>
          <p className="text-xs text-slate-400 mt-1">
            Paginating through {districtName} memories via Drive API v3
          </p>
          {loadedCount > 0 && (
            <span className="mt-4 px-3 py-1 rounded-full text-xs font-mono bg-emerald-950/50 border border-emerald-800/60 text-emerald-400">
              {loadedCount} files loaded so far…
            </span>
          )}
        </div>
      )}

      {/* ── Error state ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="py-16 px-6 my-8 rounded-2xl bg-red-950/20 border border-red-900/40 text-center max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-red-200">Failed to Load Drive Media</h3>
          <p className="text-xs text-red-300/70 mt-1">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-red-900/50 hover:bg-red-800/60 text-red-100 border border-red-700/60 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          )}
        </div>
      )}

      {/* ── Empty search result ─────────────────────────────────────────────── */}
      {!isLoading && !error && filtered.length === 0 && media.length > 0 && (
        <div className="py-24 text-center">
          <p className="text-slate-400 text-sm">No results for "{search}".</p>
          <button onClick={() => setSearch('')} className="mt-2 text-xs text-emerald-400 hover:underline">
            Clear filter
          </button>
        </div>
      )}

      {/* ── Responsive grid ──────────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
          {filtered.map((file, idx) => (
            <MediaCard
              key={file.id}
              file={file}
              isSelected={selectedIdSet.has(file.id)}
              onToggleSelect={() => onToggleSelect(file)}
              onOpenLightbox={() => setLightboxIndex(idx)}
            />
          ))}
        </div>
      )}

      {/* ── Swipeable & Pinch-to-Zoom Lightbox ───────────────────────────────── */}
      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={slides}
        plugins={[Zoom]}
        animation={{ fade: 250, swipe: 250 }}
        carousel={{ finite: false }}
        render={{
          slide: ({ slide }) => {
            if (slide.type === 'drive-video') {
              return (
                <div className="relative w-full h-full max-w-4xl max-h-[80vh] flex items-center justify-center p-4">
                  <iframe
                    src={slide.previewUrl}
                    title={slide.title || 'Video Player'}
                    className="w-full h-full aspect-video rounded-2xl border border-slate-800 shadow-2xl bg-black"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                  />
                </div>
              );
            }
            return undefined; // uses default image rendering with Zoom support!
          },
        }}
        toolbar={{
          buttons: [
            <button
              key="download-slide-btn"
              type="button"
              title="Download high-resolution file"
              onClick={() => {
                if (lightboxIndex >= 0 && slides[lightboxIndex]) {
                  handleDownloadSlide(slides[lightboxIndex]);
                }
              }}
              className="yarl__button p-2 text-slate-200 hover:text-emerald-400 transition-colors cursor-pointer"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Download className="w-5 h-5 text-emerald-400" />
            </button>,
            'close',
          ],
        }}
        on={{
          view: ({ index }) => setLightboxIndex(index),
        }}
      />
    </section>
  );
}
