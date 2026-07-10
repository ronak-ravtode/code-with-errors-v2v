import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield, Mail, Lock, User, Eye, EyeOff,
  ArrowRight, Loader2, AlertCircle, CheckCircle, Phone, Users
} from 'lucide-react';
import axios from 'axios';

const BACKEND = 'http://localhost:3000';

function calcStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0–4
}

const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-emerald-500'];

export default function Register() {
  const navigate = useNavigate();
  const [registerType, setRegisterType] = useState('user'); // 'user' or 'guardian'
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [wardEmail, setWardEmail] = useState(''); // FOR GUARDIANS ONLY
  const [showPw, setShowPw] = useState(false);

  // Guardians (up to 3)
  const [guardians, setGuardians] = useState([
    { name: '', phone: '' },
    { name: '', phone: '' },
    { name: '', phone: '' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [focused, setFocused] = useState('');
  const [agreed, setAgreed] = useState(false);

  const strength = calcStrength(password);

  const updateGuardian = (index, field, value) => {
    const fresh = [...guardians];
    fresh[index][field] = value;
    setGuardians(fresh);
  };

  async function handleRegister(e) {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (registerType === 'guardian' && !wardEmail.trim()) { setError('Please enter the email of the User you are acting as a guardian for.'); return; }
    if (!agreed) { setError('Please agree to the terms to continue.'); return; }

    setLoading(true);
    try {
      await axios.post(`${BACKEND}/api/auth/register`, {
        email, password, full_name: fullName, phone, guardians, role: registerType, ward_email: wardEmail
      });
      setSuccess('Account activated! Redirecting to sign in…');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden py-12">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-700/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-pink-600/15 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-[500px] relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div
            whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(109,40,217,0.4)] ${registerType === 'user' ? 'from-violet-600 to-blue-500' : 'from-pink-600 to-orange-500'}`}
          >
            <Shield className="w-8 h-8 text-white" />
          </motion.div>

          <div className="flex bg-white/5 border border-white/10 rounded-full p-1 mb-6">
            <button
              onClick={() => setRegisterType('user')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${registerType === 'user' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Sign up as User
            </button>
            <button
              onClick={() => setRegisterType('guardian')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${registerType === 'guardian' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Sign up as Guardian
            </button>
          </div>

          <h1 className="text-3xl font-bold text-white tracking-tight">Create account</h1>
          <p className="text-gray-400 text-sm mt-1">
            {registerType === 'user' ? 'Join the SafeSphere Network' : 'Join as a SafeSphere Guardian'}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleRegister} className="space-y-6" noValidate>

            {/* Personal Details */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
                <User className="w-4 h-4 text-violet-400" /> Personal Details
              </h2>
              <Field label="Full Name" focused={focused === 'name'}>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} onFocus={() => setFocused('name')} onBlur={() => setFocused('')} placeholder="Priya Sharma" className="flex-1 bg-transparent outline-none text-white text-sm placeholder-gray-600" />
              </Field>
              <Field label="Phone (optional)" focused={focused === 'phone'}>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} onFocus={() => setFocused('phone')} onBlur={() => setFocused('')} placeholder="+91 98765 43210" className="flex-1 bg-transparent outline-none text-white text-sm placeholder-gray-600" />
              </Field>
              <Field label="Email Address" focused={focused === 'email'}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} onFocus={() => setFocused('email')} onBlur={() => setFocused('')} placeholder="you@example.com" className="flex-1 bg-transparent outline-none text-white text-sm placeholder-gray-600" />
              </Field>
              <div>
                <Field label="Password" focused={focused === 'pw'}>
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onFocus={() => setFocused('pw')} onBlur={() => setFocused('')} placeholder="Min. 6 characters" className="flex-1 bg-transparent outline-none text-white text-sm placeholder-gray-600" />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="text-gray-500 hover:text-gray-300 transition">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </Field>
                {password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor[strength] : 'bg-white/10'}`} />
                      ))}
                    </div>
                    <span className={`text-xs font-semibold ${strengthColor[strength].replace('bg-', 'text-')}`}>{strengthLabel[strength]}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Contacts (For Users Only) */}
            {registerType === 'user' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
                  <Users className="w-4 h-4 text-pink-400" /> Emergency Contacts (Up to 3)
                </h2>
                <p className="text-xs text-gray-500 -mt-2">SafeSphere will alert these numbers if your journey goes off-track or you trigger SOS.</p>

                {[0, 1, 2].map(i => (
                  <div key={i} className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                      <input type="text" placeholder={`Guardian ${i + 1} Name`} value={guardians[i].name} onChange={e => updateGuardian(i, 'name', e.target.value)} className="w-full bg-transparent outline-none text-white text-xs placeholder-gray-600" />
                    </div>
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                      <input type="tel" placeholder={`Phone (e.g. +91...)`} value={guardians[i].phone} onChange={e => updateGuardian(i, 'phone', e.target.value)} className="w-full bg-transparent outline-none text-white text-xs placeholder-gray-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Ward Linkage (For Guardians Only) */}
            {registerType === 'guardian' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
                  <Shield className="w-4 h-4 text-violet-400" /> Link to Ward
                </h2>
                <p className="text-xs text-gray-500 -mt-2">Provide the email address of the SafeSphere user you will be protecting.</p>
                <Field label="Ward User's Email" focused={focused === 'wardEmail'}>
                  <input type="email" value={wardEmail} onChange={e => setWardEmail(e.target.value)} onFocus={() => setFocused('wardEmail')} onBlur={() => setFocused('')} placeholder="ward@example.com" className="flex-1 bg-transparent outline-none text-white text-sm placeholder-gray-600" />
                </Field>
              </div>
            )}

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <div onClick={() => setAgreed(a => !a)} className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all ${agreed ? 'bg-violet-600 border-violet-600' : 'border-white/20 bg-white/5'}`}>
                {agreed && <CheckCircle className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className="text-xs text-gray-400 leading-relaxed">
                I agree to the <span className="text-violet-400 hover:underline cursor-pointer">Terms of Service</span> and <span className="text-violet-400 hover:underline cursor-pointer">Privacy Policy</span>. Note: Free tier does not include automated SMS.
              </span>
            </label>

            {/* Status */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-emerald-400">
                  <CheckCircle className="w-4 h-4 shrink-0" /> {success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.98 }} className={`w-full py-3.5 rounded-xl font-bold text-white text-sm bg-gradient-to-r hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(109,40,217,0.3)] ${registerType === 'user' ? 'from-violet-600 to-blue-500' : 'from-pink-600 to-orange-500'}`}>
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
              ) : (
                <><span>{registerType === 'user' ? 'Create User Account' : 'Activate Guardian Account'}</span><ArrowRight className="w-4 h-4" /></>
              )}
            </motion.button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}

function Field({ label, focused, children }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="flex items-center gap-3 bg-white/5 border rounded-xl px-4 py-2.5 transition-all duration-200" style={{ borderColor: focused ? 'rgba(109,40,217,0.8)' : 'rgba(255,255,255,0.1)' }}>
        {children}
      </div>
    </div>
  );
}
