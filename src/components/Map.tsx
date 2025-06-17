"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocationWithData } from "@/types/location";
import DrawingTools from "./DrawingTools";
import SpatialAnalysisTools from "./SpatialAnalysisTools";
import SearchAndFilter from "./SearchAndFilter";
import DataManagement from "./DataManagement";
import { Card, CardBody, Button, Tabs, Tab } from "@heroui/react";
import SavedShapesLayer from "./SavedShapesLayer";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for different layer types with data values
const createLayerIcon = (location: LocationWithData) => {
  let displayValue = "";
  let color = "#6b7280"; // default gray

  switch (location.layerType) {
    case 'co2':
      const co2Level = location.co2Level || 0;
      displayValue = Math.round(co2Level).toString();
      if (co2Level > 500) color = '#dc3545';
      else if (co2Level > 450) color = '#ffc107';
      else color = '#28a745';
      break;
    
    case 'air_quality':
      const pm25 = location.pm25;
      if (pm25) {
        displayValue = Math.round(pm25).toString();
        if (pm25 > 75) color = '#dc3545';
        else if (pm25 > 35) color = '#ffc107';
        else color = '#28a745';
      } else {
        displayValue = "AQ";
      }
      break;
    
    case 'temperature':
      const temp = location.temperature;
      if (temp) {
        displayValue = Math.round(temp).toString() + "°";
        if (temp > 30) color = '#dc3545';
        else if (temp > 20) color = '#ffc107';
        else color = '#3b82f6';
      } else {
        displayValue = "T";
      }
      break;
    
    case 'industrial':
      displayValue = "🏭";
      color = '#9ca3af';
      break;
    
    case 'traffic':
      displayValue = "🚗";
      color = '#34d399';
      break;
  }
  
  return L.divIcon({
    className: 'custom-layer-marker',
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
        ${displayValue}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

// Component to handle map interactions
function MapEvents({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  const map = useMap();
  
  useEffect(() => {
    if (!onMapClick) return;
    
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

// Component to provide map instance to analysis tools
function MapWithAnalysis({ 
  enableAnalysis, 
  drawnItemsRef, 
  showTools, 
  selectedTool, 
  setSelectedTool,
  locations,
  onFilterChange 
}: {
  enableAnalysis: boolean;
  drawnItemsRef: React.RefObject<L.FeatureGroup>;
  showTools: boolean;
  selectedTool: string;
  setSelectedTool: (tool: string) => void;
  locations: any[];
  onFilterChange: any;
}) {
  const map = useMap();
  
  // Stable callback to prevent infinite loops
  const stableOnFilterChange = useCallback((filteredLocations: any[]) => {
    onFilterChange?.(filteredLocations);
  }, [onFilterChange]);
  
  return (
    <>
      {/* Tools Panel - moved inside MapContainer */}
      {showTools && (
        <Card className="absolute top-16 right-4 z-[1000] w-80 max-h-96 bg-gray-900/95 backdrop-blur-md border border-gray-700 shadow-2xl">
          <CardBody className="text-white">
            {enableAnalysis && (
              <div className="mb-3 p-2 bg-purple-900/80 rounded-lg border border-purple-700">
                <p className="text-xs text-purple-200 font-medium">
                  🔬 Analysis Mode Active
                </p>
                <p className="text-xs text-purple-300">
                  Draw shapes and use analysis tools below
                </p>
              </div>
            )}
            <Tabs
              selectedKey={selectedTool}
              onSelectionChange={(key) => setSelectedTool(key as string)}
              className="w-full"
              classNames={{
                tabList: "bg-gray-800 text-white",
                tab: "text-gray-300 hover:text-white",
                tabContent: "text-gray-300",
                cursor: "bg-blue-600",
                panel: "text-white"
              }}
            >
              <Tab key="search" title="Search">
                <div className="mt-4">
                  <SearchAndFilter
                    locations={locations}
                    onFilterChange={stableOnFilterChange}
                  />
                </div>
              </Tab>
              {enableAnalysis && (
                <Tab key="analysis" title="Analysis">
                  <div className="mt-4">
                    <SpatialAnalysisTools
                      drawnItems={drawnItemsRef.current!}
                      map={map}
                      onAnalysisComplete={(result) => {
                        console.log('Analysis result:', result);
                      }}
                    />
                  </div>
                </Tab>
              )}
              <Tab key="data" title="Data">
                <div className="mt-4">
                  <DataManagement
                    drawnItems={drawnItemsRef.current!}
                    map={map}
                  />
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      )}
    </>
  );
}

interface MapProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  showClickToAdd?: boolean;
  locations?: LocationWithData[];
  filteredLocations?: LocationWithData[];
  onFilterChange?: (locations: LocationWithData[]) => void;
  className?: string;
  enableDrawing?: boolean;
  enableAnalysis?: boolean;
  onShapeCreated?: (geoJson: GeoJSON.Feature, layer: L.Layer) => void;
  initialGeoJson?: GeoJSON.FeatureCollection;
  shapeColor?: string;
  fillColor?: string;
  fillOpacity?: number;
  savedShapes?: any[];
}

export default function Map({ 
  onLocationSelect, 
  showClickToAdd = false, 
  locations = [], 
  filteredLocations,
  onFilterChange,
  className,
  enableDrawing = false,
  enableAnalysis = false,
  onShapeCreated,
  initialGeoJson,
  shapeColor = '#3388ff',
  fillColor = '#3388ff',
  fillOpacity = 0.2,
  savedShapes = []
}: MapProps) {
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const [selectedTool, setSelectedTool] = useState<string>("search");
  const [showTools, setShowTools] = useState(false);

  // Auto-open tools panel and switch to analysis tab when analysis mode is enabled
  useEffect(() => {
    if (enableAnalysis) {
      setShowTools(true);
      setSelectedTool("analysis");
    }
  }, [enableAnalysis]);

  // Use filteredLocations directly without additional state
  const displayedLocations = filteredLocations || locations;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const getLayerTypeLabel = (layerType: string) => {
    const labels = {
      co2: "CO2 Emissions",
      air_quality: "Air Quality",
      temperature: "Temperature",
      industrial: "Industrial",
      traffic: "Traffic"
    };
    return labels[layerType as keyof typeof labels] || layerType;
  };

  const renderPopupContent = (location: LocationWithData) => {
    return (
      <div className="p-3 min-w-[250px]">
        <h3 className="font-bold text-lg mb-3 text-gray-800">
          {location.name}
        </h3>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Type:</span>
            <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
              {getLayerTypeLabel(location.layerType)}
            </span>
          </div>

          {location.category && (
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Category:</span>
              <span className="text-sm text-gray-700 capitalize">
                {location.category.replace('_', ' ')}
              </span>
            </div>
          )}
          
          {/* Layer-specific data */}
          {location.layerType === 'co2' && location.co2Level && (
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">CO2 Level:</span>
              <span className="font-bold text-red-600">
                {location.co2Level} ppm
              </span>
            </div>
          )}

          {location.layerType === 'air_quality' && (
            <>
              {location.pm25 && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-600">PM2.5:</span>
                  <span className="font-bold text-purple-600">
                    {location.pm25} μg/m³
                  </span>
                </div>
              )}
              {location.pm10 && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-600">PM10:</span>
                  <span className="font-bold text-purple-600">
                    {location.pm10} μg/m³
                  </span>
                </div>
              )}
            </>
          )}

          {location.temperature && (
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Temperature:</span>
              <span className="font-bold text-orange-600">
                {location.temperature}°C
              </span>
            </div>
          )}

          {location.layerType === 'industrial' && (
            <>
              {location.industryType && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-600">Industry:</span>
                  <span className="text-sm text-gray-700 capitalize">
                    {location.industryType.replace('_', ' ')}
                  </span>
                </div>
              )}
              {location.emissionRate && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-600">Emission Rate:</span>
                  <span className="font-bold text-gray-700">
                    {location.emissionRate} t/yr
                  </span>
                </div>
              )}
            </>
          )}

          {location.layerType === 'traffic' && (
            <>
              {location.vehicleCount && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-600">Vehicle Count:</span>
                  <span className="font-bold text-green-600">
                    {location.vehicleCount}
                  </span>
                </div>
              )}
              {location.avgSpeed && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-600">Avg Speed:</span>
                  <span className="font-bold text-green-600">
                    {location.avgSpeed} km/h
                  </span>
                </div>
              )}
            </>
          )}
          
          <div className="pt-2 border-t border-gray-200 mt-3">
            <div className="text-xs text-gray-500">
              Added: {formatDate(location.createdAt)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Tools Toggle Button */}
      <Button
        className="absolute top-4 right-4 z-[1000]"
        color={enableAnalysis ? "secondary" : "primary"}
        variant={showTools ? "solid" : "flat"}
        onPress={() => setShowTools(!showTools)}
      >
        {enableAnalysis ? "🔬 Analysis" : "🔧 Tools"}
        {enableAnalysis && <span className="ml-1 text-xs">●</span>}
      </Button>



      {showClickToAdd && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-blue-900/90 backdrop-blur-md text-white px-4 py-2 rounded-lg border border-blue-700 shadow-lg">
          Click on the map to add a new monitoring location
        </div>
      )}

      {/* Drawing Mode Debug Info */}
      {enableDrawing && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-black/80 backdrop-blur-md text-white px-3 py-2 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span>
              {enableAnalysis ? "🔬 Analysis Mode" : "✏️ Drawing Mode"} Active
            </span>
          </div>
          <div className="text-xs text-gray-300 mt-1">
            Drawing tools should appear in top-left corner
          </div>
        </div>
      )}

      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapEvents onMapClick={onLocationSelect} />
        
        {/* Map with Analysis Tools */}
        <MapWithAnalysis
          enableAnalysis={enableAnalysis}
          drawnItemsRef={{ current: drawnItemsRef.current }}
          showTools={showTools}
          selectedTool={selectedTool}
          setSelectedTool={setSelectedTool}
          locations={locations}
          onFilterChange={onFilterChange}
        />
        
        {/* Saved Shapes Layer */}
        <SavedShapesLayer shapes={savedShapes} />
        
        {/* Drawing Tools */}
        {enableDrawing && (
          <DrawingTools
            onShapeCreated={onShapeCreated}
            initialGeoJson={initialGeoJson}
            shapeColor={shapeColor}
            fillColor={fillColor}
            fillOpacity={fillOpacity}
            isSpatialQueryMode={enableAnalysis}
            drawnItems={drawnItemsRef.current}
            enabledTools={{
              circle: true,
              rectangle: true,
              polygon: true,
              polyline: true,
              marker: true
            }}
          />
        )}
        
        {displayedLocations.map((location) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
            icon={createLayerIcon(location)}
          >
            <Popup>
              {renderPopupContent(location)}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
