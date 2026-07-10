import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, FileAudio, Video, Map, Clock, Cloud, UploadCloud, ChevronRight, MapPin } from 'lucide-react';
import Background from '../components/Background';

export default function EvidenceVault() {
  const vaultItems = [
    { type: 'audio', title: 'SOS Recording #8942', date: 'Oct 12, 2026 - 23:42', duration: '04:12', location: 'Sector 42, DLF', encrypted: true, synced: true },
    { type: 'video', title: 'Auto-Capture Video', date: 'Oct 12, 2026 - 23:43', duration: '01:05', location: 'Sector 42, DLF', encrypted: true, synced: true },
    { type: 'gps', title: 'Route Deviation Timeline', date: 'Sep 28, 2026 - 19:15', duration: '12:00', location: 'MG Road', encrypted: true, synced: true },
    { type: 'audio', title: 'Voice Trigger Recording', date: 'Sep 10, 2026 - 18:30', duration: '00:45', location: 'Cyber City', encrypted: true, synced: false },
  ];

  return (
    <div className="min-h-screen relative font-sans overflow-hidden text-white pt-24 pb-32">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12"
        >
          <div>
            <div className="flex items-center gap-3 mb-3 text-royal">
              <Lock className="w-6 h-6" />
              <span className="font-bold tracking-widest uppercase text-sm">Military-Grade Encryption</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-sora text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
              Evidence Vault
            </h1>
            <p className="text-gray-400 mt-2 max-w-lg">All emergency data is instantly encrypted and beamed to decentralized cloud storage. It cannot be deleted locally.</p>
          </div>

          <div className="flex items-center gap-4 bg-glass border border-glassBorder p-4 rounded-2xl shadow-xl">
            <div className="w-12 h-12 rounded-full bg-emeraldLight/20 flex items-center justify-center">
              <Cloud className="w-6 h-6 text-emeraldLight" />
            </div>
            <div>
              <div className="text-sm text-gray-400 font-medium">Cloud Sync Status</div>
              <div className="text-emeraldLight font-bold">100% Secured</div>
            </div>
          </div>
        </motion.div>

        {/* Sync Simulation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full bg-gradient-to-r from-royal/20 to-indigo/20 border border-royal/30 rounded-3xl p-6 mb-10 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo/40 flex items-center justify-center animate-pulse">
              <UploadCloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold">Continuous Backup Active</div>
              <div className="text-sm text-gray-300">Unsaid is currently monitoring network integrity.</div>
            </div>
          </div>
          <button className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-sm font-semibold transition-colors">
            Force Verify
          </button>
        </motion.div>

        {/* Vault List */}
        <div className="space-y-4">
          <h2 className="font-sora font-semibold text-xl mb-4 text-gray-300">Recent Captures</h2>

          {vaultItems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (idx * 0.1) }}
              className="group relative bg-card/60 backdrop-blur-md border border-glassBorder rounded-2xl p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-glass hover:border-gray-600 transition-all cursor-pointer overflow-hidden"
            >
              {/* Highlight bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-royal to-electric opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${item.type === 'audio' ? 'bg-pink-500/20 text-pink-400' :
                  item.type === 'video' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                  {item.type === 'audio' && <FileAudio className="w-6 h-6" />}
                  {item.type === 'video' && <Video className="w-6 h-6" />}
                  {item.type === 'gps' && <Map className="w-6 h-6" />}
                </div>

                <div>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {item.date} • {item.duration}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {item.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 md:gap-2">
                <div className="flex gap-2">
                  {item.encrypted && (
                    <div className="bg-gray-800/80 border border-gray-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 text-goldLight">
                      <Lock className="w-3 h-3" /> Encrypted
                    </div>
                  )}
                  {item.synced ? (
                    <div className="bg-emerald-900/40 border border-emerald-900/50 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 text-emeraldLight">
                      <Cloud className="w-3 h-3" /> Synced
                    </div>
                  ) : (
                    <div className="bg-yellow-900/40 border border-yellow-900/50 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 text-yellow-500 animate-pulse">
                      <UploadCloud className="w-3 h-3" /> Syncing...
                    </div>
                  )}
                </div>

                <div className="hidden md:flex items-center text-gray-500 group-hover:text-white transition-colors text-sm font-semibold">
                  View Data <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
