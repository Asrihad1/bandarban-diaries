import { useRef, useEffect, useCallback } from 'react';
import { Howl } from 'howler';

// ── Shared Web Audio Context for crisp procedural fallback / spatial layer ───
let sharedAudioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

// ── Procedural Spatial Audio Synthesizer (Zero-Latency Supplement/Fallback) ──
function playProceduralEffect(url, volume = 0.3) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (url.includes('hover')) {
    // Soft high-frequency tick
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(650, now + 0.035);
    gain.gain.setValueAtTime(volume * 0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  } else if (url.includes('pop')) {
    // Crisp tactile pop
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.065);
    gain.gain.setValueAtTime(volume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } else if (url.includes('swoosh-in')) {
    // Filtered white-noise spatial swoosh
    const bufferSize = Math.floor(ctx.sampleRate * 0.65);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.2, now);
    filter.frequency.setValueAtTime(180, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + 0.32);
    filter.frequency.exponentialRampToValueAtTime(240, now + 0.62);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume * 0.45, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.64);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.65);
  } else if (url.includes('thud')) {
    // Deep physical sub-bass landing thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.32);
    gain.gain.setValueAtTime(volume * 0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);
  }
}

// ── Procedural Ambient Forest Wind Loop ──────────────────────────────────────
function createAmbientForestLoop(volume = 0.15) {
  const ctx = getAudioContext();
  if (!ctx) return null;

  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = data[i];
    data[i] *= 1.8;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(340, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume * 0.25, ctx.currentTime);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  return {
    stop: () => {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Ignore if already stopped
      }
    },
  };
}

/**
 * `useSound` hook powered by Howler (`Howl`) with automatic Web Audio synthesis
 * fallback so `/sounds/*.mp3` triggers work even before custom MP3 assets are dropped in.
 */
export function useSound(
  url,
  { volume = 0.5, loop = false, soundEnabled = true } = {}
) {
  const howlRef = useRef(null);
  const loadedRef = useRef(false);
  const ambientNodeRef = useRef(null);

  useEffect(() => {
    const howl = new Howl({
      src: [url],
      volume,
      loop,
      preload: true,
      onload: () => {
        loadedRef.current = true;
      },
      onloaderror: () => {
        loadedRef.current = false;
      },
    });
    howlRef.current = howl;

    return () => {
      howl.unload();
      if (ambientNodeRef.current) {
        ambientNodeRef.current.stop();
        ambientNodeRef.current = null;
      }
    };
  }, [url, volume, loop]);

  const stop = useCallback(() => {
    if (howlRef.current) {
      howlRef.current.stop();
    }
    if (ambientNodeRef.current) {
      ambientNodeRef.current.stop();
      ambientNodeRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    if (!soundEnabled) return;

    if (loadedRef.current && howlRef.current) {
      if (loop && howlRef.current.playing()) return;
      howlRef.current.play();
      return;
    }

    // Fallback to Web Audio synthesis if MP3 file isn't present in /public/sounds
    if (loop) {
      if (!ambientNodeRef.current) {
        ambientNodeRef.current = createAmbientForestLoop(volume);
      }
    } else {
      playProceduralEffect(url, volume);
    }
  }, [soundEnabled, loop, url, volume]);

  return [play, { stop }];
}

export default useSound;
