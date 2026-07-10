import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Home, Map, MessageSquare, Menu, X, Settings as SettingsIcon, Bell, User } from 'lucide-react';
import Background from './Background';

export default function Layout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('ss_user') || '{}');
  const isGuardian = user.role === 'guardian';

  const navLinks = isGuardian ? [
    { name: 'Guardian Home', path: '/guardian-dashboard', icon: Shield },
  ] : [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Unsaid AI', path: '/ai-companion', icon: MessageSquare },
    { name: 'Live Map', path: '/live-journey', icon: Map },
    { name: 'SOS', path: '/emergency', icon: Shield, isEmergency: true }
  ];

  return (
    <div className="min-h-screen relative font-sans overflow-x-hidden text-gray-900 selection:bg-indigo/30">
      <Background />

      {/* Premium Glass Header */}
      <header className="fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal to-electric p-0.5 shadow-[0_0_20px_rgba(109,40,217,0.4)] group-hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] transition-shadow">
              <div className="w-full h-full bg-background rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-electric group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <span className="font-sora font-semibold text-xl tracking-tight text-gray-900 group-hover:text-royal transition-all">
              SafeSphere
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2 bg-glass border border-glassBorder rounded-full px-2 py-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`relative px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-all duration-300 ${isActive ? 'text-gray-900' : 'text-gray-700 hover:text-gray-900'
                    } ${link.isEmergency ? 'text-danger hover:text-red-600' : ''}`}
                >
                  {isActive && !link.isEmergency && (
                    <motion.div
                      layoutId="activeNavTab"
                      className="absolute inset-0 bg-white/10 rounded-full"
                    />
                  )}
                  {isActive && link.isEmergency && (
                    <motion.div
                      layoutId="activeNavTab"
                      className="absolute inset-0 bg-danger/20 rounded-full"
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Controls */}
          <div className="hidden md:flex items-center gap-4">
            <button className="relative p-2 rounded-full text-gray-400 hover:bg-glass hover:text-white transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-pinkAccent"></span>
            </button>
            <Link to="/profile" className="p-2 rounded-full text-gray-400 hover:bg-glass hover:text-white transition-all">
              <SettingsIcon className="w-5 h-5" />
            </Link>
            <Link to="/profile">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo to-emeraldLight p-0.5 cursor-pointer">
                <div className="w-full h-full bg-card rounded-full overflow-hidden flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-300" />
                </div>
              </div>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-20 z-40 bg-background/95 backdrop-blur-xl border-b border-glassBorder p-6 md:hidden"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 p-4 rounded-xl ${isActive ? 'bg-glass text-white' : 'text-gray-400'
                      } ${link.isEmergency ? 'text-danger bg-danger/10' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main View Area */}
      <main className="w-full h-full pt-20">
        <Outlet />
      </main>
    </div>
  );
}
