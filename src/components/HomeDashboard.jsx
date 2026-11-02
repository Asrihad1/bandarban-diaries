import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl will-change-transform transform-gpu"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 24 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        className="relative w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] rounded-2xl p-6 sm:p-8 will-change-transform transform-gpu"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon + title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Unlock className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Unlock District</p>
            <h3 className="text-lg font-extrabold tracking-tight text-white">{districtName}</h3>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Google Drive Folder Link or ID
            </label>
            <div className="relative">
              <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                autoFocus
                type="text"
                value={folderInput}
                onChange={(e) => { setFolderInput(e.target.value); setError(''); }}
                placeholder="Paste Drive URL or ID (e.g. 1BNxR0LUJFUmh...)"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400 focus:outline-none text-sm text-white placeholder-white/30 transition-colors"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-white/50">
              You can paste the entire folder URL: drive.google.com/drive/folders/<span className="text-cyan-400/80">{'<folder-id>'}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Google Drive API Key
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={apiKeyInput}
                onChange={(e) => { setApiKeyInput(e.target.value); setError(''); }}
                placeholder="Paste API Key (e.g. AIzaSy...)"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400 focus:outline-none text-sm text-white placeholder-white/30 transition-colors font-mono"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-white/50">
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
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/30 transition-all cursor-pointer"
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
export default function HomeDashboard({ unlockedDistricts, onSelectDistrict, onUnlockDistrict }) {
  const [unlockTarget, setUnlockTarget] = useState(null); // district name being unlocked

  const unlockedNames = Object.keys(unlockedDistricts);
  const visitedCount = unlockedNames.length;
  const lockedCount = Math.max(0, TOTAL_DISTRICTS - visitedCount);
  const latestTarget =
    unlockedNames.length > 1
      ? unlockedNames[unlockedNames.length - 1]
      : 'Chattogram';

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
    <div className="relative min-h-screen bg-black text-white selection:bg-cyan-500 selection:text-black overflow-hidden">

      {/* ── Global Cinematic Background & OLED Aurora Glow ───────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=2000"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-black/40 via-black/80 to-black pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-900/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] text-cyan-400 text-xs font-medium tracking-wider uppercase mb-6">
            <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '16s' }} />
            The Travel Diaries · 64 Districts Challenge
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-cyan-100 to-cyan-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            {Object.keys(unlockedDistricts).length}/64 Done
          </h1>

          <p className="mt-4 text-white/50 tracking-widest uppercase text-xs md:text-sm font-semibold">
            {lockedCount} district{lockedCount !== 1 ? 's' : ''} to go · One adventure at a time
          </p>
          <p className="mt-2 text-sm sm:text-base text-white/60 font-medium">
            ম্যাপ থেকে যেকোনো জেলা নির্বাচন করুন · Select any district from the map
          </p>

          {/* ── Expedition Stats Row (3 Glassmorphism Stat Cards) ─────────── */}
          <div className="mt-8 max-w-2xl mx-auto grid grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center flex flex-col justify-center items-center shadow-lg transition-transform hover:scale-105">
              <Camera className="w-5 h-5 text-cyan-400 mb-2" />
              <span className="text-lg sm:text-2xl font-extrabold tracking-tight text-white">
                550+
              </span>
              <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mt-0.5">
                Total Memories
              </span>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center flex flex-col justify-center items-center shadow-lg transition-transform hover:scale-105">
              <MapPin className="w-5 h-5 text-cyan-400 mb-2" />
              <span className="text-lg sm:text-2xl font-extrabold tracking-tight text-white">
                {visitedCount} / 64
              </span>
              <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mt-0.5">
                Districts
              </span>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center flex flex-col justify-center items-center shadow-lg transition-transform hover:scale-105">
              <Crosshair className="w-5 h-5 text-cyan-400 mb-2" />
              <span className="text-base sm:text-xl font-extrabold tracking-tight text-white truncate max-w-full">
                {latestTarget}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mt-0.5">
                Latest Target
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-8 max-w-sm mx-auto">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Progress</span>
              <span className="text-cyan-400 font-mono">{visitedCount} / 64</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                animate={{ width: `${(visitedCount / 64) * 100}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_12px_rgba(6,182,212,0.6)] will-change-transform transform-gpu"
              />
            </div>
          </div>

          {/* Count chips */}
          <div className="mt-5 flex justify-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
              <MapPin className="w-3 h-3" /> {visitedCount} Visited
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-gray-400">
              <Lock className="w-3 h-3" /> {lockedCount} Locked
            </span>
          </div>
        </motion.div>

        {/* ── Interactive 64-District Bangladesh SVG Map ───────────────────── */}
        <div className="my-6">
          <BangladeshMap
            unlockedDistricts={unlockedDistricts}
            onDistrictClick={handleMapClick}
          />
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <p className="mt-16 text-center text-xs text-white/40">
          The Travel Diaries · Bangladesh 2026
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