import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../lib/supabase';

const BACKEND = 'http://localhost:3000';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState('user'); // 'user' or 'guardian'
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [focused, setFocused] = useState('');
  const [showGoogleDesc, setShowGoogleDesc] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }

    setLoading(true);
    try {
      const { data } = await axios.post(`${BACKEND}/api/auth/login`, { email, password });

      // Save JWT + user info to localStorage
      localStorage.setItem('ss_token', data.token);
      localStorage.setItem('ss_user', JSON.stringify(data.user));

      setSuccess(`Welcome back, ${data.user.full_name || data.user.email}! Redirecting…`);

      const destination = data.user.role === 'guardian' ? '/guardian-dashboard' : '/dashboard';
      setTimeout(() => navigate(destination), 1000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    // Note to user: Google OAuth requires configuring GCP Client ID + Supabase Dashboard
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    });
    if (error) setError(error.message);
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden py-12">
      {/* Ambient blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-700/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div
            whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(109,40,217,0.4)] ${loginType === 'user' ? 'from-violet-600 to-blue-500' : 'from-pink-600 to-orange-500'}`}
          >
            <Shield className="w-8 h-8 text-white" />
          </motion.div>

          <div className="flex bg-white/5 border border-white/10 rounded-full p-1 mb-6">
            <button
              onClick={() => setLoginType('user')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${loginType === 'user' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              User Login
            </button>
            <button
              onClick={() => setLoginType('guardian')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${loginType === 'guardian' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Guardian Login
            </button>
          </div>

          <h1 className="text-3xl font-bold text-white tracking-tight">
            {loginType === 'user' ? 'User Portal' : 'Guardian Portal'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {loginType === 'user' ? 'Sign in to access your safety dashboard' : 'Sign in to monitor emergency alerts'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5" noValidate>

            {/* Email */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <div
                className="flex items-center gap-3 bg-white/5 border rounded-xl px-4 py-3 transition-all duration-200"
                style={{ borderColor: focused === 'email' ? 'rgba(109,40,217,0.8)' : 'rgba(255,255,255,0.1)' }}
              >
                <Mail className={`w-4 h-4 shrink-0 transition-colors ${focused === 'email' ? 'text-violet-400' : 'text-gray-500'}`} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                  placeholder="you@example.com"
                  className="flex-1 bg-transparent outline-none text-white text-sm placeholder-gray-600"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
              <div
                className="flex items-center gap-3 bg-white/5 border rounded-xl px-4 py-3 transition-all duration-200"
                style={{ borderColor: focused === 'pw' ? 'rgba(109,40,217,0.8)' : 'rgba(255,255,255,0.1)' }}
              >
                <Lock className={`w-4 h-4 shrink-0 transition-colors ${focused === 'pw' ? 'text-violet-400' : 'text-gray-500'}`} />
                <input
                  type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('pw')} onBlur={() => setFocused('')}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent outline-none text-white text-sm placeholder-gray-600"
                />
                <button type="button" onClick={() => setShowPw(p => !p)} className="text-gray-500 hover:text-gray-300 transition">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error / Success */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-emerald-400">
                  <CheckCircle className="w-4 h-4 shrink-0" /> {success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit" disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className={`w-full py-3.5 rounded-xl font-bold text-white text-sm bg-gradient-to-r transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(109,40,217,0.3)] ${loginType === 'user' ? 'from-violet-600 to-blue-500' : 'from-pink-600 to-orange-500'}`}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
              }
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest relative group cursor-pointer" onMouseEnter={() => setShowGoogleDesc(true)} onMouseLeave={() => setShowGoogleDesc(false)}>
              OR CONNECT WITH <Info className="w-3 h-3 inline pb-0.5" />
              {showGoogleDesc && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 border border-gray-700 text-gray-300 text-[10px] rounded leading-relaxed text-center z-20">
                  Requires configuring OAuth Credentials in Google Cloud Console and adding them to Supabase Dashboard.
                </div>
              )}
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white font-semibold hover:bg-white/10 transition flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 19 12 24 12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.6 35.7 16.3 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C36.9 39.1 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
            </svg>
            Sign in with Google
          </motion.button>

        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-violet-400 hover:text-violet-300 font-semibold transition">Create one</Link>
        </p>
      </motion.div>
    </div>
  );
}
