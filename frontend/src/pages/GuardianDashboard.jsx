import React, { useEffect } from 'react';
import LiveMap from '../components/LiveMap';
import { useAppStore } from '../store/useAppStore';
import { useSupabaseRealtime } from '../hooks/useSupabaseRealtime';

export default function GuardianDashboard() {
  const {
    activeJourneyId,
    guardianTimeline,
    addTimelineEvent,
    guardianEmergencyState,
    setGuardianEmergency
  } = useAppStore();

  const user = JSON.parse(localStorage.getItem('ss_user') || '{}');
  const wardEmail = user.ward_email || 'ward@example.com';
  const wardInitial = wardEmail.charAt(0).toUpperCase();

  const [trackedLocation, setTrackedLocation] = React.useState({ lat: 22.307, lng: 73.181 });

  // Realtime listeners
  useSupabaseRealtime('journey_events', (newEvent) => {
    addTimelineEvent({
      id: newEvent.id,
      title: newEvent.title || newEvent.event_type,
      time: new Date(newEvent.created_at || Date.now()).toLocaleTimeString()
    });
  }, 'journey_id', activeJourneyId);

  useSupabaseRealtime('journey_locations', (newLoc) => {
    if (newLoc.latitude && newLoc.longitude) {
      setTrackedLocation({ lat: newLoc.latitude, lng: newLoc.longitude });
    }
  }, 'journey_id', activeJourneyId);

  useSupabaseRealtime('emergency_sessions', (session) => {
    if (session.status === 'ACTIVE') {
      setGuardianEmergency(session);
    }
  });

  return (
    <div className="grid grid-cols-12 h-screen bg-gray-900 text-white overflow-hidden">

      {/* LEFT PANEL: Wards (col-2) */}
      <div className="col-span-2 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">SafeSphere</h2>
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Guardian Mode</p>
        </div>
        <div className="p-4 flex-1">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">My Wards</h3>
          <button
            onClick={() => alert('Camera opened! (Simulated QR Scan)')}
            className="w-full mb-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 rounded-lg text-indigo-300 font-bold flex items-center justify-center space-x-2 transition"
          >
            <span>📷</span>
            <span>Scan Invite QR</span>
          </button>
          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-700 transition">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-lg shadow-inner uppercase">
                {wardInitial}
              </div>
              <div className="overflow-hidden text-ellipsis max-w-[120px]">
                <p className="font-bold text-sm truncate">{wardEmail}</p>
                <p className="text-xs text-gray-400 truncate">En route to Home</p>
              </div>
            </div>
            {/* Status dot */}
            <div className={`w-3 h-3 rounded-full ${guardianEmergencyState ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]'}`}></div>
          </div>
        </div>
      </div>

      {/* CENTER PANEL: Map (col-7) */}
      <div className="col-span-7 relative bg-black">
        <LiveMap
          userLocation={trackedLocation}
          isGuardianView={true}
        />

        {/* Top Floating Header for Center Panel */}
        <div className="absolute top-6 left-6 z-[1000] bg-gray-900/90 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-xl">
          <h1 className="text-2xl font-bold">Tracking Ward</h1>
          <p className="text-gray-400 text-sm">Active Journey ID: {activeJourneyId || 'None'} • {wardEmail}</p>
        </div>
      </div>

      {/* RIGHT PANEL: Vitals (col-3) */}
      <div className="col-span-3 bg-gray-800 border-l border-gray-700 flex flex-col relative">

        {/* EMERGENCY OVERLAY */}
        {guardianEmergencyState && (
          <div className="absolute inset-0 z-50 bg-red-900/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
            <h1 className="text-4xl font-extrabold text-white mb-2 animate-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">🚨 EMERGENCY</h1>
            <h2 className="text-xl font-bold text-red-200 mb-8 uppercase tracking-widest">Protocol Detected</h2>

            <div className="bg-black/40 p-4 rounded-xl w-full border border-red-500/30 mb-8 shadow-inner">
              <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Last Known Location</p>
              <p className="text-2xl font-mono text-white">{trackedLocation.lat.toFixed(4)}, {trackedLocation.lng.toFixed(4)}</p>
            </div>

            <div className="w-full bg-red-950/50 p-4 rounded-xl border border-red-500/50 shadow-lg">
              <h3 className="text-sm font-bold text-red-200 mb-2 uppercase flex items-center justify-center">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping mr-2"></span>
                Live Audio Stream
              </h3>
              {guardianEmergencyState.audio_url ? (
                <audio controls autoPlay src={guardianEmergencyState.audio_url} className="w-full mt-2 filter invert hue-rotate-180 opacity-90" />
              ) : (
                <p className="text-xs text-red-300 animate-pulse italic">Establishing secure connection to Evidence Vault...</p>
              )}
            </div>

            <button
              onClick={() => setGuardianEmergency(null)}
              className="mt-8 text-xs text-red-300 underline hover:text-white"
            >
              Dismiss (Demo)
            </button>
          </div>
        )}

        {/* Normal Vitals UI */}
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white mb-6">Mission Vitals</h2>

          {/* Safety Score Circular Bar (Pure CSS implementation) */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="relative w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center shadow-lg"
              style={{ background: `conic-gradient(#22c55e 85%, #374151 0)` }}>
              <div className="absolute inset-2 bg-gray-800 rounded-full flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-green-400">85</span>
                <span className="text-xs text-gray-400">Safe</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-4 uppercase tracking-wider font-semibold">Realtime Safety Score</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 flex flex-col items-center">
              <span className="text-2xl mb-1">🔋</span>
              <span className="text-xl font-bold">84%</span>
              <span className="text-xs text-gray-400">Battery</span>
            </div>
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 flex flex-col items-center">
              <span className="text-2xl mb-1">⏱️</span>
              <span className="text-xl font-bold">12m</span>
              <span className="text-xs text-gray-400">ETA</span>
            </div>
          </div>
        </div>

        {/* Live Timeline */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Live Event Timeline</h3>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-600 before:to-transparent">
            {guardianTimeline.map((evt, idx) => (
              <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-800 bg-indigo-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
                <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] bg-gray-700/50 p-3 rounded-lg border border-gray-600 shadow-md">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold text-white text-sm">{evt.title}</div>
                    <time className="text-xs text-indigo-400">{evt.time}</time>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
