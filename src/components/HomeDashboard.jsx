import React, { useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  MapPin, Lock, Compass, Camera, Crosshair,
  Unlock, X, FolderOpen, KeyRound, AlertCircle, Volume2, VolumeX,
} from 'lucide-react';
import { useSound } from '../services/soundEngine';
import BangladeshMap from './BangladeshMap';

gsap.registerPlugin(useGSAP);

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

// ── Ant Motion <QueueAnim> (React 19 Hardware-Accelerated Implementation) ────
function QueueAnim({
  children,
  type = ['bottom', 'top'],
  interval = 150,
  delay = 0,
  duration = 450,
  className = '',
  component: Component = 'div',
}) {
  const containerRef = useRef(null);
  const enterType = Array.isArray(type) ? type[0] : type;

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const items = Array.from(containerRef.current.children);
      if (items.length === 0) return;

      const fromVars = {
        opacity: 0,
        y: enterType === 'bottom' ? 28 : enterType === 'top' ? -28 : 0,
        x: enterType === 'right' ? 28 : enterType === 'left' ? -28 : 0,
        force3D: true,
      };

      gsap.fromTo(items, fromVars, {
        opacity: 1,
        x: 0,
        y: 0,
        duration: duration / 1000,
        delay: delay / 1000,
        stagger: interval / 1000,
        ease: 'power3.out',
        force3D: true,
        clearProps: 'transform',
      });
    },
    { scope: containerRef }
  );

  return (
    <Component ref={containerRef} className={className}>
      {children}
    </Component>
  );
}

