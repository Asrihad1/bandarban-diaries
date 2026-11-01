import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Lock, Compass,
  Unlock, X, FolderOpen, KeyRound, AlertCircle, Sparkles, Calendar, Shuffle,
} from 'lucide-react';
import BangladeshMap from './BangladeshMap';

// ── Total districts in Bangladesh ────────────────────────────────────────────
const TOTAL_DISTRICTS = 64;

// Helper to extract folder ID whether user enters raw ID or a full Google Drive URL
function extractFolderId(input) {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed)) return trimmed;
  return '';
}

// ── Spotlight Memory helpers ──────────────────────────────────────────────────
const SPOTLIGHT_RANDOM_COUNT = 4;
const SPOTLIGHT_MAX_MATCHES = 12;

/** Parses Drive EXIF time ("YYYY:MM:DD HH:MM:SS") into { year, month, day }. */
function parseExifDate(exifTime) {
  const m = exifTime?.match(/^(\d{4})[:-](\d{2})[:-](\d{2})/);
  return m ? { year: +m[1], month: +m[2], day: +m[3] } : null;
}

/** Parses an ISO timestamp (Drive `createdTime`) into local { year, month, day }. */
function parseIsoDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

/** Deterministic PRNG so the "random" pick is stable across re-renders but changes daily. */
function seededRandom(seedString) {
  let h = 1779033703 ^ seedString.length;
  for (let i = 0; i < seedString.length; i++) {
    h = Math.imul(h ^ seedString.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function formatDate({ year, month, day }) {
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

/** Uses the raw Drive thumbnail (=s220) upscaled to 400px, falling back to the pre-sized one. */
function spotlightThumb(file) {
  const base = file.rawThumbnailLink || file.thumbnailLink;
  return base ? base.replace('=s220', '=w400') : file.imgSrc;
}

/**
 * Picks "Spotlight Memories": photos whose EXIF date or upload date share today's
 * month + day. Falls back to a stable daily-random selection when nothing matches.
 */
function getSpotlightMemories(media, today) {
  const photos = (media || []).filter((f) => f.isImage);
  if (photos.length === 0) return { mode: 'empty', items: [] };

  const matchesToday = (d) => d && d.month === today.month && d.day === today.day;

  const anniversaries = [];
  for (const file of photos) {
    const exifDate = parseExifDate(file.metadata?.time);
    const createdDate = parseIsoDate(file.createdTime);
    const matched = matchesToday(exifDate) ? exifDate : matchesToday(createdDate) ? createdDate : null;
    if (matched) anniversaries.push({ file, date: matched });
  }

  if (anniversaries.length > 0) {
    return { mode: 'anniversary', items: anniversaries.slice(0, SPOTLIGHT_MAX_MATCHES) };
  }

  // Fallback: Fisher–Yates shuffle with a date-based seed, take the first N
  const rand = seededRandom(`${today.year}-${today.month}-${today.day}-${photos.length}`);
  const pool = [...photos];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return {
    mode: 'random',
    items: pool.slice(0, SPOTLIGHT_RANDOM_COUNT).map((file) => ({
      file,
      date: parseExifDate(file.metadata?.time) || parseIsoDate(file.createdTime),
    })),
  };
}

// ── Spotlight Memory card ─────────────────────────────────────────────────────
function SpotlightMemory({ spotlight, today }) {
  const isAnniversary = spotlight.mode === 'anniversary';
  const todayLabel = new Date(today.year, today.month - 1, today.day)
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      className="mb-10"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5" /> Spotlight Memory
      </p>

      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-900/60 backdrop-blur-md shadow-xl shadow-emerald-500/5">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="relative flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 pt-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              {isAnniversary
                ? <Calendar className="w-5 h-5 text-emerald-400" />
                : <Shuffle className="w-5 h-5 text-emerald-400" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-white tracking-tight truncate">
                {isAnniversary ? 'On This Day' : 'Trip Highlights'}
              </h3>
              <p className="text-xs text-slate-400 truncate">
                {isAnniversary
                  ? `${spotlight.items.length} memor${spotlight.items.length === 1 ? 'y' : 'ies'} captured on ${todayLabel}`
                  : 'Random memories from the expedition · refreshed daily'}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            {isAnniversary ? <Calendar className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
            {isAnniversary ? todayLabel : 'Random Memory'}
          </span>
        </div>

        {/* Horizontal snap-scrolling thumbnail row */}
        <div className="relative flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth px-5 sm:px-6 py-5">
          {spotlight.items.map(({ file, date }, i) => {
            const yearsAgo = date ? today.year - date.year : 0;
            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.25 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="group relative snap-start flex-shrink-0 w-40 sm:w-48 aspect-[4/5] overflow-hidden rounded-xl border border-slate-800 bg-slate-800 hover:border-emerald-500/50 transition-colors duration-300"
              >
                <img
                  src={spotlightThumb(file)}
                  alt={file.name}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    if (file.imgSrc && e.currentTarget.src !== file.imgSrc) e.currentTarget.src = file.imgSrc;
                  }}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 inset-x-0 p-2.5">
                  {isAnniversary && yearsAgo > 0 && (
                    <span className="inline-block mb-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500 text-slate-950">
                      {yearsAgo} year{yearsAgo !== 1 ? 's' : ''} ago
                    </span>
                  )}
                  <p className="text-[11px] font-medium text-slate-200 truncate">
                    {date ? formatDate(date) : file.name}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ── Unlock Modal ──────────────────────────────────────────────────────────────
function UnlockModal({ districtName, onConfirm, onClose }) {
  const [folderInput, setFolderInput] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const folderId = extractFolderId(folderInput);
    const apiKey = apiKeyInput.trim();

    if (!folderId) {
      setError('Please paste a valid Google Drive folder link or folder ID.');
      return;
    }
    if (folderId.length < 10) {
      setError("That doesn't look like a valid folder ID or URL. Check the link and try again.");
      return;
    }
    if (!apiKey) {
      setError('Please enter a Google Drive API Key for this account.');
      return;
    }
    onConfirm({ folderId, apiKey });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 24 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-slate-950/70 p-6"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon + title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <Unlock className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Unlock District</p>
            <h3 className="text-lg font-bold text-white">{districtName}</h3>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Google Drive Folder Link or ID
            </label>
            <div className="relative">
              <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                autoFocus
                type="text"
                value={folderInput}
                onChange={(e) => { setFolderInput(e.target.value); setError(''); }}
                placeholder="Paste Drive URL or ID (e.g. 1BNxR0LUJFUmh...)"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:outline-none text-sm text-slate-200 placeholder-slate-600 transition-colors"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">
              You can paste the entire folder URL: drive.google.com/drive/folders/<span className="text-emerald-500/70">{'<folder-id>'}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Google Drive API Key
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={apiKeyInput}
                onChange={(e) => { setApiKeyInput(e.target.value); setError(''); }}
                placeholder="Paste API Key (e.g. AIzaSy...)"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:outline-none text-sm text-slate-200 placeholder-slate-600 transition-colors font-mono"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">
              API key from the Google Cloud project with Drive API v3 enabled.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/40 border border-red-900/50 text-red-400 text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-md cursor-pointer"
            >
              Unlock
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Home Dashboard ────────────────────────────────────────────────────────────
export default function HomeDashboard({ unlockedDistricts, media = [], onSelectDistrict, onUnlockDistrict }) {
  // ── Spotlight Memories (anniversary match → daily random fallback) ─────────
  const [today] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  });
  const spotlight = useMemo(() => getSpotlightMemories(media, today), [media, today]);

  const [unlockTarget, setUnlockTarget] = useState(null); // district name being unlocked

  const unlockedNames = Object.keys(unlockedDistricts);
  const visitedCount = unlockedNames.length;
  const lockedCount = Math.max(0, TOTAL_DISTRICTS - visitedCount);

  const handleMapClick = (districtName) => {
    if (unlockedDistricts[districtName]) {
      onSelectDistrict(districtName, unlockedDistricts[districtName]);
    } else {
      setUnlockTarget(districtName);
    }
  };

  const handleConfirmUnlock = ({ folderId, apiKey }) => {
    onUnlockDistrict(unlockTarget, { folderId, apiKey });
    setUnlockTarget(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">

      {/* ── Ambient background ──────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/8 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(16,185,129,0.07),transparent)]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-slate-900/60 backdrop-blur-md text-emerald-400 text-xs font-medium tracking-wider uppercase mb-6">
            <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '16s' }} />
            Bangladesh · 64 Districts Challenge
          </div>

          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            <motion.span
              key={visitedCount}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block"
            >
              {visitedCount}
            </motion.span>
            <span className="text-emerald-400">/</span>64{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">
              Done
            </span>
          </h1>
          <p className="mt-3 text-xl text-slate-400 font-light">
            {lockedCount} district{lockedCount !== 1 ? 's' : ''} to go. One adventure at a time.
          </p>

          {/* Progress bar */}
          <div className="mt-8 max-w-sm mx-auto">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Progress</span>
              <span className="text-emerald-400 font-mono">{visitedCount} / 64</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <motion.div
                animate={{ width: `${(visitedCount / 64) * 100}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
              />
            </div>
          </div>

          {/* Count chips */}
          <div className="mt-5 flex justify-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <MapPin className="w-3 h-3" /> {visitedCount} Visited
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-400">
              <Lock className="w-3 h-3" /> {lockedCount} Locked
            </span>
          </div>
        </motion.div>

        {/* ── Spotlight Memory ────────────────────────────────────────────── */}
        {spotlight.items.length > 0 && (
          <SpotlightMemory spotlight={spotlight} today={today} />
        )}

        {/* ── Interactive 64-District Bangladesh SVG Map ───────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="my-6"
        >
          <BangladeshMap
            unlockedDistricts={unlockedDistricts}
            onDistrictClick={handleMapClick}
          />
        </motion.div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <p className="mt-16 text-center text-xs text-slate-700">
          Into the Hills: The Bandarban Diaries · Bangladesh 2026
        </p>
      </div>

      {/* ── Unlock modal ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {unlockTarget && (
          <UnlockModal
            districtName={unlockTarget}
            onConfirm={handleConfirmUnlock}
            onClose={() => setUnlockTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}