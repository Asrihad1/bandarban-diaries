import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { motion } from 'framer-motion';
import {
  MapPin, Lock, Compass, Camera, Crosshair,
  Unlock, X, FolderOpen, KeyRound, AlertCircle,
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

// ── Unlock Modal ─────────────────────────────────────────────────────────────
function UnlockModal({ districtName, onConfirm, onClose }) {
  const [folderInput, setFolderInput] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [error, setError] = useState('');
  const backdropRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    const tweens = [];
    if (backdropRef.current) {
      tweens.push(
        gsap.fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.25, ease: 'power2.out', clearProps: 'all' }
        )
      );
    }
    if (modalRef.current) {
      tweens.push(
        gsap.fromTo(
          modalRef.current,
          { scale: 0.8, opacity: 0, force3D: true },
          {
            scale: 1,
            opacity: 1,
            duration: 0.55,
            ease: 'elastic.out(1, 0.6)',
            force3D: true,
            clearProps: 'all',
          }
        )
      );
    }
    return () => tweens.forEach((t) => t.kill());
  }, []);

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
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-6 sm:p-8"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-50 hover:bg-slate-700/50 transition-transform duration-200 ease-out hover:-translate-y-1 active:scale-95 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon + title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <Unlock className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Unlock District</p>
            <h3 className="text-lg font-extrabold tracking-tight text-slate-50 drop-shadow-md">{districtName}</h3>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 focus:border-emerald-500 focus:outline-none text-sm text-slate-50 placeholder-slate-500 transition-colors duration-200"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              You can paste the entire folder URL: drive.google.com/drive/folders/<span className="text-emerald-400">{'<folder-id>'}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Google Drive API Key
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={apiKeyInput}
                onChange={(e) => { setApiKeyInput(e.target.value); setError(''); }}
                placeholder="Paste API Key (e.g. AIzaSy...)"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 focus:border-emerald-500 focus:outline-none text-sm text-slate-50 placeholder-slate-500 transition-colors duration-200 font-mono"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              API key from the Google Cloud project with Drive API v3 enabled.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/50 border border-red-500/30 text-red-400 text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-slate-50 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/50 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-emerald-500/30 active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-slate-50 drop-shadow-md shadow-lg shadow-emerald-900/50 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-emerald-500/30 active:scale-95 cursor-pointer"
            >
              Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Home Dashboard ────────────────────────────────────────────────────────────
