"use client";

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface SavedShape {
  id: number;
  name: string;
  description?: string;
  shapeType: string;
  geoJson: GeoJSON.Feature;
  style: {
    color: string;
    fillColor: string;
    fillOpacity: number;
  };
  createdAt: string;
}

interface SavedShapesLayerProps {
  shapes: SavedShape[];
}

export default function SavedShapesLayer({ shapes }: SavedShapesLayerProps) {
  const map = useMap();
  const layerGroupRef = useRef<L.LayerGroup>(new L.LayerGroup());

  useEffect(() => {
    const layerGroup = layerGroupRef.current;
    
    // Ensure map is ready
    if (!map || !map.getContainer()) {
      return;
    }
    
    // Clear existing shapes
    layerGroup.clearLayers();
    
    // Add shapes to the layer group
    if (shapes && Array.isArray(shapes)) {
      shapes.forEach((shape) => {
        try {
          // Validate shape data
          if (!shape.geoJson || !shape.geoJson.geometry) {
            console.warn('Invalid shape data:', shape);
            return;
          }

          const geoJsonLayer = L.geoJSON(shape.geoJson, {
            style: {
              color: shape.style?.color || '#3388ff',
              fillColor: shape.style?.fillColor || '#3388ff',
              weight: 3,
              opacity: 0.8,
              fillOpacity: shape.style?.fillOpacity || 0.2,
            }
          });

          // Add popup with shape information
          geoJsonLayer.bindPopup(`
            <div class="p-3 min-w-[200px]">
              <h3 class="font-bold text-lg mb-2 text-gray-800">${shape.name || 'Unnamed Shape'}</h3>
              ${shape.description ? `<p class="text-sm text-gray-600 mb-2">${shape.description}</p>` : ''}
              <div class="space-y-1">
                <div class="flex justify-between items-center">
                  <span class="font-medium text-gray-600">Type:</span>
                  <span class="text-sm text-gray-700 capitalize">${shape.shapeType || 'Unknown'}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="font-medium text-gray-600">ID:</span>
                  <span class="text-xs text-gray-500">#${shape.id || 'N/A'}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="font-medium text-gray-600">Created:</span>
                  <span class="text-xs text-gray-500">${shape.createdAt ? new Date(shape.createdAt).toLocaleDateString() : 'Unknown'}</span>
                </div>
              </div>
            </div>
          `);

          layerGroup.addLayer(geoJsonLayer);
        } catch (error) {
          console.error('Error adding shape to map:', error, shape);
        }
      });
    }

    // Add layer group to map
    try {
      if (!map.hasLayer(layerGroup)) {
        map.addLayer(layerGroup);
      }
    } catch (error) {
      console.error('Error adding layer group to map:', error);
    }

    return () => {
      try {
        if (map.hasLayer && map.hasLayer(layerGroup)) {
          map.removeLayer(layerGroup);
        }
      } catch (error) {
        console.error('Error removing layer group from map:', error);
      }
    };
  }, [map, shapes]);

  return null;
} 