// ── Unlock Modal (Ant Motion Elastic Spring Pop-Up) ──────────────────────────
function UnlockModal({ districtName, onConfirm, onClose, playHover, playPop }) {
  const [folderInput, setFolderInput] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [error, setError] = useState('');
  const backdropRef = useRef(null);
  const modalRef = useRef(null);

  useGSAP(() => {
    if (backdropRef.current) {
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: 'power2.out' }
      );
    }
    if (modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { scale: 0.8, opacity: 0, force3D: true },
        {
          scale: 1,
          opacity: 1,
          duration: 0.55,
          ease: 'elastic.out(1, 0.6)',
          force3D: true,
        }
      );
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    playPop?.();
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
          playPop?.();
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-6 sm:p-8 will-change-transform"
      >
        {/* Close button */}
        <button
          onMouseEnter={() => playHover?.()}
          onClick={() => {
            playPop?.();
            onClose();
          }}
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
              onMouseEnter={() => playHover?.()}
              onClick={() => {
                playPop?.();
                onClose();
              }}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-slate-50 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/50 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-emerald-500/30 active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              onMouseEnter={() => playHover?.()}
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
  isSoundEnabled = false,
  onToggleSound,
}) {
  const [unlockTarget, setUnlockTarget] = useState(null); // district name being unlocked
  const dashboardScopeRef = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const isTransitioningRef = useRef(false);

  // ── Spatial Audio Hooks (use-sound / Howler) ───────────────────────────────
  const [playHover] = useSound('/sounds/hover.mp3', {
    volume: 0.25,
    soundEnabled: isSoundEnabled,
  });
  const [playPop] = useSound('/sounds/pop.mp3', {
    volume: 0.35,
    soundEnabled: isSoundEnabled,
  });
  const [playSwooshIn] = useSound('/sounds/swoosh-in.mp3', {
    volume: 0.45,
    soundEnabled: isSoundEnabled,
  });
  const [playThud] = useSound('/sounds/thud.mp3', {
    volume: 0.5,
    soundEnabled: isSoundEnabled,
  });

  const unlockedNames = Object.keys(unlockedDistricts);
  const visitedCount = unlockedNames.length;
  const lockedCount = Math.max(0, TOTAL_DISTRICTS - visitedCount);
  const latestTarget =
    unlockedNames.length > 1
      ? unlockedNames[unlockedNames.length - 1]
      : 'Chattogram';

  // ── Reverse Zoom (To Dashboard): scale: 30 -> 1 + /sounds/thud.mp3 ─────────
  useGSAP(
    () => {
      if (isReturningFromGallery && mapRef.current) {
        playThud();

        if (overlayRef.current) {
          gsap.fromTo(
            overlayRef.current,
            { autoAlpha: 1 },
            { autoAlpha: 0, duration: 0.55, ease: 'power2.out' }
          );
        }

        gsap.set(mapRef.current, {
          scale: 30,
          opacity: 0,
          force3D: true,
          transformOrigin: 'center center',
        });

        gsap.to(mapRef.current, {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: 'expo.out',
          force3D: true,
          transformOrigin: 'center center',
          clearProps: 'transform',
          onComplete: () => {
            onReturnComplete?.();
          },
        });
      }
    },
    { dependencies: [isReturningFromGallery], scope: dashboardScopeRef }
  );

  // ── Forward Zoom (To Gallery): scale: 30 + /sounds/swoosh-in.mp3 ───────────
  const handleMapClick = (districtName) => {
    if (unlockedDistricts[districtName]) {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      playSwooshIn();

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
      playPop();
      setUnlockTarget(districtName);
    }
  };

  const handleConfirmUnlock = ({ folderId, apiKey }) => {
    onUnlockDistrict(unlockTarget, { folderId, apiKey });
    setUnlockTarget(null);
  };

  return (
    <div
      ref={dashboardScopeRef}
      className="relative min-h-screen bg-slate-900 text-slate-50 selection:bg-emerald-500 selection:text-slate-950 overflow-hidden"
    >
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
        style={{
          opacity: isReturningFromGallery ? 1 : 0,
          visibility: isReturningFromGallery ? 'visible' : 'hidden',
        }}
        className="fixed inset-0 z-50 bg-black pointer-events-none"
      />

      {/* ── Spatial Audio Glassmorphism Sound Toggle Button ──────────────────── */}
      <div className="fixed top-5 right-5 z-40">
        <button
          type="button"
          onMouseEnter={() => playHover()}
          onClick={() => onToggleSound?.()}
          aria-label={isSoundEnabled ? 'Mute spatial audio' : 'Enable spatial audio'}
          title={isSoundEnabled ? 'Sound On (Click to mute)' : 'Sound Off (Click to enable nature audio)'}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold backdrop-blur-xl border shadow-xl transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-emerald-500/30 active:scale-95 cursor-pointer ${
            isSoundEnabled
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:border-emerald-500/40 hover:text-slate-50'
          }`}
        >
          {isSoundEnabled ? (
            <>
              <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="hidden sm:inline text-slate-50">Audio On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Enable Audio</span>
            </>
          )}
        </button>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* ── Header & Expedition Stats wrapped in Ant Motion <QueueAnim> ──── */}
        <QueueAnim
          type={['bottom', 'top']}
          interval={150}
          className="text-center mb-12"
        >
          <div key="header-pill" className="mb-6">
            <div
              onMouseEnter={() => playHover()}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 shadow-xl text-emerald-400 text-xs font-medium tracking-wider uppercase transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-emerald-500/30"
            >
              <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '16s' }} />
              <span className="text-slate-50 drop-shadow-md">The Travel Diaries · 64 Districts Challenge</span>
            </div>
          </div>

          <h1
            key="header-title"
            className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-tight text-slate-50 drop-shadow-md"
          >
            {Object.keys(unlockedDistricts).length}/64 Done
          </h1>

          <div key="header-subtitles">
            <p className="mt-4 text-slate-300 drop-shadow-md tracking-widest uppercase text-xs md:text-sm font-semibold">
              {lockedCount} district{lockedCount !== 1 ? 's' : ''} to go · One adventure at a time
            </p>
            <p className="mt-2 text-sm sm:text-base text-slate-300 drop-shadow-md font-medium">
              ম্যাপ থেকে যেকোনো জেলা নির্বাচন করুন · Select any district from the map
            </p>
          </div>

          {/* ── Expedition Stats Row (Staggered Bottom-to-Top via QueueAnim) ── */}
          <div key="stats-row" className="mt-8 max-w-2xl mx-auto">
            <QueueAnim
              type={['bottom', 'top']}
              interval={150}
              delay={150}
              className="grid grid-cols-3 gap-3 sm:gap-4"
            >
              <div
                key="stat-memories"
                onMouseEnter={() => playHover()}
                className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-4 text-center flex flex-col justify-center items-center transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-emerald-500/30 active:scale-95"
              >
                <Camera className="w-5 h-5 text-emerald-400 mb-2" />
                <span className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-50 drop-shadow-md">
                  550+
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mt-0.5">
                  Total Memories
                </span>
              </div>

              <div
                key="stat-districts"
                onMouseEnter={() => playHover()}
                className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-4 text-center flex flex-col justify-center items-center transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-emerald-500/30 active:scale-95"
              >
                <MapPin className="w-5 h-5 text-emerald-400 mb-2" />
                <span className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-50 drop-shadow-md">
                  {visitedCount} / 64
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mt-0.5">
                  Districts
                </span>
              </div>

              <div
                key="stat-latest"
                onMouseEnter={() => playHover()}
                className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-4 text-center flex flex-col justify-center items-center transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-emerald-500/30 active:scale-95"
              >
                <Crosshair className="w-5 h-5 text-emerald-400 mb-2" />
                <span className="text-base sm:text-xl font-extrabold tracking-tight text-slate-50 drop-shadow-md truncate max-w-full">
                  {latestTarget}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mt-0.5">
                  Latest Target
                </span>
              </div>
            </QueueAnim>
          </div>

          {/* Progress bar */}
          <div key="progress-bar" className="mt-8 max-w-sm mx-auto">
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
          <div key="count-chips" className="mt-5 flex justify-center gap-3 flex-wrap">
            <span
              onMouseEnter={() => playHover()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-emerald-500/30 active:scale-95"
            >
              <MapPin className="w-3 h-3" /> {visitedCount} Visited
            </span>
            <span
              onMouseEnter={() => playHover()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-slate-800/40 border border-slate-700/50 text-slate-300 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-emerald-500/30 active:scale-95"
            >
              <Lock className="w-3 h-3" /> {lockedCount} Locked
            </span>
          </div>
        </QueueAnim>

        {/* ── Interactive 64-District Bangladesh SVG Map (GSAP GPU Target) ──── */}
        <div
          ref={mapRef}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            willChange: 'transform, opacity',
          }}
          className="my-6 transform-gpu"
        >
          <BangladeshMap
            unlockedDistricts={unlockedDistricts}
            onDistrictClick={handleMapClick}
            playHover={playHover}
            playPop={playPop}
          />
        </div>

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
          playHover={playHover}
          playPop={playPop}
        />
      )}
    </div>
  );
}
