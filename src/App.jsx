import React, { useState, useCallback, useRef, useEffect } from 'react';
import HomeDashboard from './components/HomeDashboard';
import Hero from './components/Hero';
import JourneyBanner from './components/JourneyBanner';
import Gallery from './components/Gallery';
import FloatingBar from './components/FloatingBar';
import Footer from './components/Footer';
import { fetchAllDriveMedia } from './services/driveService';

const STORAGE_KEY = 'bangladesh_64_unlocked_districts';
const DEFAULT_FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || '1BNXR0LUJFUmhCIOvgMg_wp7M6LhCfPTr';
const DEFAULT_API_KEY = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY || '';

/** Bandarban always uses the credentials from .env (never read from / written to localStorage). */
const BANDARBAN_DISTRICT = { folderId: DEFAULT_FOLDER_ID, apiKey: DEFAULT_API_KEY };

/** Unique cache key per folder + account, so the same folder via another key is a separate load. */
const sourceKey = (folderId, apiKey) => `${folderId}::${apiKey}`;

/**
 * Normalises a stored district entry to `{ folderId, apiKey }`.
 * Legacy entries saved before multi-account support were plain folder-ID strings;
 * those are migrated to use the default .env API key.
 */
function normalizeDistrict(entry) {
  if (typeof entry === 'string') {
    return entry ? { folderId: entry, apiKey: DEFAULT_API_KEY } : null;
  }
  if (entry && typeof entry === 'object' && entry.folderId) {
    return { folderId: entry.folderId, apiKey: entry.apiKey || DEFAULT_API_KEY };
  }
  return null;
}

function getInitialUnlocked() {
  const result = {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      for (const [name, entry] of Object.entries(parsed || {})) {
        const district = normalizeDistrict(entry);
        if (district) result[name] = district;
      }
    }
  } catch (err) {
    console.error('Error reading unlocked districts from localStorage:', err);
  }
  // Bandarban first + permanently unlocked with .env credentials
  delete result.Bandarban;
  return { Bandarban: BANDARBAN_DISTRICT, ...result };
}

function persistUnlocked(districts) {
  try {
    const custom = { ...districts };
    delete custom.Bandarban; // .env-backed, no need to store its key in the browser
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
  } catch (err) {
    console.error('Error saving unlocked districts to localStorage:', err);
  }
}

export default function App() {
  // ── Unlocked districts state: { [name]: { folderId, apiKey } } (persisted) ────
  const [unlockedDistricts, setUnlockedDistricts] = useState(getInitialUnlocked);

  // ── View routing ─────────────────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'gallery'
  const [activeDistrict, setActiveDistrict] = useState('Bandarban');
  const [activeFolderId, setActiveFolderId] = useState(DEFAULT_FOLDER_ID);
  const [activeApiKey, setActiveApiKey] = useState(DEFAULT_API_KEY);

  // ── Media state ─────────────────────────────────────────────────────────────
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Bandarban is fetched on app load
  const [loadedCount, setLoadedCount] = useState(0);
  const [error, setError] = useState(null);

  // ── Selection state (photos + videos) ───────────────────────────────────────
  const [selectedFiles, setSelectedFiles] = useState([]);
  const abortControllerRef = useRef(null);
  const pendingSourceRef = useRef(null); // folder+key currently being fetched
  const loadedSourceRef = useRef(null);  // folder+key whose media is currently in `media`

  // ── Load Drive media for a given folder + API key (with AbortController) ─────
  const loadMedia = useCallback(async (folderId, apiKey) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    pendingSourceRef.current = sourceKey(folderId, apiKey);
    loadedSourceRef.current = null;

    setIsLoading(true);
    setError(null);
    setLoadedCount(0);

    try {
      const files = await fetchAllDriveMedia(
        (count) => setLoadedCount(count),
        folderId,
        apiKey,
        controller.signal
      );
      if (!controller.signal.aborted) {
        setMedia(files);
        loadedSourceRef.current = sourceKey(folderId, apiKey);
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setError(err.message || 'Unable to load media from Google Drive.');
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
        pendingSourceRef.current = null;
      }
    }
  }, []);

  // ── Fetch Bandarban media immediately on app load (powers the Spotlight on Home) ──
  // State is only set inside async callbacks, so this effect purely syncs with Drive.
  useEffect(() => {
    const controller = new AbortController();
    const { folderId, apiKey } = BANDARBAN_DISTRICT;
    abortControllerRef.current = controller;
    pendingSourceRef.current = sourceKey(folderId, apiKey);

    fetchAllDriveMedia((count) => setLoadedCount(count), folderId, apiKey, controller.signal)
      .then((files) => {
        if (controller.signal.aborted) return;
        setMedia(files);
        loadedSourceRef.current = sourceKey(folderId, apiKey);
      })
      .catch((err) => {
        if (err?.name === 'AbortError' || controller.signal.aborted) return;
        setError(err.message || 'Unable to load media from Google Drive.');
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setIsLoading(false);
        pendingSourceRef.current = null;
      });

    return () => controller.abort();
  }, []);

  // ── Unlock district handler ──────────────────────────────────────────────────
  const handleUnlockDistrict = useCallback((name, { folderId, apiKey }) => {
    setUnlockedDistricts((prev) => {
      const updated = {
        ...prev,
        [name]: { folderId, apiKey },
        Bandarban: BANDARBAN_DISTRICT, // ensure Bandarban is kept
      };
      persistUnlocked(updated);
      return updated;
    });
  }, []);

  // ── Navigation handlers ──────────────────────────────────────────────────────
  const handleSelectDistrict = useCallback((name, district) => {
    const { folderId, apiKey } = normalizeDistrict(district) || BANDARBAN_DISTRICT;
    setActiveDistrict(name);
    setActiveFolderId(folderId);
    setActiveApiKey(apiKey);
    setSelectedFiles([]);
    setCurrentView('gallery');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Reuse media that's already loaded (or still loading) for this folder + key —
    // e.g. Bandarban, which is prefetched on app load for the Spotlight.
    const key = sourceKey(folderId, apiKey);
    const alreadyLoaded = loadedSourceRef.current === key;
    const alreadyLoading = pendingSourceRef.current === key;
    if (alreadyLoaded || alreadyLoading) return;

    setMedia([]);
    loadMedia(folderId, apiKey);
  }, [loadMedia]);

  const handleBackToHome = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    pendingSourceRef.current = null;
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
        media={media}
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
        apiKey={activeApiKey}
        media={media}
        isLoading={isLoading}
        loadedCount={loadedCount}
        error={error}
        selectedFiles={selectedFiles}
        onToggleSelect={handleToggleSelect}
        onRetry={() => loadMedia(activeFolderId, activeApiKey)}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onBack={handleBackToHome}
      />

      <Footer onScrollToTop={scrollToTop} />

      {/* Floating action bar — appears when ≥1 file is selected */}
      <FloatingBar
        selectedFiles={selectedFiles}
        apiKey={activeApiKey}
        onClearSelection={handleClearSelection}
      />
    </div>
  );
}