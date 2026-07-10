import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, ShieldCheck, Zap, Globe, Lock, User } from 'lucide-react';
import Background from '../components/Background';

export default function Landing() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 10 } }
  };

  return (
    <div className="min-h-screen relative font-sans overflow-hidden bg-[#f8f9fc]">
      <Background />

      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal to-electric p-0.5 shadow-[0_0_15px_rgba(109,40,217,0.3)]">
            <div className="w-full h-full bg-gray-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-electric" />
            </div>
          </div>
          <span className="font-sora font-bold text-xl tracking-tight text-gray-900 drop-shadow-sm">SafeSphere</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-bold text-gray-800 drop-shadow-sm">
          <a href="#features" className="hover:text-royal transition-colors">Features</a>
          <a href="#technology" className="hover:text-royal transition-colors">AI Technology</a>
          <a href="#guardian" className="hover:text-royal transition-colors">For Guardians</a>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-5 py-2.5 text-sm font-bold text-gray-900 hover:text-royal transition-colors drop-shadow-sm">Sign In</Link>
          <Link to="/register" className="px-5 py-2.5 text-sm font-bold bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors shadow-lg">Get Started</Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-32 flex flex-col lg:flex-row items-center">

        <motion.div
          className="lg:w-1/2 flex flex-col items-start gap-8 glass-panel p-10 md:mr-10 relative overflow-hidden bg-white/40"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-royal/10 blur-[100px] rounded-full pointer-events-none"></div>

          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white/40 text-xs font-bold text-green-700 uppercase tracking-widest backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></span>
            SafeSphere AI is Live
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-6xl md:text-7xl font-bold font-sora leading-[1.1] tracking-tight text-gray-900 drop-shadow-sm">
            Intelligent <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-violet-700 drop-shadow-md">
              Protection.
            </span><br />
            Absolute <br />
            Confidence.
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-800 max-w-lg leading-relaxed font-semibold">
            The ultimate AI-powered safety ecosystem designed to empower women. Navigate the world with a personalized guardian that proactively ensures your security.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
            <Link to="/register" className="group relative px-8 py-4 bg-gray-900 text-white rounded-full font-bold overflow-hidden text-center shadow-xl hover:shadow-2xl transition-all">
              <span className="relative flex items-center justify-center gap-2">
                Activate Guardian <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link to="/dashboard" className="px-8 py-4 rounded-full font-bold text-gray-900 bg-white/30 border border-gray-400 hover:bg-white/50 transition-colors flex items-center justify-center backdrop-blur-md shadow-sm">
              View Demo
            </Link>
          </motion.div>

          <motion.div variants={itemVariants} className="flex items-center gap-6 mt-8">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`w-12 h-12 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center shadow-md z-[${5 - i}]`}>
                  <User className="w-5 h-5 text-gray-500" />
                </div>
              ))}
            </div>
            <div className="text-sm">
              <div className="font-bold text-gray-900 text-lg drop-shadow-sm">100,000+</div>
              <div className="text-gray-700 font-bold">Journeys Protected</div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="lg:w-1/2 mt-20 lg:mt-0 relative w-full aspect-square max-w-xl mx-auto flex items-center justify-center"
        >
          <div className="absolute w-[110%] h-[110%] border-2 border-royal/20 rounded-full animate-[spin_30s_linear_infinite] shadow-lg"></div>
          <div className="absolute w-[80%] h-[80%] border-2 border-electric/30 rounded-full animate-[spin_20s_linear_infinite_reverse] shadow-md"></div>

          <div className="relative w-80 h-80">
            <motion.div
              animate={{ y: [-15, 15, -15], rotate: [0, 2, -2, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-br from-royal via-indigo to-electric rounded-[40px] rotate-12 opacity-60 blur-xl mix-blend-multiply"
            ></motion.div>

            <motion.div
              animate={{ y: [-15, 15, -15] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 glass-panel p-8 flex flex-col justify-between bg-white/50 !border-white/50 shadow-2xl"
            >
              <div className="flex justify-between items-start">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl border border-emerald-200 shadow-sm">
                  <ShieldCheck className="w-7 h-7 flex-shrink-0" />
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600 font-bold uppercase tracking-widest mb-1">Status</div>
                  <div className="text-emerald-600 font-bold text-lg drop-shadow-sm">Secure</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="w-full bg-white/60 rounded-xl border border-white/80 p-4 flex items-center gap-4 backdrop-blur-md shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 border border-blue-200">
                    <Globe className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Live Tracking</div>
                    <div className="text-xs text-emerald-600 font-bold mt-0.5">Guardian Network Active</div>
                  </div>
                </div>
                <div className="w-full bg-white/60 rounded-xl border border-white/80 p-4 flex items-center justify-between backdrop-blur-md shadow-sm">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-amber-500 drop-shadow-sm" />
                    <span className="font-bold text-sm text-gray-900">AI Unsaid Companion</span>
                  </div>
                  <div className="w-10 h-5 rounded-full bg-emerald-500 hidden sm:flex items-center px-1 shadow-sm">
                    <div className="w-3 h-3 rounded-full bg-white ml-auto"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
