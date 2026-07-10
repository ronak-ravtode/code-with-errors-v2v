import { useEffect, useRef } from 'react';
import axios from 'axios';
import { useAppStore } from '../store/useAppStore';

export function useJourneyTracking(journeyId) {
  const isJourneyActive = !!journeyId;
  const setCurrentLocation = useAppStore(state => state.setCurrentLocation);
  
  // Track last sent location to avoid sending identical locations and to check deviation
  const lastSentRef = useRef(null);

  useEffect(() => {
    let watchId;
    let batteryInterval;

    const startTracking = async () => {
      // 1. Live Location Updates (every 10 seconds or when position changes significantly)
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, speed } = position.coords;
          
          // Update local store
          setCurrentLocation({ lat: latitude, lng: longitude });

          // Throttle to every 10 seconds to avoid spamming the backend
          const now = Date.now();
          if (lastSentRef.current && (now - lastSentRef.current.time < 10000)) {
            // Check for massive deviation as an emergency (mock simple deviation check)
            const distMoved = calculateDistance(
              latitude, longitude, 
              lastSentRef.current.lat, lastSentRef.current.lng
            );
            
            // If moved > 500m in < 10s, something is very wrong or GPS glitch.
            if (distMoved > 500) {
              await axios.post('http://localhost:3000/api/journey/deviation', { journeyId });
            }
            return; 
          }

          lastSentRef.current = { lat: latitude, lng: longitude, time: now };

          try {
            await axios.post('http://localhost:3000/api/journey/location', {
              journeyId,
              latitude,
              longitude,
              speed: speed || 0
            });
            console.log('📍 Location sent to backend');
          } catch (error) {
            console.error('Error sending location:', error);
          }
        },
        (error) => console.error('Geolocation error:', error),
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000
        }
      );

      // 2. Battery Monitoring (every 60 seconds)
      const getBatteryStatus = async () => {
        try {
          if ('getBattery' in navigator) {
            const battery = await navigator.getBattery();
            await axios.post('http://localhost:3000/api/journey/battery', {
              journeyId,
              level: battery.level * 100,
              charging: battery.charging
            });
            
            if (battery.level < 0.2 && !battery.charging) {
              console.warn('Battery low! Consider ending journey soon.');
            }
          }
        } catch (error) {
          console.error('Battery API error:', error);
        }
      };

      // Initial check and set interval
      getBatteryStatus();
      batteryInterval = setInterval(getBatteryStatus, 60000);
    };

    if (isJourneyActive) {
      startTracking();
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (batteryInterval) clearInterval(batteryInterval);
    };
  }, [isJourneyActive, journeyId, setCurrentLocation]);
}

// Simple Haversine implementation inline if not available
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dp/2) * Math.sin(dp/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
