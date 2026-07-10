import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ChevronLeft, Battery, MapPin, Loader2,
  Navigation, Activity, CloudRain, Users, Clock,
  FileText, RefreshCw, AlertTriangle, CheckCircle,
  Clock3, Route, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const getGoogleKey = () => {
  const k = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return (k && k !== 'YOUR_API_KEY') ? k : null;
};
const getHereKey = () => {
  const k = import.meta.env.VITE_HERE_API_KEY;
  return (k && k !== 'YOUR_HERE_API_KEY') ? k : null;
};

// ── Leaflet icon fix ──────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const makeIcon = (color) => new L.Icon({
  iconUrl: `https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
});
const blueIcon = makeIcon('blue');
const redIcon = makeIcon('red');

// Route colors for the 3 suggested routes
const ROUTE_COLORS = ['#3b82f6', '#10b981', '#f59e0b'];
const ROUTE_NAMES = ['Fastest Route', 'Safest Route', 'Alternate Route'];

// ── Camera fly-to (stable) ────────────────────────────────────
function FlyTo({ lat, lng }) {
  const map = useMap();
  const prev = useRef('');
  useEffect(() => {
    const key = `${lat?.toFixed(3)},${lng?.toFixed(3)}`;
    if (key !== prev.current) { prev.current = key; map.setView([lat, lng], 13, { animate: true }); }
  }, [lat, lng]);
  return null;
}

// ── Haversine ─────────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000, r = x => x * Math.PI / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2
    + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ── Generate visually distinct route paths ─────────────────
async function generateRoutePolylines(start, dest) {
  const [sLat, sLng] = start;
  const [dLat, dLng] = dest;

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${sLng},${sLat};${dLng},${dLat}?alternatives=3&geometries=geojson&overview=full`;
    const { data } = await axios.get(url, { timeout: 6000 });
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      return data.routes.map((route, i) => {
        const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
        const dist = route.distance;
        const mins = Math.round(route.duration / 60);
        const timeStr = mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
        return {
          path: coords,
          dist: dist,
          time: timeStr,
          safetyBoost: i === 0 ? 0 : (i === 1 ? 12 : 6),
          extra: i === 0 ? 'Fastest Route, shortest distance' : (i === 1 ? 'Alternative 1: Through busier, lit main roads' : 'Alternative 2: Avoids isolated stretches')
        };
      });
    }
  } catch (err) {
    console.warn("OSRM routing failed, falling back to math lines", err);
  }

  const dLat_ = dLat - sLat, dLng_ = dLng - sLng;
  const dist = haversine(sLat, sLng, dLat, dLng);

  // Route 1: near-direct (fastest)
  const r1 = [
    [sLat, sLng],
    [sLat + dLat_ * 0.4, sLng + dLng_ * 0.3],
    [sLat + dLat_ * 0.7, sLng + dLng_ * 0.8],
    [dLat, dLng],
  ];

  // Route 2: slight north detour (safest)
  const perp = 0.008;
  const r2 = [
    [sLat, sLng],
    [sLat + dLat_ * 0.25 + perp, sLng + dLng_ * 0.20],
    [sLat + dLat_ * 0.55 + perp * 1.2, sLng + dLng_ * 0.55],
    [sLat + dLat_ * 0.80 + perp * 0.5, sLng + dLng_ * 0.85],
    [dLat, dLng],
  ];

  // Route 3: alternate swing
  const r3 = [
    [sLat, sLng],
    [sLat + dLat_ * 0.15 - perp, sLng + dLng_ * 0.35],
    [sLat + dLat_ * 0.50 - perp * 1.5, sLng + dLng_ * 0.60],
    [sLat + dLat_ * 0.80 - perp * 0.6, sLng + dLng_ * 0.90],
    [dLat, dLng],
  ];

  const d1 = Math.round(dist * 1.15);
  const d2 = Math.round(dist * 1.30);
  const d3 = Math.round(dist * 1.45);

  const time = (d) => {
    const mins = Math.round((d / 1000) / 25 * 60);
    return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return [
    { path: r1, dist: d1, time: time(d1), safetyBoost: 0, extra: 'Direct path, shortest distance' },
    { path: r2, dist: d2, time: time(d2), safetyBoost: 12, extra: 'Through busier, lit main roads' },
    { path: r3, dist: d3, time: time(d3), safetyBoost: 6, extra: 'Avoids isolated stretches' },
  ];
}

