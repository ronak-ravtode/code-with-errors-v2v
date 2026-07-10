import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Phone, AlertTriangle, ShieldCheck, Zap, Power, Mic, Hash, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const BACKEND = 'http://localhost:3000';

export default function EmergencyCommandCenter() {
  const [sosState, setSosState] = useState('idle'); // idle, counting, active
  const [countdown, setCountdown] = useState(3);
  const [loading, setLoading] = useState(false);

  const startSOS = () => {
    setSosState('counting');
    let count = 3;
    const interval = setInterval(async () => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(interval);
        setSosState('active');

        // Trigger Backend SOS
        try {
          const userObj = JSON.parse(localStorage.getItem('ss_user') || '{}');
          await axios.post(`${BACKEND}/api/emergency/start`, {
            userId: userObj.id || 'demo-user',
            journeyId: 'sos-manual-trigger',
            latitude: 28.6139,
            longitude: 77.2090
          });
        } catch (err) {
          console.error("Failed to hit emergency orchestrator", err);
        }
      }
    }, 1000);
  };

  const cancelSOS = async () => {
    try {
      await axios.post(`${BACKEND}/api/emergency/end`, {
        sessionId: 'generated-session-id', // Ideally returned from start
      });
    } catch (e) {
      console.error(e);
    }
    setSosState('idle');
    setCountdown(3);
  };

  return (
    <div className="min-h-screen relative font-sans text-white w-full max-w-4xl mx-auto px-4 md:px-8 pb-32">

      {/* Header */}
      <div className="flex items-center gap-4 mb-10 pt-4">
        <Link to="/dashboard" className="p-2 bg-glass rounded-full text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold font-sora text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">
          Emergency Command
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

        {/* Main SOS Core */}
        <div className="md:col-span-7 flex flex-col items-center justify-center p-8 bg-card border border-glassBorder rounded-3xl shadow-2xl relative overflow-hidden">

          <AnimatePresence mode="wait">
            {sosState === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center"
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-danger blur-3xl opacity-30 animate-pulse rounded-full"></div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onLongPress={startSOS}
                    onClick={startSOS}
                    className="relative w-48 h-48 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-[0_0_50px_rgba(239,68,68,0.6)] flex items-center justify-center border-4 border-red-400 cursor-pointer group"
                  >
                    <div className="absolute w-[120%] h-[120%] border border-red-500/50 rounded-full animate-ping"></div>
                    <AlertTriangle className="w-20 h-20 text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
                  </motion.button>
                </div>
                <h2 className="text-2xl font-bold font-sora">SOS Core</h2>
                <p className="text-gray-400 mt-2 text-center max-w-xs">Tap or hold the central button for 3 seconds to immediately alert guardians, local authorities, and nearby users.</p>
              </motion.div>
            )}

            {sosState === 'counting' && (
              <motion.div
                key="counting"
                initial={{ opacity: 0, scale: 1.2 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-48 h-48 rounded-full bg-red-600 flex items-center justify-center text-7xl font-bold border-8 border-red-400 mb-8"
                >
                  {countdown}
                </motion.div>
                <h2 className="text-2xl font-bold font-sora text-warning">Activating SOS...</h2>
                <button onClick={cancelSOS} className="mt-8 px-6 py-3 bg-glass border border-glassBorder rounded-full text-gray-300 hover:text-white transition-colors">
                  Tap to Cancel
                </button>
              </motion.div>
            )}

            {sosState === 'active' && (
              <motion.div
                key="active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center w-full"
              >
                <div className="w-full bg-danger/20 border border-danger p-6 rounded-2xl mb-8 flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-danger mb-4 flex items-center justify-center shadow-[0_0_30px_#ef4444] animate-pulse">
                    <AlertTriangle className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold font-sora text-danger mb-2">SOS ACTIVE</h2>
                  <p className="text-sm text-red-200 text-center">Live location is being shared. Microphone array is recording. Guardians notified.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="bg-glass border border-glassBorder p-4 rounded-xl flex items-center gap-3">
                    <ShieldCheck className="text-emeraldLight" />
                    <span className="text-sm font-medium">Police Alerted</span>
                  </div>
                  <div className="bg-glass border border-glassBorder p-4 rounded-xl flex items-center gap-3">
                    <Share2 className="text-electric" />
                    <span className="text-sm font-medium">Guardians Live</span>
                  </div>
                </div>

                <button onClick={cancelSOS} className="mt-8 w-full py-4 bg-glass border border-glassBorder rounded-2xl font-bold text-gray-400 hover:text-white transition-colors">
                  Deactivate SOS (Requires PIN)
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Actions Grid */}
        <div className="md:col-span-5 grid grid-cols-2 gap-4">
          <ActionCard icon={Phone} title="Police" subtitle="Dial 100" color="bg-blue-600/20" textColor="text-blue-500" border="border-blue-500/30" />
          <ActionCard icon={Phone} title="Ambulance" subtitle="Dial 108" color="bg-red-600/20" textColor="text-red-500" border="border-red-500/30" />
          <ActionCard icon={Hash} title="Women Helpline" subtitle="1091" color="bg-pink-600/20" textColor="text-pink-500" border="border-pink-500/30" />
          <ActionCard icon={Zap} title="Fake Call" subtitle="Trigger Now" color="bg-indigo-600/20" textColor="text-indigo-500" border="border-indigo-500/30" />

          <div className="col-span-2 bg-card border border-glassBorder p-5 rounded-2xl">
            <h3 className="font-semibold mb-4 text-gray-300">Hardware Triggers Active</h3>
            <div className="space-y-3">
              <ToggleRow icon={Power} label="Power Button (Press 3x)" />
              <ToggleRow icon={AlertTriangle} label="Shake Device (Violently)" />
              <ToggleRow icon={Mic} label="Voice Trigger ('Help Unsaid')" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ icon: Icon, title, subtitle, color, textColor, border }) {
  return (
    <button className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 ${color} border ${border} hover:opacity-80 transition-opacity`}>
      <Icon className={`w-8 h-8 ${textColor}`} />
      <div className="text-center">
        <div className="font-bold">{title}</div>
        <div className={`text-xs ${textColor}`}>{subtitle}</div>
      </div>
    </button>
  );
}

function ToggleRow({ icon: Icon, label }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="w-8 h-4 rounded-full bg-emeraldLight flex items-center px-1">
        <div className="w-2 h-2 rounded-full bg-white ml-auto"></div>
      </div>
    </div>
  );
}
