import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Shield, Edit3, Save, X,
  CheckCircle, AlertCircle, Lock, Calendar, MapPin,
  LogOut, ChevronRight, Bell, Eye, EyeOff, Users, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND = 'http://localhost:3000';

export default function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Editable fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Guardians (up to 3)
  const [guardians, setGuardians] = useState([
    { name: '', phone: '' },
    { name: '', phone: '' },
    { name: '', phone: '' }
  ]);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('ss_token');
      if (!token) return;
      try {
        const { data } = await axios.get(`${BACKEND}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });

        setUser(data.user);
        setFullName(data.user.full_name || '');
        setPhone(data.user.phone || '');

        const g = data.user.guardians || [];
        setGuardians([
          { name: g[0]?.name || '', phone: g[0]?.phone || '' },
          { name: g[1]?.name || '', phone: g[1]?.phone || '' },
          { name: g[2]?.name || '', phone: g[2]?.phone || '' }
        ]);

        // Ensure local storage is up to date
        localStorage.setItem('ss_user', JSON.stringify(data.user));
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };
    fetchProfile();
  }, []);

  const updateGuardian = (index, field, value) => {
    const fresh = [...guardians];
    fresh[index][field] = value;
    setGuardians(fresh);
  };

  async function handleSave() {
    if (!fullName.trim()) { setError('Name cannot be empty.'); return; }

    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('ss_token');
      const { data } = await axios.patch(`${BACKEND}/api/auth/guardians`, {
        full_name: fullName,
        phone: phone,
        guardians: guardians
      }, { headers: { Authorization: `Bearer ${token}` } });

      const updatedUser = data.user;
      setUser(updatedUser);
      localStorage.setItem('ss_user', JSON.stringify(updatedUser));

      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('ss_token');
    localStorage.removeItem('ss_user');
    navigate('/login');
  }

  const email = user?.email || '';
  const avatar = (fullName || email || 'U')[0].toUpperCase();
  const joinedDate = user ? new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '';

  return (
    <div className="min-h-screen bg-[#09090b] text-white px-4 py-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your SafeSphere guardian account</p>
      </motion.div>

      {/* Avatar Card */}
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-violet-900/40 to-blue-900/30 border border-violet-500/20 rounded-3xl p-6 mb-5 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center text-3xl font-bold shadow-[0_0_30px_rgba(109,40,217,0.4)] shrink-0">
          {avatar}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold truncate">{fullName || 'User'}</h2>
          <p className="text-gray-400 text-sm truncate">{email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="flex items-center gap-1 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full px-2.5 py-0.5">
              <Shield className="w-3 h-3" /> Guardian Active
            </span>
            <span className="text-xs text-gray-500">Since {joinedDate}</span>
          </div>
        </div>
        <button
          onClick={() => { setEditing(e => !e); setError(''); }}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition shrink-0"
        >
          {editing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
        </button>
      </motion.div>

      {/* Editable Info (Form) */}
      <AnimatePresence>
        {editing && (
          <motion.div key="edit-form"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5 space-y-6">

              <div className="space-y-4">
                <p className="text-xs font-bold text-violet-400 uppercase tracking-wider">Personal Info</p>
                <InfoField label="Full Name" icon={<User className="w-4 h-4" />}>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" className="flex-1 bg-transparent outline-none text-white text-sm placeholder-gray-600" />
                </InfoField>
                <InfoField label="Phone" icon={<Phone className="w-4 h-4" />}>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 00000 00000" className="flex-1 bg-transparent outline-none text-white text-sm placeholder-gray-600" />
                </InfoField>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4" /> Emergency Contacts
                </p>
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex gap-2">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                      <input type="text" placeholder={`Guardian ${i + 1} Name`} value={guardians[i].name} onChange={e => updateGuardian(i, 'name', e.target.value)} className="w-full bg-transparent outline-none text-white text-xs placeholder-gray-600" />
                    </div>
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                      <input type="tel" placeholder={`Phone`} value={guardians[i].phone} onChange={e => updateGuardian(i, 'phone', e.target.value)} className="w-full bg-transparent outline-none text-white text-xs placeholder-gray-600" />
                    </div>
                  </div>
                ))}
              </div>

              {error && <div className="flex items-center gap-2 text-red-400 text-sm"><AlertCircle className="w-4 h-4" /> {error}</div>}

              <button onClick={handleSave} disabled={saving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-emerald-400 mb-5">
            <CheckCircle className="w-4 h-4" /> Profile updated successfully.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Static Info Rows for Guardians */}
      {!editing && (
        <div className="mb-5 space-y-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2">Registered Guardians</p>
          <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/5">
            {user?.guardians?.length > 0 ? (
              user.guardians.map((g, i) => (
                <InfoRow key={i} icon={<Shield className={`w-4 h-4 text-pink-${400 - (i * 100)}`} />} label={g.name} value={g.phone} />
              ))
            ) : (
              <div className="px-5 py-4 text-sm text-gray-500 text-center italic">No guardians added yet. Edit profile to add.</div>
            )}
          </div>
        </div>
      )}

      {/* Action tiles */}
      <div className="grid grid-cols-1 gap-3 mb-5">
        {[
          { label: 'My Hub', icon: <MapPin className="w-5 h-5 text-emerald-400" />, href: '/dashboard' },
        ].map(tile => (
          <motion.button key={tile.label} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate(tile.href)}
            className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 hover:bg-white/10 transition text-left">
            {tile.icon}
            <span className="text-sm font-semibold text-gray-200">{tile.label}</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600 ml-auto" />
          </motion.button>
        ))}
      </div>

      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleLogout}
        className="w-full py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-500/20 transition">
        <LogOut className="w-4 h-4" /> Sign Out
      </motion.button>
    </div>
  );
}

function InfoField({ label, icon, children }) {
  return (
    <div>
      <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1.5">{label}</p>
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
        <span className="text-gray-500">{icon}</span>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      {icon}
      <span className="text-sm text-gray-300 flex-1 font-semibold">{label}</span>
      <span className="text-sm text-gray-400 text-right">{value}</span>
    </div>
  );
}
