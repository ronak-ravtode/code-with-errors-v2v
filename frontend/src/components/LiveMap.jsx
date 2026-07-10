import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Polyline, ZoomControl, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const userIcon = new L.DivIcon({
  html: '<div class="user-marker-pulse"></div>',
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const getIconForType = (type) => {
  const icons = {
    police: '🚓',
    hospital: '🏥',
    clinic: '🏥',
    pharmacy: '💊',
    fire_station: '🚒',
    petrol_pump: '⛽',
    convenience_store: '🏪',
    '24x7_store': '🏪',
    restaurant: '🍽️',
    cafe: '☕',
    mall: '🛍️',
    bank: '🏦',
    atm: '🏧',
    metro_station: '🚇',
    bus_station: '🚌',
    hotel: '🏨'
  };
  return icons[type] || '📍';
};

const getElementTypeName = (place) => {
  const typeNames = {
    police: 'Police Station',
    hospital: 'Hospital',
    clinic: 'Clinic',
    pharmacy: 'Pharmacy',
    fire_station: 'Fire Station',
    petrol_pump: 'Petrol Pump',
    convenience_store: 'Convenience Store',
    '24x7_store': '24/7 Store',
    restaurant: 'Restaurant',
    cafe: 'Cafe',
    mall: 'Shopping Mall',
    bank: 'Bank',
    atm: 'ATM',
    metro_station: 'Metro Station',
    bus_station: 'Bus Station',
    hotel: 'Hotel',
    safe_place: 'Safe Place'
  };
  return typeNames[place.type] || 'Safe Place';
};

const MapUpdater = ({ center, isGuardianView }) => {
  const map = useMap();
  React.useEffect(() => {
    if (center && !isGuardianView) {
      map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
    }
  }, [center, isGuardianView, map]);
  return null;
};

export default function LiveMap({ userLocation, destinationLocation, polyline, isGuardianView }) {
  const defaultCenter = userLocation || { lat: 22.307, lng: 73.181 };
  const [apiSafePlaces, setApiSafePlaces] = useState([]);
  
  // Filter UI State
  const [filters, setFilters] = useState({
    police: true,
    hospital: true,
    pharmacy: true,
    petrol_pump: true,
    '24x7_store': true,
    metro_station: true,
    cafe: false,
    restaurant: false
  });
  const [showFilters, setShowFilters] = useState(false);

  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const fetchSafePlaces = async () => {
      if (!userLocation || hasFetched) return;
      
      try {
        setHasFetched(true); // Mark as fetched immediately to prevent spamming
        const response = await axios.get('http://localhost:3000/api/guardian/safe-places', {
          params: {
            lat: userLocation.lat,
            lng: userLocation.lng,
            radius: 5000 // Request 5km radius
          }
        });
        console.log(`📍 Found ${response.data.length} safe places`);
        setApiSafePlaces(response.data);
      } catch (error) {
        console.error('Error fetching safe places:', error);
      }
    };

    fetchSafePlaces();
  }, [userLocation, hasFetched]);

  const toggleFilter = (key) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter the places based on selected filters.
  // Note: Fallback to showing it if the type isn't specifically managed in the toggles.
  const filteredPlaces = apiSafePlaces.filter(place => {
    if (filters[place.type] !== undefined) {
      return filters[place.type];
    }
    // If it's a category not explicitly in our filters list (like bank, atm, etc), show it by default
    return true; 
  });

  return (
    <div className="w-full h-full relative z-0">
      
      {/* Filters UI Panel Overlay */}
      {!isGuardianView && (
        <div className="absolute top-4 right-4 z-[1001]">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="bg-gray-900/90 backdrop-blur text-white px-4 py-2 rounded-xl border border-gray-700 shadow-xl font-bold flex items-center space-x-2 transition-transform hover:scale-105"
          >
            <span>🧭</span>
            <span>Filters</span>
          </button>
          
          {showFilters && (
            <div className="mt-2 bg-gray-900/95 backdrop-blur-md border border-gray-700 p-4 rounded-xl shadow-2xl w-56 flex flex-col space-y-2">
              <h4 className="text-white text-sm font-bold mb-2">Show on Map</h4>
              {Object.keys(filters).map(key => (
                <label key={key} className="flex items-center space-x-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={filters[key]}
                    onChange={() => toggleFilter(key)}
                    className="form-checkbox h-4 w-4 text-blue-500 rounded bg-gray-800 border-gray-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-gray-300 text-sm group-hover:text-white capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <MapContainer 
        center={[defaultCenter.lat, defaultCenter.lng]} 
        zoom={15} 
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        <ZoomControl position="bottomright" />
        <MapUpdater center={userLocation} isGuardianView={isGuardianView} />

        {/* User Location */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />
        )}

        {/* Destination Location */}
        {destinationLocation && (
          <Marker position={[destinationLocation.lat, destinationLocation.lng]} icon={destinationIcon} />
        )}

        {/* Route Polyline */}
        {polyline && polyline.length > 0 && (
          <Polyline positions={polyline} color="#10b981" weight={4} opacity={0.8} />
        )}

        {/* Safe Places */}
        {filteredPlaces.map((place, index) => (
          <Marker
            key={place.id || index}
            position={[place.lat, place.lng]}
            icon={L.divIcon({
              className: 'custom-marker',
              html: `<div style="
                font-size: 20px;
                background: ${place.is247 ? '#10B981' : '#3B82F6'};
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              ">${getIconForType(place.type)}</div>`,
              iconSize: [40, 40],
              iconAnchor: [20, 20]
            })}
          >
            <Popup>
              <div className="p-1 min-w-[150px]">
                <h3 className="font-bold text-gray-900 m-0 leading-tight">{place.name}</h3>
                <p className="text-sm text-gray-600 m-0 mt-1">{getElementTypeName(place)}</p>
                <p className="text-xs text-gray-500 m-0 mt-1">
                  📍 {place.distance}m away
                </p>
                {place.is247 && (
                  <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-bold">
                    Open 24/7
                  </span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
