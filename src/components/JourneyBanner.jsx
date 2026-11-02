import React from 'react';
import { motion } from 'framer-motion';
import { Navigation, Mountain, Sunrise, Eye, Footprints, Shield, Compass } from 'lucide-react';

const waypoints = [
  {
    name: 'Cumilla',
    tag: 'Origin',
    desc: 'The dawn rendezvous. 9 backpacks packed, fueling anticipation for the high country.',
    icon: Navigation,
  },
  {
    name: 'Chakaria',
    tag: 'Transit',
    desc: 'The highway crossroads where coastal plains yield to the emerald hill slopes.',
    icon: Compass,
  },
  {
    name: 'Alikadam',
    tag: 'Valley',
    desc: 'Nestled between the Matamuhuri river and soaring ridgelines.',
    icon: Mountain,
  },
  {
    name: 'Alir Guha',
    tag: 'Cavern',
    desc: 'Torches ablaze through narrow rock fissures and subterranean stone corridors.',
    icon: Eye,
  },
  {
    name: 'Dim Pahar',
    tag: 'Summit',
    desc: 'Bangladesh’s highest motorable pass (2,500 ft). Driving right through the cloudline.',
    icon: Sunrise,
  },
  {
    name: 'Toma Tungi',
    tag: 'Viewpoint',
    desc: 'Endless rolling hill tiers stretching as far as the visual horizon.',
    icon: Shield,
  },
  {
    name: 'Thanchi',
    tag: 'Heartland',
    desc: 'The wild frontier town resting on the pristine emerald waters of the Sangu.',
    icon: Footprints,
  },
];

export default function JourneyBanner() {
  return (
    <section className="relative z-10 py-16 bg-white/5 border-y border-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-12 will-change-transform transform-gpu"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
            The Route & Milestones
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
            Across Karst Caves & Sky-High Passes
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-2">
            Tracing every checkpoint from Cumilla all the way into the remote wilderness of Thanchi.
          </p>
        </motion.div>

        {/* Horizontal Waypoint Track */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {waypoints.map((wp, i) => {
            const Icon = wp.icon;
            return (
              <motion.div
                key={wp.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] hover:border-cyan-500/40 transition-all duration-300 hover:-translate-y-1 will-change-transform transform-gpu"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2 rounded-xl bg-white/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                      0{i + 1} • {wp.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                    {wp.name}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                    {wp.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

