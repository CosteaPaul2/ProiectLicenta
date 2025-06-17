"use client";

import { useState } from 'react';
import MapWithDrawing from '@/components/MapWithDrawing';
import Map from '@/components/Map';
import L from 'leaflet';

export default function DrawingDemo() {
  const [drawnShapes, setDrawnShapes] = useState<GeoJSON.Feature[]>([]);
  const [useAdvancedMap, setUseAdvancedMap] = useState(true);


  const sampleGeoJson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          name: "Sample Rectangle",
          description: "This is a sample rectangle shape"
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-0.1, 51.5],
            [-0.05, 51.5],
            [-0.05, 51.52],
            [-0.1, 51.52],
            [-0.1, 51.5]
          ]]
        }
      },
      {
        type: "Feature",
        properties: {
          name: "Sample Circle Area",
          description: "This represents a circular area"
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-0.08, 51.48],
            [-0.075, 51.48],
            [-0.07, 51.485],
            [-0.075, 51.49],
            [-0.08, 51.49],
            [-0.085, 51.485],
            [-0.08, 51.48]
          ]]
        }
      }
    ]
  };

  const handleShapeCreated = (geoJson: GeoJSON.Feature, layer: L.Layer) => {
    console.log('New shape created:', geoJson);
    setDrawnShapes(prev => [...prev, geoJson]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Map Drawing Tools Demo</h1>
          <p className="text-gray-600 mb-6">
            This demo showcases the drawing capabilities: circles, rectangles, polygons, polylines, and markers.
            You can also import/export GeoJSON data.
          </p>
          
          {/* Map Type Toggle */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setUseAdvancedMap(true)}
              className={`px-4 py-2 rounded ${
                useAdvancedMap 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Advanced Map (with controls)
            </button>
            <button
              onClick={() => setUseAdvancedMap(false)}
              className={`px-4 py-2 rounded ${
                !useAdvancedMap 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Simple Map Integration
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">How to Use:</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Drawing Tools (Top Right):</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Rectangle:</strong> Click and drag to create squares/rectangles</li>
                <li>• <strong>Circle:</strong> Click center, then click to set radius</li>
                <li>• <strong>Polygon:</strong> Click points to create custom shapes</li>
                <li>• <strong>Polyline:</strong> Draw lines and paths</li>
                <li>• <strong>Marker:</strong> Add point markers</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Additional Features:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Edit:</strong> Select shapes to modify them</li>
                <li>• <strong>Delete:</strong> Remove unwanted shapes</li>
                <li>• <strong>Export:</strong> Save shapes as GeoJSON</li>
                <li>• <strong>Import:</strong> Load GeoJSON data onto the map</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-medium text-gray-800 mb-2">Statistics:</h3>
          <p className="text-sm text-gray-600">
            Shapes created in this session: <span className="font-semibold">{drawnShapes.length}</span>
          </p>
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div style={{ height: '600px' }}>
            {useAdvancedMap ? (
              <MapWithDrawing
                className="h-full"
                enableDrawing={true}
                initialGeoJson={sampleGeoJson}
              />
            ) : (
              <Map
                className="h-full"
                enableDrawing={true}
                onShapeCreated={handleShapeCreated}
                initialGeoJson={sampleGeoJson}
              />
            )}
          </div>
        </div>

        {/* Sample GeoJSON */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Sample GeoJSON for Testing:</h2>
          <p className="text-sm text-gray-600 mb-4">
            Copy this GeoJSON and use the "Import GeoJSON" button to see it on the map:
          </p>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-60">
            {JSON.stringify(sampleGeoJson, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 