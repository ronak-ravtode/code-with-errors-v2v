import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Brain, ArrowRight, HeartPulse, Route, MapPin, Activity, Bell, FileText, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const stagger = {
    visible: { transition: { staggerChildren: 0.1 } }
};

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('ss_user');
        if (stored) setUser(JSON.parse(stored));
    }, []);

    return (
        <div className="min-h-screen pt-24 px-6 md:px-12 max-w-7xl mx-auto relative z-10 w-full">
            {/* Welcome Header */}
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold font-sora text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700 mb-2">
                        Welcome, <span className="text-gray-900">{user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Guardian'}</span>
                    </h1>
                    <p className="text-gray-700 text-lg">Your SafeSphere command center is active.</p>
                </div>

                <div className="flex gap-4">
                    <Link to="/profile" className="glass-button px-5 py-2.5 flex items-center gap-2 group">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" />
                        <span className="text-sm font-medium text-emerald-400 group-hover:text-emerald-300 transition-colors">System Online</span>
                    </Link>
                </div>
            </motion.div>

            {/* Main Grid */}
            <motion.div
                initial="hidden" animate="visible" variants={stagger}
                className="grid grid-cols-1 md:grid-cols-12 gap-6"
            >
                {/* Core Actions */}
                <div className="md:col-span-8 flex flex-col gap-6">

                    {/* Main Hero Card */}
                    <motion.div variants={fadeIn}>
                        <Link to="/live-journey" className="glass-panel p-8 relative overflow-hidden group block hover:border-royal/50 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-royal/20 blur-[80px] rounded-full group-hover:bg-royal/30 transition-colors" />

                            <div className="relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-royal to-electric flex items-center justify-center mb-6 shadow-lg shadow-royal/20">
                                    <Route className="w-7 h-7 text-white" />
                                </div>

                                <h2 className="text-3xl font-bold font-sora mb-3 text-gray-900">Live Journey Tracking</h2>
                                <p className="text-gray-700 text-lg max-w-md mb-8">AI-powered pathfinding, hazard detection, and live Guardian sharing.</p>

                                <div className="inline-flex items-center gap-3 text-gray-900 font-semibold">
                                    Start secure journey
                                    <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors group-hover:translate-x-1">
                                        <ArrowRight className="w-4 h-4" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Secondary Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FeatureCard
                            to="/ai-companion" icon={<Brain className="w-6 h-6 text-pinkAccent" />}
                            title="AI Companion" desc="Ask Unsaid about safety."
                            color="from-pinkAccent to-purple-500"
                        />
                        <FeatureCard
                            to="/evidence-vault" icon={<FileText className="w-6 h-6 text-electric" />}
                            title="Evidence Vault" desc="Securely logged incidents."
                            color="from-electric to-cyan-500"
                        />
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="md:col-span-4 flex flex-col gap-6">

                    {/* Emergency SOS - High Contrast */}
                    <motion.div variants={fadeIn}>
                        <Link to="/emergency" className="glass-panel p-8 flex flex-col items-center justify-center text-center group border-danger/30 hover:border-danger/60 transition-all bg-gradient-to-b from-transparent to-danger/5">
                            <div className="w-20 h-20 rounded-full bg-danger/20 flex items-center justify-center mb-6 relative">
                                <div className="absolute inset-0 rounded-full border-2 border-danger animate-ping opacity-20" />
                                <div className="w-14 h-14 rounded-full bg-danger text-white flex items-center justify-center shadow-[0_0_30px_#ef4444]">
                                    <Shield className="w-7 h-7" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">SOS Trigger</h3>
                            <p className="text-red-600 text-sm font-medium">Tap for instant emergency broadcast</p>
                        </Link>
                    </motion.div>

                    <FeatureCard
                        to="/community-map" icon={<MapPin className="w-6 h-6 text-goldLight" />}
                        title="Community Map" desc="Live safety zones and havens."
                        color="from-goldLight to-yellow-600"
                    />

                </div>
            </motion.div>
        </div>
    );
}

function FeatureCard({ to, icon, title, desc, color }) {
    return (
        <motion.div variants={fadeIn}>
            <Link to={to} className="glass-button p-6 block h-full group">
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        {icon}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-700 transition-all">{title}</h3>
                <p className="text-sm text-gray-700">{desc}</p>
            </Link>
        </motion.div>
    );
}
