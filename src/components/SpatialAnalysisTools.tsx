"use client";

import { useState, useRef } from 'react';
import L from 'leaflet';
import * as turf from '@turf/turf';
import { Button, Input, Select, SelectItem, Divider, Chip } from "@heroui/react";

interface SpatialAnalysisToolsProps {
  drawnItems: L.FeatureGroup;
  map: L.Map;
  onAnalysisComplete?: (result: GeoJSON.Feature) => void;
}

export default function SpatialAnalysisTools({ drawnItems, map, onAnalysisComplete }: SpatialAnalysisToolsProps) {
  const [bufferDistance, setBufferDistance] = useState<number>(1000); // meters
  const [measurementType, setMeasurementType] = useState<string>('area');
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [lastMeasurement, setLastMeasurement] = useState<string>('');
  const tempLayer = useRef<L.Layer | null>(null);

  // Create buffer zone around selected feature
  const createBuffer = () => {
    console.log('🔍 Creating buffer...');
    const layers = drawnItems.getLayers();
    console.log('📍 Available layers:', layers.length);
    
    if (layers.length === 0) {
      alert('Please draw a shape first');
      return;
    }

    try {
      const selectedLayer = layers[layers.length - 1];
      console.log('📐 Selected layer:', selectedLayer);
      
      const geoJson = (selectedLayer as any).toGeoJSON();
      console.log('🗺️ GeoJSON:', geoJson);
      
      // Create buffer using turf.js
      const buffered = turf.buffer(geoJson, bufferDistance / 1000, { units: 'kilometers' });
      console.log('🎯 Buffer result:', buffered);
      
      if (!buffered) {
        alert('Failed to create buffer');
        return;
      }
      
      // Add buffer to map
      const bufferLayer = L.geoJSON(buffered, {
        style: {
          color: '#ff4444',
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.2
        }
      }).addTo(map);

      console.log('✅ Buffer added to map');

      if (onAnalysisComplete) {
        onAnalysisComplete(buffered);
      }
    } catch (error) {
      console.error('❌ Buffer creation error:', error);
      alert(`Buffer creation failed: ${error}`);
    }
  };

  // Calculate area or length of selected feature
  const measureFeature = () => {
    console.log('📏 Measuring feature...');
    const layers = drawnItems.getLayers();
    console.log('📍 Available layers for measurement:', layers.length);
    
    if (layers.length === 0) {
      alert('Please draw a shape first');
      return;
    }

    try {
      const selectedLayer = layers[layers.length - 1];
      const geoJson = (selectedLayer as any).toGeoJSON();
      console.log('🗺️ Measuring GeoJSON:', geoJson);
      
      let measurement: number;
      let unit: string;
      
      if (measurementType === 'area') {
        measurement = turf.area(geoJson);
        unit = 'square meters';
        console.log('📐 Raw area:', measurement, unit);
        
        // Convert to more readable units
        if (measurement > 1000000) {
          measurement = measurement / 1000000;
          unit = 'square kilometers';
        } else if (measurement > 10000) {
          measurement = measurement / 10000;
          unit = 'hectares';
        }
      } else {
        measurement = turf.length(geoJson, { units: 'meters' });
        unit = 'meters';
        console.log('📏 Raw length:', measurement, unit);
        
        if (measurement > 1000) {
          measurement = measurement / 1000;
          unit = 'kilometers';
        }
      }

      // Format the measurement
      const formattedMeasurement = new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2
      }).format(measurement);

      const result = `${measurementType === 'area' ? 'Area' : 'Length'}: ${formattedMeasurement} ${unit}`;
      console.log('✅ Measurement result:', result);
      setLastMeasurement(result);
    } catch (error) {
      console.error('❌ Measurement error:', error);
      alert(`Measurement failed: ${error}`);
    }
  };

  // Start interactive measurement
  const startMeasurement = () => {
    if (isMeasuring) {
      // Stop measuring
      setIsMeasuring(false);
      map.off('click');
      map.off('dblclick');
      
      if (tempLayer.current) {
        map.removeLayer(tempLayer.current);
        tempLayer.current = null;
      }
      return;
    }

    setIsMeasuring(true);
    const points: L.LatLng[] = [];
    
    const onMapClick = (e: L.LeafletMouseEvent) => {
      points.push(e.latlng);
      
      if (tempLayer.current) {
        map.removeLayer(tempLayer.current);
      }
      
      if (points.length > 1) {
        const line = L.polyline(points, {
          color: '#3388ff',
          weight: 3
        });
        tempLayer.current = line.addTo(map);
        
        // Calculate and show measurement
        const lineGeoJson = line.toGeoJSON();
        const length = turf.length(lineGeoJson, { units: 'meters' });
        
        let displayLength = length;
        let unit = 'meters';
        
        if (length > 1000) {
          displayLength = length / 1000;
          unit = 'km';
        }
        
        const popup = L.popup()
          .setLatLng(e.latlng)
          .setContent(`Length: ${displayLength.toFixed(2)} ${unit}`)
          .openOn(map);
      }
    };
    
    const onDoubleClick = () => {
      setIsMeasuring(false);
      map.off('click', onMapClick);
      map.off('dblclick', onDoubleClick);
      
      if (tempLayer.current && points.length > 1) {
        const lineGeoJson = (tempLayer.current as any).toGeoJSON();
        const length = turf.length(lineGeoJson, { units: 'meters' });
        
        let displayLength = length;
        let unit = 'meters';
        
        if (length > 1000) {
          displayLength = length / 1000;
          unit = 'kilometers';
        }
        
        setLastMeasurement(`Distance: ${displayLength.toFixed(2)} ${unit}`);
      }
      
      if (tempLayer.current) {
        map.removeLayer(tempLayer.current);
        tempLayer.current = null;
      }
    };
    
    map.on('click', onMapClick);
    map.on('dblclick', onDoubleClick);
  };

  // Calculate intersection
  const calculateIntersection = () => {
    const layers = drawnItems.getLayers();
    if (layers.length < 2) {
      alert('Please draw at least 2 shapes to calculate intersection');
      return;
    }

    const shape1 = (layers[layers.length - 1] as any).toGeoJSON();
    const shape2 = (layers[layers.length - 2] as any).toGeoJSON();
    
    try {
      const intersection = turf.intersect(shape1, shape2);
      
      if (intersection) {
        // Add intersection to map
        const intersectionLayer = L.geoJSON(intersection, {
          style: {
            color: '#00ff00',
            weight: 3,
            opacity: 0.8,
            fillOpacity: 0.3
          }
        }).addTo(map);

        const area = turf.area(intersection);
        let displayArea = area;
        let unit = 'square meters';
        
        if (area > 1000000) {
          displayArea = area / 1000000;
          unit = 'square km';
        } else if (area > 10000) {
          displayArea = area / 10000;
          unit = 'hectares';
        }
        
        setLastMeasurement(`Intersection area: ${displayArea.toFixed(2)} ${unit}`);
        
        if (onAnalysisComplete) {
          onAnalysisComplete(intersection);
        }
      } else {
        setLastMeasurement('No intersection found');
      }
    } catch (error) {
      setLastMeasurement('Error calculating intersection');
    }
  };

  const clearAnalysis = () => {
    setLastMeasurement('');
    if (tempLayer.current) {
      map.removeLayer(tempLayer.current);
      tempLayer.current = null;
    }
  };

  return (
    <div className="space-y-4 max-h-80 overflow-y-auto text-white">
      {/* Buffer Analysis */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-200">
          Buffer Analysis
        </label>
        <div className="space-y-2">
          <Input
            type="number"
            placeholder="Distance (meters)"
            value={bufferDistance.toString()}
            onChange={(e) => setBufferDistance(Number(e.target.value))}
            size="sm"
            classNames={{
              input: "bg-gray-800 text-white placeholder:text-gray-400",
              inputWrapper: "bg-gray-800 border-gray-600 hover:border-gray-500"
            }}
          />
          <Button
            onPress={createBuffer}
            color="primary"
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Create Buffer Zone
          </Button>
        </div>
      </div>

      <Divider className="bg-gray-700" />

      {/* Measurement Tools */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-200">
          Measurement Tools
        </label>
        <div className="space-y-2">
          <Select
            selectedKeys={[measurementType]}
            onSelectionChange={(keys) => setMeasurementType(Array.from(keys)[0] as string)}
            size="sm"
            classNames={{
              trigger: "bg-gray-800 border-gray-600 hover:border-gray-500",
              value: "text-white",
              popoverContent: "bg-gray-800 border-gray-600",
              listboxWrapper: "bg-gray-800"
            }}
          >
            <SelectItem key="area" className="text-white hover:bg-gray-700">Area</SelectItem>
            <SelectItem key="length" className="text-white hover:bg-gray-700">Length</SelectItem>
          </Select>
          
          <div className="flex gap-2">
            <Button
              onPress={measureFeature}
              color="success"
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Measure Shape
            </Button>
            
            <Button
              onPress={startMeasurement}
              color={isMeasuring ? "danger" : "secondary"}
              size="sm"
              className={`flex-1 ${isMeasuring ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}`}
            >
              {isMeasuring ? 'Stop' : 'Draw & Measure'}
            </Button>
          </div>
        </div>
      </div>

      <Divider className="bg-gray-700" />

      {/* Spatial Operations */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-200">
          Spatial Operations
        </label>
        <Button
          onPress={calculateIntersection}
          color="warning"
          size="sm"
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          Calculate Intersection
        </Button>
      </div>

      <Divider className="bg-gray-700" />

      {/* Results Display */}
      {lastMeasurement && (
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-600">
          <div className="flex justify-between items-start">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Last Result
              </label>
              <p className="text-sm font-mono text-green-400">{lastMeasurement}</p>
            </div>
            <Button
              onPress={clearAnalysis}
              size="sm"
              variant="light"
              isIconOnly
              className="text-gray-400 hover:text-white hover:bg-gray-700"
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      <Divider className="bg-gray-700" />

      {/* Instructions */}
      <div className="bg-blue-900/50 p-3 rounded-lg border border-blue-700">
        <p className="text-xs text-blue-200">
          <strong className="text-blue-100">Instructions:</strong><br/>
          • Draw shapes using drawing tools<br/>
          • Use analysis tools on drawn shapes<br/>
          • Interactive measurement: click to start, double-click to finish
        </p>
        
        {/* Debug Info */}
        <div className="mt-2 pt-2 border-t border-blue-700">
          <p className="text-xs text-blue-300">
            <strong>Debug:</strong> Available shapes: {drawnItems.getLayers().length}
          </p>
          <Button
            onPress={() => {
              console.log('🔍 Debug - drawnItems:', drawnItems);
              console.log('🔍 Debug - layers:', drawnItems.getLayers());
              drawnItems.getLayers().forEach((layer, index) => {
                console.log(`🔍 Layer ${index}:`, layer, (layer as any).toGeoJSON?.());
              });
            }}
            size="sm"
            variant="light"
            className="text-xs mt-1 text-blue-300 hover:text-blue-100 hover:bg-blue-800"
          >
            Debug Layers
          </Button>
        </div>
      </div>
    </div>
  );
} 