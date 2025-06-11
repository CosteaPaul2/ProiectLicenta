"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CO2Location } from "@/app/actions/location-actions";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom icons based on CO2 levels
const createCO2Icon = (co2Level: number) => {
  let color = '#28a745'; // Green for low emissions
  
  if (co2Level > 500) {
    color = '#dc3545'; // Red for high emissions
  } else if (co2Level > 450) {
    color = '#ffc107'; // Yellow for medium emissions
  }
  
  return L.divIcon({
    className: 'custom-co2-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 10px;
      ">
        ${Math.round(co2Level)}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// Component to handle map interactions
function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const map = useMap();
  
  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    
    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);
  
  return null;
}

interface MapProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  showClickToAdd?: boolean;
}

export default function Map({ onLocationSelect, showClickToAdd = false }: MapProps) {
  const [locations, setLocations] = useState<CO2Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch CO2 locations from API
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/locations');
        if (!response.ok) {
          throw new Error('Failed to fetch locations');
        }
        const data = await response.json();
        setLocations(data.locations || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load locations');
        console.error('Error fetching locations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    if (showClickToAdd && onLocationSelect) {
      onLocationSelect(lat, lng);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCO2LevelColor = (level: number) => {
    if (level > 500) return 'text-red-600';
    if (level > 450) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getCO2LevelText = (level: number) => {
    if (level > 500) return 'High';
    if (level > 450) return 'Medium';
    return 'Normal';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading CO2 emission locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {error && (
        <div className="absolute top-4 left-4 z-[1000] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {showClickToAdd && (
        <div className="absolute top-4 right-4 z-[1000] bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          Click on the map to add a new CO2 monitoring location
        </div>
      )}

      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
        style={{ height: "600px", width: "100%" }}
        className="rounded-lg shadow-lg"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {showClickToAdd && (
          <MapEvents onMapClick={handleMapClick} />
        )}
        
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={[
              location.geom.coordinates[1], // latitude
              location.geom.coordinates[0]  // longitude
            ]}
            icon={createCO2Icon(location.properties.co2Level)}
          >
            <Popup className="co2-popup">
              <div className="p-2 min-w-[250px]">
                <h3 className="font-bold text-lg mb-2">{location.name}</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">CO2 Level:</span>
                    <span className={`font-bold ${getCO2LevelColor(location.properties.co2Level)}`}>
                      {location.properties.co2Level} {location.properties.unit}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Status:</span>
                    <span className={`px-2 py-1 rounded text-sm ${getCO2LevelColor(location.properties.co2Level)} bg-opacity-20`}>
                      {getCO2LevelText(location.properties.co2Level)}
                    </span>
                  </div>
                  
                  {location.properties.description && (
                    <div>
                      <span className="font-medium">Description:</span>
                      <p className="text-sm text-gray-600 mt-1">{location.properties.description}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Source: {location.properties.source}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Added: {formatDate(location.properties.createdAt)}</span>
                  </div>
                  
                  <div className="text-xs text-gray-400 mt-2">
                    Coordinates: {location.geom.coordinates[1].toFixed(6)}, {location.geom.coordinates[0].toFixed(6)}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {locations.length === 0 && !loading && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          No CO2 monitoring locations found. Add some locations to get started!
        </div>
      )}
    </div>
  );
}