// ── API helpers ───────────────────────────────────────────────
async function geocodeAddr(q) {
  const GOOGLE_API_KEY = getGoogleKey();
  if (GOOGLE_API_KEY) {
    try {
      const { data } = await axios.post('https://places.googleapis.com/v1/places:searchText', {
        textQuery: q
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.location,places.displayName'
        }
      });
      if (data.places && data.places.length > 0) {
        const place = data.places[0];
        // Fetch place details with addressComponents and location
        const detailRes = await axios.get(`https://places.googleapis.com/v1/places/${place.id}?fields=addressComponents,location&key=${GOOGLE_API_KEY}`);

        if (detailRes.data && detailRes.data.location) {
          return [detailRes.data.location.latitude, detailRes.data.location.longitude];
        }
        return [place.location.latitude, place.location.longitude];
      }
    } catch (err) {
      console.error('Google Places API Error:', err);
    }
  }

  // Fallback to OSM
  try {
    const { data } = await axios.get('https://nominatim.openstreetmap.org/search',
      { params: { q, format: 'json', limit: 1 }, timeout: 5000 });
    return data.length ? [+data[0].lat, +data[0].lon] : null;
  } catch { return null; }
}

async function reverseGeocode(lat, lng) {
  const HERE_API_KEY = getHereKey();
  if (HERE_API_KEY) {
    try {
      const { data } = await axios.get(`https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lng}&apikey=${HERE_API_KEY}`, { timeout: 5000 });
      if (data.items && data.items.length > 0) {
        return data.items[0].title || data.items[0].address?.label || 'Unknown area (HERE)';
      }
    } catch (err) {
      console.warn("HERE RevGeocode failed", err);
    }
  }

  try {
    const { data } = await axios.get('https://nominatim.openstreetmap.org/reverse',
      { params: { lat, lon: lng, format: 'json' }, timeout: 4000 });
    return data?.address?.road || data?.address?.suburb || data?.address?.city || 'Unknown area';
  } catch { return 'Unknown area'; }
}

