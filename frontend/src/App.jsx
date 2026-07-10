import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import LiveJourneyTracking from './pages/LiveJourneyTracking';
import AIChat from './pages/AIChat';
import EvidenceVault from './pages/EvidenceVault';
import EmergencyCommandCenter from './pages/EmergencyCommandCenter';
import CommunitySafetyMap from './pages/CommunitySafetyMap';
import GuardianDashboard from './pages/GuardianDashboard';

import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('ss_token');
  const userStr = localStorage.getItem('ss_user');
  if (!token || !userStr) return <Navigate to="/login" replace />;
  const user = JSON.parse(userStr);
  const role = user.role || 'user';

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={role === 'guardian' ? '/guardian-dashboard' : '/dashboard'} replace />;
  }
  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Main App Layout */}
      <Route element={<Layout />}>
        {/* User-Only Features */}
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['user']}><Dashboard /></ProtectedRoute>} />
        <Route path="/ai-companion" element={<ProtectedRoute allowedRoles={['user']}><AIChat /></ProtectedRoute>} />
        <Route path="/evidence-vault" element={<ProtectedRoute allowedRoles={['user']}><EvidenceVault /></ProtectedRoute>} />
        <Route path="/emergency" element={<ProtectedRoute allowedRoles={['user']}><EmergencyCommandCenter /></ProtectedRoute>} />

        {/* Features Both can conceptually use (map views etc) or restrict mapping to user only? 
            Let's restrict mapping features as well if they shouldn't use it, except guardians might track wards. Let's let guardians view journey but no SOS triggers! 
            Actually, the prompt insists users get all features and guardian only gets to watch. */}
        <Route path="/live-journey" element={<ProtectedRoute allowedRoles={['user']}><LiveJourneyTracking /></ProtectedRoute>} />
        <Route path="/community-map" element={<ProtectedRoute allowedRoles={['user']}><CommunitySafetyMap /></ProtectedRoute>} />

        {/* Guardian-Only Dashboard */}
        <Route path="/guardian-dashboard" element={<ProtectedRoute allowedRoles={['guardian']}><GuardianDashboard /></ProtectedRoute>} />

        {/* Shared / Settings */}
        <Route path="/profile" element={<ProtectedRoute allowedRoles={['user', 'guardian']}><Profile /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
