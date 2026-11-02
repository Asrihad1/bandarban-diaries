import React, { useState, useCallback, useRef, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from './services/firebase';
import HomeDashboard from './components/HomeDashboard';
import Hero from './components/Hero';
import JourneyBanner from './components/JourneyBanner';
import Gallery from './components/Gallery';
import FloatingBar from './components/FloatingBar';
import Footer from './components/Footer';
import { fetchAllDriveMedia } from './services/driveService';

const DEFAULT_FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || '1BNXR0LUJFUmhCIOvgMg_wp7M6LhCfPTr';
const DEFAULT_API_KEY = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY || '';

/** Bandarban defaults to the credentials from .env. */
const BANDARBAN_DISTRICT = { folderId: DEFAULT_FOLDER_ID, apiKey: DEFAULT_API_KEY };

/** Unique cache key per folder + account, so the same folder via another key is a separate load. */
const sourceKey = (folderId, apiKey) => `${folderId}::${apiKey}`;

/**
 * Normalises a district entry to `{ folderId, apiKey }`.
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

export default function App() {
  // ── Unlocked districts state: { [name]: { folderId, apiKey } } (synced via Firestore) ──
  const [unlockedDistricts, setUnlockedDistricts] = useState({
    Bandarban: BANDARBAN_DISTRICT,
  });

  // ── View routing ─────────────────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'gallery'
  const [isReturningFromGallery, setIsReturningFromGallery] = useState(false);
  const [activeDistrict, setActiveDistrict] = useState('Bandarban');
  const [activeFolderId, setActiveFolderId] = useState(DEFAULT_FOLDER_ID);
  const [activeApiKey, setActiveApiKey] = useState(DEFAULT_API_KEY);

  // ── Media state ─────────────────────────────────────────────────────────────
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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

  // ── Real-time Firestore listener for unlocked districts ──────────────────────
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'unlocked_districts'),
      (snapshot) => {
        const districts = { Bandarban: BANDARBAN_DISTRICT };
        snapshot.docs.forEach((docSnap) => {
          const { folderId, apiKey } = docSnap.data() || {};
          if (folderId) {
            districts[docSnap.id] = {
              folderId,
              apiKey: apiKey || DEFAULT_API_KEY,
            };
          }
        });
        setUnlockedDistricts(districts);
      },
      (err) => {
        console.error('Error syncing unlocked districts from Firestore:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  // ── Unlock district handler (writes to Firestore) ────────────────────────────
  const handleUnlockDistrict = useCallback(async (districtName, { folderId, apiKey }) => {
    try {
      await setDoc(doc(db, 'unlocked_districts', districtName), { folderId, apiKey });
    } catch (err) {
      console.error('Error unlocking district in Firestore:', err);
    }
  }, []);

  // ── Navigation handlers ──────────────────────────────────────────────────────
  const handleSelectDistrict = useCallback((name, district) => {
    const resolved = district || unlockedDistricts[name];
    const { folderId, apiKey } = normalizeDistrict(resolved) || BANDARBAN_DISTRICT;
    window.history.pushState({ view: 'gallery', district: name }, '', '');
    setActiveDistrict(name);
    setActiveFolderId(folderId);
    setActiveApiKey(apiKey);
    setSelectedFiles([]);
    setCurrentView('gallery');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Reuse media that's already loaded (or still loading) for this folder + key
    const key = sourceKey(folderId, apiKey);
    const alreadyLoaded = loadedSourceRef.current === key;
    const alreadyLoading = pendingSourceRef.current === key;
    if (alreadyLoaded || alreadyLoading) return;

    setMedia([]);
    loadMedia(folderId, apiKey);
  }, [loadMedia, unlockedDistricts]);

  const handleBackToHome = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    pendingSourceRef.current = null;
    setIsReturningFromGallery(true);
    setCurrentView('home');
    setSelectedFiles([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ── Hardware back button / mobile swipe-back listener ────────────────────────
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state?.view !== 'gallery') {
        handleBackToHome();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleBackToHome]);

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
        isReturningFromGallery={isReturningFromGallery}
        onReturnComplete={() => setIsReturningFromGallery(false)}
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-900 text-slate-50 selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
      {/* Dark Nature Background & Heavy Slate Overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&q=80&w=2000"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-[2px]" />
      </div>

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

      <Footer
        onScrollToTop={scrollToTop}
        districtName={activeDistrict}
        folderId={activeFolderId}
      />

      {/* Floating action bar — appears when ≥1 file is selected */}
      <FloatingBar
        selectedFiles={selectedFiles}
        apiKey={activeApiKey}
        onClearSelection={handleClearSelection}
      />
    </div>
  );
}