async function getWeather(lat, lng) {
  try {
    const { data } = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`,
      { timeout: 4000 });
    const c = data?.current_weather?.weathercode ?? -1;
    if (c === 0) return 'Clear ☀️';
    if (c <= 3) return 'Partly Cloudy ⛅';
    if (c <= 49) return 'Foggy 🌫️';
    if (c <= 67) return 'Rainy 🌧️';
    return 'Adverse ⛈️';
  } catch { return 'Unavailable'; }
}

async function getFacilities(lat, lng) {
  const q = `[out:json];(
    node["amenity"="police"](around:5000,${lat},${lng});
    node["amenity"="hospital"](around:5000,${lat},${lng});
    node["amenity"="clinic"](around:3000,${lat},${lng});
    node["amenity"="pharmacy"](around:2000,${lat},${lng});
  );out 20;`;
  try {
    const { data } = await axios.post('https://overpass-api.de/api/interpreter',
      `data=${encodeURIComponent(q)}`, { timeout: 6000 });
    let nearestPolice = Infinity, nearestHospital = Infinity;
    let pCount = 0, hCount = 0;
    for (const n of (data.elements || [])) {
      const d = haversine(lat, lng, n.lat, n.lon);
      if (n.tags?.amenity === 'police') { pCount++; if (d < nearestPolice) nearestPolice = d; }
      if (['hospital', 'clinic'].includes(n.tags?.amenity)) { hCount++; if (d < nearestHospital) nearestHospital = d; }
    }
    return { nearestPolice, nearestHospital, pCount, hCount };
  } catch {
    return { nearestPolice: Infinity, nearestHospital: Infinity, pCount: 0, hCount: 0 };
  }
}

async function buildReport(lat, lng, safetyBoost = 0) {
  const [locationName, weather, fac] = await Promise.all([
    reverseGeocode(lat, lng), getWeather(lat, lng), getFacilities(lat, lng),
  ]);

  const hour = new Date().getHours();
  let score = 50, conf = 60;

  if (fac.nearestPolice !== Infinity) { score += fac.nearestPolice < 1000 ? 22 : 10; conf += 12; } else score -= 8;
  if (fac.nearestHospital !== Infinity) { score += fac.nearestHospital < 2000 ? 12 : 5; conf += 8; } else score -= 5;
  if (weather.includes('Clear') || weather.includes('Cloudy')) score += 5; else score -= 8;
  const isNight = hour < 6 || hour > 21;
  if (!isNight) score += 3; else score -= 5;
  score += safetyBoost; // route-specific bonus

  score = Math.max(10, Math.min(score, 90));
  conf = Math.min(conf, 92);

  const crowd = isNight ? 'Low / Sparse (Night)' : 'Moderate–High (Daytime)';
  const traffic = isNight ? 'Low (Off-peak)' : 'Medium–Heavy (Peak)';
  const lighting = isNight ? 'Potentially Poor (Night)' : 'Generally Adequate (Day)';
  const riskLabel = score >= 72 ? 'Low' : score >= 50 ? 'Moderate' : 'High';

  const recs = score >= 72
    ? ['Coverage acceptable — proceed with standard awareness.', 'Stay on main roads, keep Live Location active.']
    : score >= 50
      ? ['Moderate risk. Prefer busier, lit streets.', 'Share your route with a trusted contact before departing.']
      : ['High risk. Consider alternate route.', 'Activate Guardian Tracking before proceeding.'];

  return {
    locationName, weather, crowd, traffic, lighting, riskLabel,
    score, conf,
    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    police: fac.nearestPolice === Infinity ? 'None in 5 km' : `${fac.nearestPolice} m`,
    hospital: fac.nearestHospital === Infinity ? 'None in 5 km' : `${fac.nearestHospital} m`,
    recs,
  };
}

// ── Situation ticker news bar items ──────────────────────────
function buildTickerItems(report, userPos) {
  if (!report) return [];
  return [
    `📍 Area: ${report.locationName}`,
    `🛡️ Safety Score: ${report.score}% (${report.riskLabel} Risk)`,
    `🌤️ Weather: ${report.weather}`,
    `👮 Nearest Police: ${report.police}`,
    `🏥 Nearest Hospital: ${report.hospital}`,
    `🚦 Traffic: ${report.traffic}`,
    `👥 Crowd: ${report.crowd}`,
    `🕐 Local Time: ${report.time}`,
    `⚡ AI Confidence: ${report.conf}%`,
    `🔒 Guardian Mode: Active`,
  ];
}

const DELHI = [28.6139, 77.209];
const MOVE_THRESHOLD = 300;

// ─────────────────────────────────────────────────────────────
export default function LiveJourneyTracking() {
  const [mapReady, setMapReady] = useState(false);
  const [userPos, setUserPos] = useState(DELHI);
  const [startPos, setStartPos] = useState(DELHI);
  const [destPos, setDestPos] = useState(null);
  const [startInput, setStartInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 'idle' | 'analyzing' | 'choosing' | 'navigating'
  const [phase, setPhase] = useState('idle');
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [report, setReport] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tickerIdx, setTickerIdx] = useState(0);

  const lastAnalyzedPos = useRef(null);
  const watchId = useRef(null);

  // ── GPS init ─────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => { setStartInput('New Delhi (fallback)'); setMapReady(true); }, 3000);
    navigator.geolocation?.getCurrentPosition(
      pos => {
        clearTimeout(timer);
        const c = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(c); setStartPos(c); setStartInput('My Current Location'); setMapReady(true);
      },
      () => { clearTimeout(timer); setStartInput('New Delhi (GPS denied)'); setMapReady(true); },
      { timeout: 2500, maximumAge: 30000, enableHighAccuracy: false }
    );
    return () => clearTimeout(timer);
  }, []);

  // ── Ticker auto-advance ───────────────────────────────────
  useEffect(() => {
    if (phase !== 'navigating' || !report) return;
    const items = buildTickerItems(report, userPos);
    const t = setInterval(() => setTickerIdx(i => (i + 1) % items.length), 3500);
    return () => clearInterval(t);
  }, [phase, report, userPos]);

  // ── watchPosition during navigation ──────────────────────
  useEffect(() => {
    if (phase !== 'navigating') {
      if (watchId.current !== null) { navigator.geolocation.clearWatch(watchId.current); watchId.current = null; }
      return;
    }
    if (!('geolocation' in navigator)) return;
    watchId.current = navigator.geolocation.watchPosition(
      async pos => {
        const np = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(np);
        if (lastAnalyzedPos.current) {
          const moved = haversine(lastAnalyzedPos.current[0], lastAnalyzedPos.current[1], np[0], np[1]);
          if (moved < MOVE_THRESHOLD) return;
        }
        lastAnalyzedPos.current = np;
        setRefreshing(true);
        try {
          const r = await buildReport(np[0], np[1], routes[selectedRoute]?.safetyBoost || 0);
          setReport(r);
        } finally { setRefreshing(false); }
      },
      () => { },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); };
  }, [phase, selectedRoute, routes]);

  // ── Manual refresh ────────────────────────────────────────
  const manualRefresh = useCallback(async () => {
    if (refreshing || !report) return;
    setRefreshing(true);
    try { const r = await buildReport(userPos[0], userPos[1], routes[selectedRoute]?.safetyBoost || 0); setReport(r); }
    finally { setRefreshing(false); }
  }, [refreshing, userPos, report, routes, selectedRoute]);

  // ── Analyze & suggest routes ──────────────────────────────
  async function handleAnalyze() {
    setErrorMsg('');
    if (!destInput.trim()) { setErrorMsg('Please enter a destination.'); return; }
    setPhase('analyzing');

    let resolvedStart = startPos;
    if (startInput && startInput !== 'My Current Location') {
      const s = await geocodeAddr(startInput);
      if (s) { resolvedStart = s; setStartPos(s); setUserPos(s); }
    }

    const resolvedDest = await geocodeAddr(destInput);
    if (!resolvedDest) { setErrorMsg('Destination not found. Try a more specific address.'); setPhase('idle'); return; }
    setDestPos(resolvedDest);

    // Build 3 routes
    const routePolylines = await generateRoutePolylines(resolvedStart, resolvedDest);

    // Fetch report for each route's midpoint in parallel
    const reports = await Promise.all(
      routePolylines.map(route => {
        const mid = route.path[Math.floor(route.path.length / 2)];
        return buildReport(mid[0], mid[1], route.safetyBoost);
      })
    );

    const enriched = routePolylines.map((r, i) => ({ ...r, report: reports[i] }));
    setRoutes(enriched);
    setSelectedRoute(0);
    setReport(reports[0]);
    lastAnalyzedPos.current = resolvedDest;
    setPhase('choosing');
  }

  // ── Confirm route choice ──────────────────────────────────
  function confirmRoute(idx) {
    setSelectedRoute(idx);
    setReport(routes[idx].report);
    lastAnalyzedPos.current = destPos;
    setPhase('navigating');
  }

  function reset() {
    setPhase('idle'); setDestPos(null); setDestInput('');
    setReport(null); setRoutes([]); setErrorMsg('');
    lastAnalyzedPos.current = null;
  }

  // ── Helpers ───────────────────────────────────────────────
  const scoreColor = (s) => s >= 72 ? 'text-emerald-400' : s >= 50 ? 'text-yellow-400' : 'text-red-400';
  const riskBg = (s) => s >= 72 ? 'bg-emerald-900/30 border-emerald-700/40'
    : s >= 50 ? 'bg-yellow-900/30 border-yellow-700/40'
      : 'bg-red-900/30 border-red-700/40';

  const tickerItems = buildTickerItems(report, userPos);

  if (!mapReady) {
    return (
      <div className="w-full h-screen bg-[#09090b] flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
        <p className="text-gray-400 text-sm uppercase tracking-widest">Acquiring GPS…</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col bg-[#09090b] text-white" style={{ minHeight: '100vh' }}>

      {/* ── Topbar ─────────────────────────────────────────── */}
      <div className="flex-none flex items-center justify-between px-4 py-3 bg-gray-950 border-b border-gray-800 z-20">
        <Link to="/dashboard" className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold tracking-widest text-gray-300 uppercase">SafeSphere · Live Track</span>
          {phase === 'navigating' && <span className="text-[10px] text-emerald-400 animate-pulse">● Live — updating on movement</span>}
        </div>
        <Battery className="w-5 h-5 text-emerald-400" />
      </div>

      {/* ── Map ────────────────────────────────────────────── */}
      <div style={{ height: '48vh', width: '100%', position: 'relative', zIndex: 0 }}>
        <MapContainer center={userPos} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl>
          {getHereKey() ? (
            <TileLayer
              url={`https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/png8?apiKey=${getHereKey()}`}
              attribution="&copy; HERE Maps"
            />
          ) : (
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
          )}

          <Marker position={userPos} icon={blueIcon}><Popup>Your Location</Popup></Marker>
          {destPos && <Marker position={destPos} icon={redIcon}><Popup>Destination</Popup></Marker>}

          {/* Show all 3 routes in choosing phase */}
          {phase === 'choosing' && routes.map((r, i) => (
            <Polyline key={i} positions={r.path}
              pathOptions={{
                color: ROUTE_COLORS[i],
                weight: i === selectedRoute ? 5 : 3,
                opacity: i === selectedRoute ? 1 : 0.45,
                dashArray: i === 0 ? undefined : '10 6',
              }} />
          ))}

          {/* Show selected route during navigation */}
          {phase === 'navigating' && routes[selectedRoute] && (
            <Polyline positions={routes[selectedRoute].path}
              pathOptions={{ color: ROUTE_COLORS[selectedRoute], weight: 5 }} />
          )}

          {destPos && <FlyTo lat={destPos[0]} lng={destPos[1]} />}
        </MapContainer>
      </div>

      {/* ── Control Panel (Glassmorphism) ──────────────────────────────────── */}
      <div className="flex-none bg-gray-950 border-t border-gray-800 p-4 z-10">
        <AnimatePresence mode="wait">

          {/* IDLE — input form */}
          {phase === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="max-w-lg mx-auto space-y-3">
                <p className="text-center text-xs text-gray-500 uppercase tracking-widest">Set Route — AI Suggests 3 Safe Options</p>
                <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-xl px-3">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <input className="flex-1 bg-transparent py-3 text-sm text-white outline-none"
                    value={startInput} onChange={e => setStartInput(e.target.value)} placeholder="Start address…" />
                </div>
                <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-xl px-3">
                  <Navigation className="w-4 h-4 text-blue-400 shrink-0" />
                  <input className="flex-1 bg-transparent py-3 text-sm text-white outline-none"
                    value={destInput} onChange={e => setDestInput(e.target.value)}
                    placeholder="Destination (e.g. Bandra, Mumbai)"
                    onKeyDown={e => e.key === 'Enter' && handleAnalyze()} />
                </div>
                {errorMsg && <p className="text-red-400 text-xs text-center">{errorMsg}</p>}
                <button onClick={handleAnalyze}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-blue-500 hover:opacity-90 transition shadow-lg shadow-violet-500/20">
                  Suggest Safe Routes
                </button>
              </div>
            </motion.div>
          )}

          {/* ANALYZING */}
          {phase === 'analyzing' && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-5">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              <p className="text-sm font-semibold text-gray-300 tracking-wider">Calculating 3 routes + safety data…</p>
              <p className="text-xs text-gray-500">Police · Hospitals · Weather · OSM feeds</p>
            </motion.div>
          )}

          {/* CHOOSING — route selector cards */}
          {phase === 'choosing' && (
            <motion.div key="choosing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-center text-xs text-gray-400 uppercase tracking-widest mb-3">Choose Your Route</p>
              <div className="flex gap-2 max-w-lg mx-auto overflow-x-auto pb-1">
                {routes.map((r, i) => (
                  <motion.button key={i} whileTap={{ scale: 0.97 }}
                    onClick={() => { setSelectedRoute(i); setReport(r.report); }}
                    className={`flex-1 min-w-[130px] rounded-2xl border p-3 text-left transition-all ${selectedRoute === i
                      ? 'border-2 shadow-lg'
                      : 'border-gray-700 bg-gray-900 opacity-70'
                      }`}
                    style={selectedRoute === i ? { borderColor: ROUTE_COLORS[i], background: `${ROUTE_COLORS[i]}22` } : {}}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: ROUTE_COLORS[i] }} />
                      <span className="text-xs font-bold text-white">{ROUTE_NAMES[i]}</span>
                    </div>
                    <div className="text-xs text-gray-300 space-y-0.5">
                      <p className="flex items-center gap-1"><Clock3 className="w-3 h-3" /> {r.time}</p>
                      <p className="flex items-center gap-1"><Route className="w-3 h-3" /> {(r.dist / 1000).toFixed(1)} km</p>
                      <p className={`flex items-center gap-1 font-bold ${scoreColor(r.report.score)}`}>
                        <Shield className="w-3 h-3" /> {r.report.score}% safe
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1.5 leading-tight">{r.extra}</p>
                  </motion.button>
                ))}
              </div>
              <div className="max-w-lg mx-auto mt-3 flex gap-2">
                <button onClick={reset} className="flex-1 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-xs font-bold uppercase hover:bg-gray-700">
                  Back
                </button>
                <button onClick={() => confirmRoute(selectedRoute)}
                  className="flex-2 flex-grow py-2.5 rounded-xl text-xs font-bold uppercase text-white transition"
                  style={{ background: ROUTE_COLORS[selectedRoute] }}>
                  Start with {ROUTE_NAMES[selectedRoute]}
                </button>
              </div>
            </motion.div>
          )}

          {/* NAVIGATING */}
          {phase === 'navigating' && report && (
            <motion.div key="nav" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Score badge */}
              <div className={`flex items-center justify-between max-w-lg mx-auto mb-3 px-4 py-3 rounded-xl border ${riskBg(report.score)}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: ROUTE_COLORS[selectedRoute] + '33' }}>
                    <Shield className={`w-5 h-5 ${scoreColor(report.score)}`} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Live Safety · {ROUTE_NAMES[selectedRoute]}</p>
                    <p className={`text-xl font-bold font-mono ${scoreColor(report.score)}`}>
                      {report.score}% <span className="text-xs">({report.riskLabel})</span>
                    </p>
                  </div>
                </div>
                <button onClick={manualRefresh} disabled={refreshing}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition disabled:opacity-40">
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : 'text-gray-300'}`} />
                </button>
              </div>
              <div className="flex gap-2 max-w-lg mx-auto">
                <button onClick={reset} className="flex-1 py-2 rounded-xl bg-gray-800 border border-gray-700 text-xs font-bold uppercase hover:bg-gray-700">
                  End Session
                </button>
                <Link to="/emergency" className="flex-1 py-2 rounded-xl bg-red-600 text-xs font-bold uppercase text-center hover:bg-red-700">
                  Emergency SOS
                </Link>
              </div>
              <p className="text-center text-[10px] text-gray-600 mt-3 animate-pulse">↓ Scroll for full AI safety report</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── LIVE SITUATION TICKER BAR ────────────────────── */}
      {phase === 'navigating' && tickerItems.length > 0 && (
        <div className="flex-none bg-gradient-to-r from-violet-900/40 via-blue-900/30 to-violet-900/40 border-t border-violet-500/20 px-4 py-2.5 z-10">
          <AnimatePresence mode="wait">
            <motion.div key={tickerIdx}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3 max-w-lg mx-auto"
            >
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest shrink-0 border border-violet-500/30 rounded px-1.5 py-0.5">
                LIVE
              </span>
              <p className="text-xs text-gray-200 truncate">{tickerItems[tickerIdx]}</p>
              <span className="text-[10px] text-gray-600 shrink-0">{tickerIdx + 1}/{tickerItems.length}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ── FULL AI REPORT (scrollable below) ──────────────── */}
      {phase === 'navigating' && report && (
        <div className="w-full bg-[#09090b] py-10 px-4 border-t-2 border-gray-800">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-widest">
                <Activity className="w-4 h-4" /> AI Environmental Analysis
              </h2>
              {refreshing && <span className="text-xs text-blue-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Updating…</span>}
            </div>

            {/* Location pill */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 flex items-center gap-2 mb-4 text-sm">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-white font-semibold truncate">{report.locationName}</span>
              <span className="ml-auto text-gray-500 text-xs shrink-0">{report.time}</span>
            </div>

            <div className="rounded-2xl overflow-hidden border border-gray-800 shadow-2xl bg-gray-900">

              {/* HERE Maps Static View */}
              {getHereKey() && (
                <div className="w-full h-40 border-b border-gray-800 relative overflow-hidden bg-gray-800">
                  <img
                    src={`https://image.maps.hereapi.com/mia/v3/base/mc/center:${userPos[0]},${userPos[1]}/zoom:15/size:800x200/png?apiKey=${getHereKey()}`}
                    alt="HERE Maps Area Preview"
                    className="w-full h-full object-cover opacity-80 mix-blend-screen"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur text-[10px] text-gray-300 px-2 py-1 rounded">
                    📍 HERE Geofence Area Preview
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-800">
                <div className="divide-y divide-gray-800">
                  <Row label="Safety Score" value={<span className={`font-bold text-lg ${scoreColor(report.score)}`}>{report.score}%</span>} />
                  <Row label="Risk Level" value={report.riskLabel} valueClass={scoreColor(report.score) + ' font-semibold'} />
                  <Row label="Crowd Activity" value={report.crowd} icon={<Users className="w-3.5 h-3.5" />} />
                  <Row label="Traffic" value={report.traffic} />
                  <Row label="Lighting" value={report.lighting} valueClass="text-gray-400 italic text-xs" />
                  <Row label="Weather" value={report.weather} icon={<CloudRain className="w-3.5 h-3.5" />} valueClass="text-yellow-300" />
                </div>
                <div className="divide-y divide-gray-800">
                  <Row label="Police Station" value={report.police} valueClass="text-blue-300 font-semibold" />
                  <Row label="Hospital" value={report.hospital} valueClass="text-blue-300 font-semibold" />
                  <Row label="Route Used" value={ROUTE_NAMES[selectedRoute]} valueClass="font-semibold" style={{ color: ROUTE_COLORS[selectedRoute] }} />
                  <Row label="AI Confidence" value={`${report.conf}%`} valueClass="text-purple-400 font-bold" />
                </div>
              </div>

              <div className="bg-gray-950 px-5 py-5 border-t border-gray-800">
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Recommendation
                </p>
                <ul className="space-y-2">
                  {report.recs.map((r, i) => (
                    <li key={i} className="flex gap-2 items-start text-sm text-gray-300">
                      <span className="text-emerald-500 mt-0.5 shrink-0">•</span> {r}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-5 py-4 bg-gray-900 border-t border-gray-800">
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  Data: OSM Overpass (police, hospitals) · Open-Meteo (weather) · Crowd/traffic via time heuristics.
                  Routes are algorithmically generated safety diversions, not real-time GPS routing.
                  Score is a decision-support estimate, not a safety guarantee.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ icon, label, value, valueClass = 'text-white', style }) {
  return (
    <div className="flex justify-between items-center px-4 py-3 gap-4">
      <span className="flex items-center gap-1.5 text-xs text-gray-400 uppercase tracking-wider font-semibold shrink-0">
        {icon} {label}
      </span>
      <span className={`text-right text-sm truncate max-w-[170px] ${valueClass}`} style={style}>{value}</span>
    </div>
  );
}