export default function HomeDashboard({
  unlockedDistricts,
  onSelectDistrict,
  onUnlockDistrict,
  isReturningFromGallery = false,
  onReturnComplete,
}) {
  const [unlockTarget, setUnlockTarget] = useState(null); // district name being unlocked
  const mapRef = useRef(null); // strictly targets the <svg> element inside BangladeshMap
  const overlayRef = useRef(null);
  const isTransitioningRef = useRef(false);

  const unlockedNames = Object.keys(unlockedDistricts);
  const visitedCount = unlockedNames.length;
  const lockedCount = Math.max(0, TOTAL_DISTRICTS - visitedCount);
  const latestTarget =
    unlockedNames.length > 1
      ? unlockedNames[unlockedNames.length - 1]
      : 'Chattogram';

  // ── Map GSAP Cleanup on Mount & Reverse Zoom (gsap.fromTo on <svg>) ────────
  useEffect(() => {
    if (!mapRef.current) return;

    // 1. Instantly clear any leftover GSAP inline styles from previous animations
    gsap.killTweensOf(mapRef.current);
    gsap.set(mapRef.current, { clearProps: 'all' });

    if (overlayRef.current) {
      gsap.killTweensOf(overlayRef.current);
      gsap.set(overlayRef.current, { clearProps: 'all' });
    }

    // 2. If returning from the Gallery, explicitly run gsap.fromTo on the SVG
    if (isReturningFromGallery) {
      if (overlayRef.current) {
        gsap.fromTo(
          overlayRef.current,
          { autoAlpha: 1 },
          { autoAlpha: 0, duration: 0.55, ease: 'power2.out', clearProps: 'all' }
        );
      }

      gsap.fromTo(
        mapRef.current,
        { scale: 30, opacity: 0 }, // START explicitly huge and invisible
        {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: 'expo.out',
          force3D: true,
          clearProps: 'all', // END at normal size and clear inline styles afterward
          onComplete: () => {
            onReturnComplete?.();
          },
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Forward Zoom (To Gallery): scale: 30 on <svg> ──────────────────────────
  const handleMapClick = (districtName) => {
    if (unlockedDistricts[districtName]) {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      if (overlayRef.current) {
        gsap.fromTo(
          overlayRef.current,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.65, ease: 'power2.inOut' }
        );
      }

      if (mapRef.current) {
        gsap.to(mapRef.current, {
          scale: 30,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.inOut',
          force3D: true,
          transformOrigin: 'center center',
          onComplete: () => {
            isTransitioningRef.current = false;
            onSelectDistrict(districtName, unlockedDistricts[districtName]);
          },
        });
      } else {
        isTransitioningRef.current = false;
        onSelectDistrict(districtName, unlockedDistricts[districtName]);
      }
    } else {
      setUnlockTarget(districtName);
    }
  };

  const handleConfirmUnlock = ({ folderId, apiKey }) => {
    onUnlockDistrict(unlockTarget, { folderId, apiKey });
    setUnlockTarget(null);
  };

  return (
    <div className="relative min-h-screen bg-slate-900 text-slate-50 selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
      {/* ── Fixed Dark Nature Background & Heavy Slate Overlay ───────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&q=80&w=2000"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-[2px]" />
      </div>

      {/* ── Full-Screen Pitch-Black GSAP Transition Overlay ──────────────────── */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black pointer-events-none opacity-0 invisible"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* ── Header & Expedition Stats (Framer Motion Guaranteed Visibility) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 shadow-xl text-emerald-400 text-xs font-medium tracking-wider uppercase transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-emerald-500/30">
              <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '16s' }} />
              <span className="text-slate-50 drop-shadow-md">The Travel Diaries · 64 Districts Challenge</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight text-slate-50 drop-shadow-md">
            The Travel Diaries · {Object.keys(unlockedDistricts).length}/64 Done
          </h1>

          <p className="mt-4 text-slate-300 drop-shadow-md tracking-widest uppercase text-xs md:text-sm font-semibold">
            {lockedCount} district{lockedCount !== 1 ? 's' : ''} to go · One adventure at a time
          </p>
          <p className="mt-2 text-sm sm:text-base text-slate-300 drop-shadow-md font-medium">
            ম্যাপ থেকে যেকোনো জেলা নির্বাচন করুন · Select any district from the map
          </p>

          {/* ── Expedition Stats Row ─────────────────────────────────────────── */}
          <div className="mt-8 max-w-2xl mx-auto grid grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-4 text-center flex flex-col justify-center items-center transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-emerald-500/30 active:scale-95">
              <Camera className="w-5 h-5 text-emerald-400 mb-2" />
              <span className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-50 drop-shadow-md">
                550+
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mt-0.5">
                Total Memories
              </span>
            </div>

            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-4 text-center flex flex-col justify-center items-center transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-emerald-500/30 active:scale-95">
              <MapPin className="w-5 h-5 text-emerald-400 mb-2" />
              <span className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-50 drop-shadow-md">
                {visitedCount} / 64
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mt-0.5">
                Districts
              </span>
            </div>

            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-4 text-center flex flex-col justify-center items-center transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-emerald-500/30 active:scale-95">
              <Crosshair className="w-5 h-5 text-emerald-400 mb-2" />
              <span className="text-base sm:text-xl font-extrabold tracking-tight text-slate-50 drop-shadow-md truncate max-w-full">
                {latestTarget}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mt-0.5">
                Latest Target
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-8 max-w-sm mx-auto">
            <div className="flex items-center justify-between text-xs text-slate-300 drop-shadow-md mb-2">
              <span>Progress</span>
              <span className="text-emerald-400 font-mono">{visitedCount} / 64</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
              <div
                style={{ width: `${(visitedCount / 64) * 100}%` }}
                className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
              />
            </div>
          </div>

          {/* Count chips */}
          <div className="mt-5 flex justify-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-emerald-500/30 active:scale-95">
              <MapPin className="w-3 h-3" /> {visitedCount} Visited
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-slate-800/40 border border-slate-700/50 text-slate-300 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-emerald-500/30 active:scale-95">
              <Lock className="w-3 h-3" /> {lockedCount} Locked
            </span>
          </div>
        </motion.div>

        {/* ── Interactive 64-District Bangladesh SVG Map ───────────────────── */}
        <BangladeshMap
          mapRef={mapRef}
          unlockedDistricts={unlockedDistricts}
          onDistrictClick={handleMapClick}
        />

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <p className="mt-16 text-center text-xs text-slate-400 drop-shadow-md">
          The Travel Diaries · Bangladesh 2026
        </p>
      </div>

      {/* ── Unlock modal ────────────────────────────────────────────────────── */}
      {unlockTarget && (
        <UnlockModal
          districtName={unlockTarget}
          onConfirm={handleConfirmUnlock}
          onClose={() => setUnlockTarget(null)}
        />
      )}
    </div>
  );
}
