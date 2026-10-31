import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Lock, Compass, ChevronRight, Trophy,
  Unlock, X, FolderOpen, AlertCircle,
} from 'lucide-react';

// ── All 64 districts of Bangladesh (alphabetical, Bandarban first) ────────────
export const ALL_DISTRICTS = [
  'Bandarban',
  'Bagerhat', 'Brahmanbaria', 'Barguna', 'Barisal', 'Bhola',
  'Bogura', 'Chandpur', 'Chapai Nawabganj', 'Chattogram', 'Chuadanga',
  'Comilla', "Cox's Bazar", 'Dhaka', 'Dinajpur', 'Faridpur',
  'Feni', 'Gaibandha', 'Gazipur', 'Gopalganj', 'Habiganj',
  'Jamalpur', 'Jashore', 'Jhalokathi', 'Jhenaidah', 'Joypurhat',
  'Khagrachhari', 'Khulna', 'Kishoreganj', 'Kurigram', 'Kushtia',
  'Lakshmipur', 'Lalmonirhat', 'Madaripur', 'Magura', 'Manikganj',
  'Meherpur', 'Moulvibazar', 'Munshiganj', 'Mymensingh', 'Naogaon',
  'Narail', 'Narayanganj', 'Narsingdi', 'Natore', 'Netrokona',
  'Nilphamari', 'Noakhali', 'Pabna', 'Panchagarh', 'Patuakhali',
  'Pirojpur', 'Rajbari', 'Rajshahi', 'Rangamati', 'Rangpur',
  'Satkhira', 'Shariatpur', 'Sherpur', 'Sirajganj', 'Sunamganj',
  'Sylhet', 'Tangail', 'Thakurgaon',
];

// ── Animation variants ────────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.01 } },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } },
};

// Helper to extract folder ID whether user enters raw ID or a full Google Drive URL
function extractFolderId(input) {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return trimmed;
}

// ── Unlock Modal ──────────────────────────────────────────────────────────────
function UnlockModal({ districtName, onConfirm, onClose }) {
  const [folderInput, setFolderInput] = useState('');
  const [error, setError]             = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const folderId = extractFolderId(folderInput);
    if (!folderId) {
      setError('Please paste a Google Drive folder link or folder ID.');
      return;
    }
    // Basic sanity check — Drive folder IDs are typically 20+ chars
    if (folderId.length < 10) {
      setError("That doesn't look like a valid folder ID or URL. Check the link and try again.");
      return;
    }
    onConfirm(folderId);
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
        animate={{ scale: 1,    opacity: 1, y: 0 }}
        exit={{    scale: 0.92, opacity: 0, y: 24 }}
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

// ── Unlocked district card ────────────────────────────────────────────────────
function UnlockedCard({ name, isBandarban, onClick }) {
  return (
    <motion.button
      variants={itemVariants}
      onClick={onClick}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      className="
        group relative w-full text-left overflow-hidden
        rounded-2xl border-2 border-emerald-500/60 bg-emerald-950/30
        shadow-xl shadow-emerald-500/10 cursor-pointer
        transition-all duration-300 hover:border-emerald-400 hover:shadow-emerald-500/25
      "
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent pointer-events-none" />

      <div className="relative flex items-center justify-between p-5 sm:p-6 gap-3">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400 mb-0.5 truncate">
              {isBandarban ? 'Official Expedition · Chittagong' : 'Unlocked Expedition'}
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">{name}</h3>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {isBandarban ? '437 memories · 2026' : 'Custom Drive Folder Connected'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-500 text-slate-950 text-xs sm:text-sm font-bold shadow-md group-hover:bg-emerald-400 transition-colors flex-shrink-0">
          <span>Gallery</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </motion.button>
  );
}

// ── Locked district card ──────────────────────────────────────────────────────
function LockedCard({ name, onClick }) {
  return (
    <motion.button
      variants={itemVariants}
      onClick={onClick}
      whileHover={{ opacity: 0.75, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="
        group relative overflow-hidden rounded-xl border border-slate-800
        bg-slate-900/50 px-4 py-3
        flex items-center gap-3
        opacity-50 transition-all duration-200 cursor-pointer
        hover:border-emerald-500/30 hover:bg-slate-800/60
      "
    >
      <Lock className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-600 flex-shrink-0 transition-colors" />
      <span className="text-sm text-slate-500 group-hover:text-slate-300 font-medium truncate transition-colors">{name}</span>
      <Unlock className="w-3 h-3 text-emerald-600/0 group-hover:text-emerald-500/60 ml-auto flex-shrink-0 transition-all" />
    </motion.button>
  );
}

// ── Home Dashboard ────────────────────────────────────────────────────────────
export default function HomeDashboard({ unlockedDistricts, onSelectDistrict, onUnlockDistrict }) {
  const [unlockTarget, setUnlockTarget] = useState(null); // district name being unlocked

  const unlockedNames  = Object.keys(unlockedDistricts);
  const visitedCount   = unlockedNames.length;
  const lockedDistricts = ALL_DISTRICTS.filter((d) => !unlockedDistricts[d]);

  const handleLockedClick = (name) => setUnlockTarget(name);

  const handleConfirmUnlock = (folderId) => {
    onUnlockDistrict(unlockTarget, folderId);
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
            {64 - visitedCount} district{64 - visitedCount !== 1 ? 's' : ''} to go. One adventure at a time.
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
              <Lock className="w-3 h-3" /> {lockedDistricts.length} Locked
            </span>
          </div>
        </motion.div>

        {/* ── Unlocked section ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mb-10"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5" /> Unlocked Districts ({visitedCount})
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unlockedNames.map((name) => (
              <UnlockedCard
                key={name}
                name={name}
                isBandarban={name === 'Bandarban'}
                onClick={() => onSelectDistrict(name, unlockedDistricts[name])}
              />
            ))}
          </div>
        </motion.div>

        {/* ── Locked grid ─────────────────────────────────────────────────── */}
        {lockedDistricts.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-4 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" /> Yet to Explore · Click to Unlock
            </p>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
            >
              {lockedDistricts.map((district) => (
                <LockedCard
                  key={district}
                  name={district}
                  onClick={() => handleLockedClick(district)}
                />
              ))}
            </motion.div>
          </div>
        )}

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
