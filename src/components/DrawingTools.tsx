"use client";

import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface DrawingToolsProps {
  onShapeCreated?: (geoJson: GeoJSON.Feature, layer: L.Layer) => void;
  onShapeEdited?: (layers: L.LayerGroup) => void;
  onShapeDeleted?: (layers: L.LayerGroup) => void;
  enabledTools?: {
    circle?: boolean;
    rectangle?: boolean;
    polygon?: boolean;
    polyline?: boolean;
    marker?: boolean;
  };
  initialGeoJson?: GeoJSON.FeatureCollection;
  shapeColor?: string;
  fillColor?: string;
  fillOpacity?: number;
  isSpatialQueryMode?: boolean;
  onSpatialQueryShapeCreated?: (geoJson: GeoJSON.Feature) => void;
  drawnItems?: L.FeatureGroup;
}

export default function DrawingTools({
  onShapeCreated,
  onShapeEdited,
  onShapeDeleted,
  enabledTools = {
    circle: true,
    rectangle: true,
    polygon: true,
    polyline: true,
    marker: true
  },
  initialGeoJson,
  shapeColor = '#3388ff',
  fillColor = '#3388ff',
  fillOpacity = 0.2,
  isSpatialQueryMode = false,
  onSpatialQueryShapeCreated,
  drawnItems
}: DrawingToolsProps) {
  const map = useMap();
  const localDrawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const drawControlRef = useRef<any>(null);
  const [drawToolsLoaded, setDrawToolsLoaded] = useState(false);
  const [drawingError, setDrawingError] = useState<string | null>(null);

  // Use provided drawnItems or local one
  const activeDrawnItems = drawnItems || localDrawnItemsRef.current;

  useEffect(() => {
    // Dynamic import of leaflet-draw to ensure it works in Next.js
    const loadLeafletDraw = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        // Import leaflet-draw dynamically
        await import('leaflet-draw');
        
        // Add CSS link dynamically
        if (!document.querySelector('link[href*="leaflet.draw.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css';
          document.head.appendChild(link);
        }
        
        const drawnItems = activeDrawnItems;
        
        // Ensure map is ready before adding layers
        if (!map || !map.getContainer()) {
          return;
        }

        // Check if draw control already exists
        if (drawControlRef.current) {
          return;
        }

        map.addLayer(drawnItems);

        // Load initial GeoJSON if provided
        if (initialGeoJson) {
          L.geoJSON(initialGeoJson, {
            style: {
              color: '#3388ff',
              weight: 3,
              opacity: 0.8,
              fillOpacity: 0.2
            }
          }).eachLayer((layer) => {
            drawnItems.addLayer(layer);
          });
        }

        // Check if L.Control.Draw is available
        if (!(L.Control as any).Draw) {
          throw new Error('Leaflet Draw not properly loaded');
        }

        // Drawing control options
        const drawControl = new (L.Control as any).Draw({
          position: 'topleft',
          draw: {
            circle: enabledTools.circle ? {
              shapeOptions: {
                color: isSpatialQueryMode ? '#ff4444' : shapeColor,
                fillColor: isSpatialQueryMode ? '#ff4444' : fillColor,
                weight: 3,
                opacity: 0.8,
                fillOpacity: fillOpacity
              }
            } : false,
            rectangle: enabledTools.rectangle ? {
              shapeOptions: {
                color: isSpatialQueryMode ? '#ff4444' : shapeColor,
                fillColor: isSpatialQueryMode ? '#ff4444' : fillColor,
                weight: 3,
                opacity: 0.8,
                fillOpacity: fillOpacity
              }
            } : false,
            polygon: enabledTools.polygon ? {
              allowIntersection: false,
              shapeOptions: {
                color: isSpatialQueryMode ? '#ff4444' : shapeColor,
                fillColor: isSpatialQueryMode ? '#ff4444' : fillColor,
                weight: 3,
                opacity: 0.8,
                fillOpacity: fillOpacity
              }
            } : false,
            polyline: enabledTools.polyline ? {
              shapeOptions: {
                color: isSpatialQueryMode ? '#ff4444' : shapeColor,
                weight: 3,
                opacity: 0.8
              }
            } : false,
            marker: enabledTools.marker ? {} : false,
            circlemarker: false
          },
          edit: {
            featureGroup: drawnItems,
            remove: true
          }
        });

        drawControlRef.current = drawControl;
        map.addControl(drawControl);

        // Event handlers
        const onDrawCreated = (e: any) => {
          const { layer } = e;
          drawnItems.addLayer(layer);
          
          if (isSpatialQueryMode && onSpatialQueryShapeCreated) {
            const geoJson = layer.toGeoJSON();
            onSpatialQueryShapeCreated(geoJson);
          } else if (onShapeCreated) {
            const geoJson = layer.toGeoJSON();
            onShapeCreated(geoJson, layer);
          }
        };

        const onDrawEdited = (e: any) => {
          if (onShapeEdited) {
            onShapeEdited(e.layers);
          }
        };

        const onDrawDeleted = (e: any) => {
          if (onShapeDeleted) {
            onShapeDeleted(e.layers);
          }
        };

        // Add event listeners
        if ((L as any).Draw?.Event) {
          map.on((L as any).Draw.Event.CREATED, onDrawCreated);
          map.on((L as any).Draw.Event.EDITED, onDrawEdited);
          map.on((L as any).Draw.Event.DELETED, onDrawDeleted);
        }

        setDrawToolsLoaded(true);
        setDrawingError(null);

      } catch (error) {
        console.error('Error loading leaflet-draw:', error);
        setDrawingError('Drawing tools failed to load. Please refresh the page.');
        
        // Fallback: Add a simple message to the map
        if (map) {
          const ErrorControl = L.Control.extend({
            onAdd: function() {
              const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
              div.innerHTML = `
                <div style="background: #fff; padding: 10px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
                  <div style="color: #e74c3c; font-size: 12px; font-weight: bold;">Drawing Tools Unavailable</div>
                  <div style="color: #666; font-size: 11px; margin-top: 2px;">Please refresh the page</div>
                </div>
              `;
              return div;
            }
          });
          
          const errorControl = new ErrorControl({ position: 'topleft' });
          errorControl.addTo(map);
        }
      }
    };

    loadLeafletDraw();

    // Cleanup
    return () => {
      try {
        if (map && drawControlRef.current) {
          map.removeControl(drawControlRef.current);
          drawControlRef.current = null;
        }
        if (map && activeDrawnItems && map.hasLayer && map.hasLayer(activeDrawnItems)) {
          map.removeLayer(activeDrawnItems);
        }
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, [
    map,
    onShapeCreated,
    onShapeEdited,
    onShapeDeleted,
    enabledTools,
    initialGeoJson,
    shapeColor,
    fillColor,
    fillOpacity,
    isSpatialQueryMode,
    onSpatialQueryShapeCreated,
    drawnItems
  ]);

  // Show loading/error state in development
  if (process.env.NODE_ENV === 'development' && !drawToolsLoaded && !drawingError) {
    console.log('Loading drawing tools...');
  }

  return null;
}

// Utility function to convert drawn layers to GeoJSON
export const exportToGeoJSON = (drawnItems: L.FeatureGroup): GeoJSON.FeatureCollection => {
  const features: GeoJSON.Feature[] = [];
  
  drawnItems.eachLayer((layer: any) => {
    if (layer.toGeoJSON) {
      features.push(layer.toGeoJSON());
    }
  });

  return {
    type: 'FeatureCollection',
    features
  };
};

// Utility function to load GeoJSON data onto the map
export const loadGeoJSON = (
  map: L.Map, 
  geoJsonData: GeoJSON.FeatureCollection | GeoJSON.Feature,
  drawnItems: L.FeatureGroup,
  options?: L.GeoJSONOptions
) => {
  const defaultOptions: L.GeoJSONOptions = {
    style: {
      color: '#3388ff',
      weight: 3,
      opacity: 0.8,
      fillOpacity: 0.2
    },
    onEachFeature: (feature, layer) => {
      // Add popup with feature properties if they exist
      if (feature.properties && Object.keys(feature.properties).length > 0) {
        const popupContent = Object.entries(feature.properties)
          .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
          .join('<br>');
        layer.bindPopup(popupContent);
      }
    }
  };

  const geoJsonLayer = L.geoJSON(geoJsonData, { ...defaultOptions, ...options });
  
  geoJsonLayer.eachLayer((layer) => {
    drawnItems.addLayer(layer);
  });

  return geoJsonLayer;
}; 