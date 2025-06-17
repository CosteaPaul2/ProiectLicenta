"use client";

import { useState } from 'react';
import L from 'leaflet';
import { Button, Textarea, Divider } from "@heroui/react";
import { exportToGeoJSON, loadGeoJSON } from './DrawingTools';

interface DataManagementProps {
  drawnItems: L.FeatureGroup;
  map: L.Map;
}

export default function DataManagement({ drawnItems, map }: DataManagementProps) {
  const [showImportExport, setShowImportExport] = useState(false);
  const [geoJsonText, setGeoJsonText] = useState<string>('');

  // Export shapes to GeoJSON
  const exportShapes = () => {
    try {
      const geoJsonData = exportToGeoJSON(drawnItems);
      const jsonString = JSON.stringify(geoJsonData, null, 2);
      setGeoJsonText(jsonString);
      setShowImportExport(true);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export shapes');
    }
  };

  // Import GeoJSON data
  const importShapes = () => {
    try {
      const geoJsonData = JSON.parse(geoJsonText);
      loadGeoJSON(map, geoJsonData, drawnItems);
      setGeoJsonText('');
      setShowImportExport(false);
      alert('Shapes imported successfully!');
    } catch (error) {
      console.error('Import error:', error);
      alert('Invalid GeoJSON format. Please check your data.');
    }
  };

  // Download GeoJSON file
  const downloadGeoJSON = () => {
    try {
      const geoJsonData = exportToGeoJSON(drawnItems);
      const jsonString = JSON.stringify(geoJsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `map-shapes-${new Date().toISOString().split('T')[0]}.geojson`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download shapes');
    }
  };

  // Clear all shapes
  const clearAllShapes = () => {
    if (confirm('Are you sure you want to clear all drawn shapes?')) {
      drawnItems.clearLayers();
    }
  };

  return (
    <div className="space-y-4 max-h-80 overflow-y-auto text-white">
      {/* Data Management */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-200">
          Shape Management
        </label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              onPress={exportShapes}
              color="primary"
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              📤 Export
            </Button>
            <Button
              onPress={() => setShowImportExport(true)}
              color="secondary"
              size="sm"
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              📥 Import
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              onPress={downloadGeoJSON}
              color="success"
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              💾 Download
            </Button>
            <Button
              onPress={clearAllShapes}
              color="danger"
              size="sm"
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              🗑️ Clear All
            </Button>
          </div>
        </div>
      </div>

      <Divider className="bg-gray-700" />

      {/* Shape Statistics */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-200">
          Statistics
        </label>
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-600">
          <p className="text-sm text-gray-200">
            <strong className="text-white">Total Shapes:</strong> {drawnItems.getLayers().length}
          </p>
          <Button
            onPress={() => {
              console.log('🔍 All shapes:', drawnItems.getLayers());
              drawnItems.getLayers().forEach((layer, index) => {
                console.log(`Shape ${index + 1}:`, (layer as any).toGeoJSON?.());
              });
            }}
            size="sm"
            variant="light"
            className="text-xs mt-2 text-gray-300 hover:text-white hover:bg-gray-700"
          >
            Debug Shapes
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-green-900/50 p-3 rounded-lg border border-green-700">
        <p className="text-xs text-green-200">
          <strong className="text-green-100">Data Management:</strong><br/>
          • Export: View GeoJSON data<br/>
          • Import: Load GeoJSON from text<br/>
          • Download: Save as .geojson file<br/>
          • Clear All: Remove all shapes
        </p>
      </div>

      {/* Import/Export Modal */}
      {showImportExport && (
        <div className="fixed inset-0 bg-black/70 z-[10000] flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-700">
            <div className="p-4 border-b border-gray-700 bg-gray-800">
              <h3 className="text-lg font-semibold text-white">Import/Export GeoJSON</h3>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto bg-gray-900">
              <Textarea
                value={geoJsonText}
                onChange={(e) => setGeoJsonText(e.target.value)}
                placeholder="Paste GeoJSON data here..."
                minRows={10}
                className="w-full font-mono text-sm"
                classNames={{
                  input: "bg-gray-800 text-white placeholder:text-gray-400 border-gray-600",
                  inputWrapper: "bg-gray-800 border-gray-600"
                }}
              />
            </div>
            <div className="p-4 border-t border-gray-700 flex gap-2 justify-end bg-gray-800">
              <Button
                onPress={() => {
                  setShowImportExport(false);
                  setGeoJsonText('');
                }}
                variant="light"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onPress={importShapes}
                color="primary"
                size="sm"
                isDisabled={!geoJsonText.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Import
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 