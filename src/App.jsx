import React, { useState, useCallback, useRef } from 'react';
import HomeDashboard from './components/HomeDashboard';
import Hero from './components/Hero';
import JourneyBanner from './components/JourneyBanner';
import Gallery from './components/Gallery';
import FloatingBar from './components/FloatingBar';
import Footer from './components/Footer';
import { fetchAllDriveMedia } from './services/driveService';

const STORAGE_KEY = 'bangladesh_64_unlocked_districts';
const DEFAULT_FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || '1BNXR0LUJFUmhCIOvgMg_wp7M6LhCfPTr';

function getInitialUnlocked() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        Bandarban: DEFAULT_FOLDER_ID, // permanently unlocked
      };
    }
  } catch (err) {
    console.error('Error reading unlocked districts from localStorage:', err);
  }
  return { Bandarban: DEFAULT_FOLDER_ID };
}

export default function App() {
  // ── Unlocked districts state (persisted via localStorage) ─────────────────────
  const [unlockedDistricts, setUnlockedDistricts] = useState(getInitialUnlocked);

  // ── View routing ─────────────────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'gallery'
  const [activeDistrict, setActiveDistrict] = useState('Bandarban');
  const [activeFolderId, setActiveFolderId] = useState(DEFAULT_FOLDER_ID);

  // ── Media state ─────────────────────────────────────────────────────────────
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [error, setError] = useState(null);

  // ── Selection state (photos + videos) ───────────────────────────────────────
  const [selectedFiles, setSelectedFiles] = useState([]);
  const abortControllerRef = useRef(null);

  // ── Load Drive media for a given folder (with AbortController protection) ───
  const loadMedia = useCallback(async (folderId) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setLoadedCount(0);

    try {
      const files = await fetchAllDriveMedia(
        (count) => setLoadedCount(count),
        folderId,
        controller.signal
      );
      if (!controller.signal.aborted) {
        setMedia(files);
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setError(err.message || 'Unable to load media from Google Drive.');
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  // ── Unlock district handler ──────────────────────────────────────────────────
  const handleUnlockDistrict = useCallback((name, folderId) => {
    setUnlockedDistricts((prev) => {
      const updated = {
        ...prev,
        [name]: folderId,
        Bandarban: DEFAULT_FOLDER_ID, // ensure Bandarban is kept
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving unlocked districts to localStorage:', err);
      }
      return updated;
    });
  }, []);

  // ── Navigation handlers ──────────────────────────────────────────────────────
  const handleSelectDistrict = useCallback((name, folderId) => {
    const targetFolder = folderId || DEFAULT_FOLDER_ID;
    setActiveDistrict(name);
    setActiveFolderId(targetFolder);
    setMedia([]);
    setSelectedFiles([]);
    setCurrentView('gallery');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadMedia(targetFolder);
  }, [loadMedia]);

  const handleBackToHome = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setCurrentView('home');
    setSelectedFiles([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
      const kept = prev.filter((f) => !newIds.has(f.id));
      return [...kept, ...files];
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  // ── Scroll helpers ───────────────────────────────────────────────────────────
  const scrollToGallery = () =>
    document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: 'smooth' });

  // ── Render ───────────────────────────────────────────────────────────────────
  if (currentView === 'home') {
    return (
      <HomeDashboard
        unlockedDistricts={unlockedDistricts}
        onSelectDistrict={handleSelectDistrict}
        onUnlockDistrict={handleUnlockDistrict}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">

      <Hero
        districtName={activeDistrict}
        totalMedia={media.length}
        onScrollToGallery={scrollToGallery}
      />

      {activeDistrict === 'Bandarban' && <JourneyBanner />}

      <Gallery
        districtName={activeDistrict}
        media={media}
        isLoading={isLoading}
        loadedCount={loadedCount}
        error={error}
        selectedFiles={selectedFiles}
        onToggleSelect={handleToggleSelect}
        onRetry={() => loadMedia(activeFolderId)}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onBack={handleBackToHome}
      />

      <Footer onScrollToTop={scrollToTop} />

      {/* Floating action bar — appears when ≥1 file is selected */}
      <FloatingBar
        selectedFiles={selectedFiles}
        onClearSelection={handleClearSelection}
      />
    </div>
  );
}