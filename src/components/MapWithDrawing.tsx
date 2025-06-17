"use client";

import { useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import Map from './Map';
import DrawingTools, { exportToGeoJSON, loadGeoJSON } from './DrawingTools';
import { LocationWithData } from '@/types/location';
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';
import 'leaflet/dist/leaflet.css';

interface MapWithDrawingProps {
  locations?: LocationWithData[];
  className?: string;
  enableDrawing?: boolean;
  initialGeoJson?: GeoJSON.FeatureCollection;
}

export default function MapWithDrawing({ 
  locations = [], 
  className,
  enableDrawing = true,
  initialGeoJson
}: MapWithDrawingProps) {
  const { hasExportFeatures, hasAdvancedDrawingTools, plan } = useSubscriptionFeatures();
  const [shapes, setShapes] = useState<GeoJSON.Feature[]>([]);
  const [showGeoJsonModal, setShowGeoJsonModal] = useState(false);
  const [geoJsonText, setGeoJsonText] = useState('');
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const handleShapeCreated = useCallback((geoJson: GeoJSON.Feature, layer: L.Layer) => {
    console.log('Shape created:', geoJson);
    setShapes(prev => [...prev, geoJson]);
  }, []);

  const handleShapeEdited = useCallback((layers: L.LayerGroup) => {
    console.log('Shapes edited:', layers);
    // Update shapes state with edited versions
    const updatedShapes: GeoJSON.Feature[] = [];
    layers.eachLayer((layer: any) => {
      if (layer.toGeoJSON) {
        updatedShapes.push(layer.toGeoJSON());
      }
    });
    // Note: This is a simplified update - in production you'd want more sophisticated state management
  }, []);

  const handleShapeDeleted = useCallback((layers: L.LayerGroup) => {
    console.log('Shapes deleted:', layers);
    // Remove deleted shapes from state
    // Note: This is a simplified update - in production you'd want more sophisticated state management
  }, []);

  const exportGeoJSON = () => {
    if (drawnItemsRef.current) {
      const geoJsonData = exportToGeoJSON(drawnItemsRef.current);
      const jsonString = JSON.stringify(geoJsonData, null, 2);
      setGeoJsonText(jsonString);
      setShowGeoJsonModal(true);
    }
  };

  const importGeoJSON = () => {
    try {
      const geoJsonData = JSON.parse(geoJsonText);
      if (mapRef.current && drawnItemsRef.current) {
        loadGeoJSON(mapRef.current, geoJsonData, drawnItemsRef.current);
        setShowGeoJsonModal(false);
        setGeoJsonText('');
      }
    } catch (error) {
      alert('Invalid GeoJSON format');
    }
  };

  const clearAllShapes = () => {
    if (drawnItemsRef.current) {
      drawnItemsRef.current.clearLayers();
      setShapes([]);
    }
  };

  const downloadGeoJSON = () => {
    if (drawnItemsRef.current) {
      const geoJsonData = exportToGeoJSON(drawnItemsRef.current);
      const jsonString = JSON.stringify(geoJsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'map-shapes.geojson';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {enableDrawing && (
        <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md rounded-lg shadow-lg border p-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800">Drawing Tools</h3>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
              {plan.name}
            </span>
          </div>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={clearAllShapes}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
            >
              Clear All Shapes
            </button>
            
            {hasExportFeatures ? (
              <>
                <button
                  onClick={exportGeoJSON}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                >
                  Export GeoJSON
                </button>
                <button
                  onClick={() => setShowGeoJsonModal(true)}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                >
                  Import GeoJSON
                </button>
                <button
                  onClick={downloadGeoJSON}
                  className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors"
                >
                  Download GeoJSON
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => alert('Upgrade to Pro to access export features!')}
                  className="px-3 py-1 bg-gray-400 text-white rounded text-sm cursor-not-allowed opacity-60"
                  disabled
                >
                  🔒 Export GeoJSON (Pro)
                </button>
                <button
                  onClick={() => alert('Upgrade to Pro to access import features!')}
                  className="px-3 py-1 bg-gray-400 text-white rounded text-sm cursor-not-allowed opacity-60"
                  disabled
                >
                  🔒 Import GeoJSON (Pro)
                </button>
                <button
                  onClick={() => alert('Upgrade to Pro to access download features!')}
                  className="px-3 py-1 bg-gray-400 text-white rounded text-sm cursor-not-allowed opacity-60"
                  disabled
                >
                  🔒 Download GeoJSON (Pro)
                </button>
              </>
            )}
          </div>
          
          <div className="text-xs text-gray-600 mt-2 border-t pt-2">
            <div>Shapes drawn: {shapes.length}</div>
            {!hasExportFeatures && (
              <div className="text-orange-600 mt-1">
                <a href="/pricing" target="_blank" className="underline hover:text-orange-700">
                  Upgrade to Pro
                </a> for export features
              </div>
            )}
          </div>
        </div>
      )}

      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        className="rounded-lg"
        ref={(map) => {
          if (map) {
            mapRef.current = map;
          }
        }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {locations.map((location) => (
                      <div key={location.id}>
            </div>
          ))}

          {enableDrawing && (
          <DrawingTools
            onShapeCreated={handleShapeCreated}
            onShapeEdited={handleShapeEdited}
            onShapeDeleted={handleShapeDeleted}
            initialGeoJson={initialGeoJson}
            enabledTools={{
              circle: true,
              rectangle: true,
              polygon: hasAdvancedDrawingTools,
              polyline: hasAdvancedDrawingTools,
              marker: true
            }}
          />
        )}
      </MapContainer>

      {showGeoJsonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <h3 className="text-xl font-semibold mb-4">GeoJSON Data</h3>
            <textarea
              value={geoJsonText}
              onChange={(e) => setGeoJsonText(e.target.value)}
              className="w-full h-64 p-3 border rounded font-mono text-sm"
              placeholder="Paste your GeoJSON data here..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={importGeoJSON}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Import to Map
              </button>
              <button
                onClick={() => setShowGeoJsonModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 