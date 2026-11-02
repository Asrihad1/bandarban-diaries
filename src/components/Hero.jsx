import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Compass, MapPin, Users, Sparkles } from 'lucide-react';

const WAYPOINTS = [
  'Cumilla', 'Chakaria', 'Alikadam', 'Alir Guha', 'Dim Pahar', 'Toma Tungi', 'Thanchi',
];

export default function Hero({ totalMedia, onScrollToGallery, districtName = 'Travel' }) {
  const isBandarban = districtName === 'Bandarban';

  return (
    <section className="relative z-10 min-h-screen flex flex-col justify-between items-center text-center px-4 py-12 overflow-hidden bg-black">

      {/* Ambient OLED Aurora glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-900/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.12),transparent)]" />
      </div>

      {/* Top pill */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] text-cyan-400 text-xs font-medium tracking-wider uppercase will-change-transform transform-gpu"
      >
        <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '16s' }} />
        The Travel Diaries · {districtName} Expedition
      </motion.div>

      {/* Hero copy */}
      <div className="relative z-10 max-w-5xl mx-auto my-auto flex flex-col items-center">
        <motion.h1
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white leading-[1.05] will-change-transform transform-gpu"
        >
          The Travel Diaries:<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
            {districtName} Chapter
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mt-6 text-lg sm:text-2xl text-gray-400 font-light tracking-wide max-w-2xl will-change-transform transform-gpu"
        >
          <span className="text-cyan-400 font-medium">{totalMedia || 0} Memories.</span>{' '}
          Exploring {districtName} · 64 Districts Challenge.
        </motion.p>

        {/* Route waypoints */}
        {isBandarban && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-8 flex flex-wrap justify-center items-center gap-2 max-w-3xl will-change-transform transform-gpu"
          >
            {WAYPOINTS.map((stop, i) => (
              <React.Fragment key={stop}>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium text-gray-300 bg-white/5 border border-white/10 backdrop-blur-xl hover:border-cyan-500/40 transition-colors">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  {stop}
                </span>
                {i < WAYPOINTS.length - 1 && <span className="text-white/30 text-xs">→</span>}
              </React.Fragment>
            ))}
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4 will-change-transform transform-gpu"
        >
          <button
            onClick={onScrollToGallery}
            className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 transition-transform group-hover:rotate-12" />
            Explore & Download
          </button>
          <div className="flex items-center gap-2 text-xs text-gray-400 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            Select photos & videos → bulk-download in original quality
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        onClick={onScrollToGallery}
        className="relative z-10 flex flex-col items-center gap-2 cursor-pointer"
      >
        <span className="text-xs uppercase tracking-widest text-gray-400 hover:text-cyan-400 transition-colors">
          Scroll to explore
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="p-1.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-cyan-400"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  );
}
