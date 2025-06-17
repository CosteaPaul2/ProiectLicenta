"use client"

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import AddLocationForm from "./AddLocationForm";
import UserCardComponent from "./UserCardComponent";
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Switch, 
  Tabs, 
  Tab, 
  Divider,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@heroui/react";
import LayerControl, { defaultLayers, LayerConfig } from "./LayerControl";
import { LocationWithData } from "@/types/location";
import { LayerType } from "@/db/schema/locations";
import L from 'leaflet';
import ShapePropertiesModal from "./ShapePropertiesModal";
import SavedShapesLayer from "./SavedShapesLayer";

// Dynamically import the Map component to avoid SSR issues
const Map = dynamic(() => import('./Map'), { ssr: false });

interface DashboardClientProps {
  userEmail: string;
  initialLocations: LocationWithData[];
}

// Sample data for demonstration
const sampleLocations: LocationWithData[] = [
  {
    id: "sample-1",
    name: "Central Park Monitor",
    latitude: 51.505,
    longitude: -0.09,
    layerType: "air_quality" as LayerType,
    category: "urban",
    pm25: 15.2,
    pm10: 28.5,
    temperature: 22.5,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    userId: "demo-user"
  },
  {
    id: "sample-2",
    name: "Industrial Zone CO2",
    latitude: 51.515,
    longitude: -0.08,
    layerType: "co2" as LayerType,
    category: "industrial",
    co2Level: 420.5,
    temperature: 24.1,
    industryType: "manufacturing",
    emissionRate: 1250,
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
    userId: "demo-user"
  },
  {
    id: "sample-3",
    name: "Highway Traffic Monitor",
    latitude: 51.495,
    longitude: -0.095,
    layerType: "traffic" as LayerType,
    category: "transportation",
    vehicleCount: 1580,
    avgSpeed: 45.2,
    temperature: 21.8,
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
    userId: "demo-user"
  },
  {
    id: "sample-4",
    name: "Residential Temperature",
    latitude: 51.510,
    longitude: -0.105,
    layerType: "temperature" as LayerType,
    category: "residential",
    temperature: 20.3,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
    userId: "demo-user"
  },
  {
    id: "sample-5",
    name: "Factory Emissions",
    latitude: 51.520,
    longitude: -0.075,
    layerType: "industrial" as LayerType,
    category: "industrial",
    co2Level: 580.2,
    temperature: 26.7,
    industryType: "chemical",
    emissionRate: 2100,
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-11'),
    userId: "demo-user"
  },
  {
    id: "sample-6",
    name: "City Center Air Quality",
    latitude: 51.500,
    longitude: -0.085,
    layerType: "air_quality" as LayerType,
    category: "urban",
    pm25: 22.8,
    pm10: 35.4,
    temperature: 23.2,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    userId: "demo-user"
  }
];

export default function DashboardClient({ userEmail, initialLocations }: DashboardClientProps) {
  const [locations, setLocations] = useState<LocationWithData[]>([...initialLocations, ...sampleLocations]);
  const [filteredLocations, setFilteredLocations] = useState<LocationWithData[]>([]);
  const [layers, setLayers] = useState<LayerConfig[]>(defaultLayers);
  const [selectedTab, setSelectedTab] = useState("map");
  const [drawingMode, setDrawingMode] = useState(false);
  const [analysisMode, setAnalysisMode] = useState(false);
  const [drawnShapes, setDrawnShapes] = useState<GeoJSON.Feature[]>([]);
  const [savedShapes, setSavedShapes] = useState<any[]>([]);
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [pendingShape, setPendingShape] = useState<{ geoJson: GeoJSON.Feature; layer: L.Layer; type: string } | null>(null);
  
  const { isOpen: isAddLocationOpen, onOpen: onAddLocationOpen, onClose: onAddLocationClose } = useDisclosure();

  // Load saved shapes from database
  const loadSavedShapes = async () => {
    try {
      const response = await fetch('/api/shapes');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.shapes) {
          setSavedShapes(data.shapes);
        }
      } else {
        // If shapes API is not working, just log and continue
        console.log('Shapes API not available, continuing without saved shapes');
      }
    } catch (error) {
      // Silently handle shapes loading errors for now
      console.log('Shapes feature not available:', error);
    }
  };

  // Load shapes on component mount
  useEffect(() => {
    loadSavedShapes();
  }, []);

  // Initialize filtered locations only once on mount
  useEffect(() => {
    if (filteredLocations.length === 0) {
      setFilteredLocations(locations);
    }
  }, [locations, filteredLocations.length]);

  // Handle layer visibility toggle
  const handleLayerToggle = (layerId: LayerType, visible: boolean) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible } : layer
    ));
  };

  // Get visible locations based on layer settings and filters
  const visibleLocations = filteredLocations.filter(location => {
    const layer = layers.find(l => l.id === location.layerType);
    return layer?.visible === true; // Only show if explicitly visible
  });

  // Handle filter changes from search component
  const handleFilterChange = (newFilteredLocations: LocationWithData[]) => {
    setFilteredLocations(newFilteredLocations);
  };

  // Handle shape creation
  const handleShapeCreated = (geoJson: GeoJSON.Feature, layer: L.Layer) => {
    if (analysisMode) {
      // In analysis mode, just add the shape without saving to database
      setDrawnShapes(prev => [...prev, geoJson]);
    } else {
      // In normal drawing mode, show properties modal
      const shapeType = geoJson.geometry.type;
      setPendingShape({ geoJson, layer, type: shapeType });
      setShowPropertiesModal(true);
    }
  };

  // Handle shape properties saved
  const handleShapePropertiesSaved = async (
    properties: any,
    geoJson: GeoJSON.Feature,
    layer: L.Layer
  ) => {
    if (pendingShape) {
      try {
        const response = await fetch('/api/shapes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: properties.name,
            description: properties.description || '',
            category: properties.category || 'environmental',
            shapeType: pendingShape.type.toLowerCase(),
            properties: {
              color: properties.color,
              fillColor: properties.fillColor,
              fillOpacity: properties.fillOpacity,
            },
            geometry: geoJson.geometry,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setDrawnShapes(prev => [...prev, {
              ...geoJson,
              properties: {
                ...geoJson.properties,
                ...properties,
                id: data.shape.id
              }
            }]);
            // Reload saved shapes to show the new one
            loadSavedShapes();
            setShowPropertiesModal(false);
          } else {
            throw new Error(data.error || 'Failed to save shape');
          }
        } else {
          throw new Error('Failed to save shape to database');
        }
      } catch (error) {
        console.error('Error saving shape:', error);
        alert('Failed to save shape to database. Please try again.');
        
        // Remove the layer since save failed
        const map = (layer as any)._map;
        if (map) {
          map.removeLayer(layer);
        }
      }
      
      setPendingShape(null);
    }
  };

  // Cancel shape creation
  const handleShapePropertiesCancelled = () => {
    if (pendingShape) {
      const map = (pendingShape.layer as any)._map;
      if (map) {
        map.removeLayer(pendingShape.layer);
      }
      setPendingShape(null);
    }
    setShowPropertiesModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">GIS Dashboard</h1>
            <p className="text-foreground-600">Environmental Monitoring System</p>
          </div>
          <div className="flex items-center gap-4">
            <Chip color="primary" variant="flat">
              {visibleLocations.length} Locations
            </Chip>
            <UserCardComponent email={userEmail} />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Sidebar */}
          <div className="col-span-3 space-y-4">
            <Card className="h-full">
              <CardHeader>
                <Tabs 
                  selectedKey={selectedTab} 
                  onSelectionChange={(key) => setSelectedTab(key as string)}
                  className="w-full"
                >
                  <Tab key="controls" title="Controls" />
                  <Tab key="layers" title="Layers" />
                  <Tab key="data" title="Data" />
                </Tabs>
              </CardHeader>
              <CardBody className="overflow-y-auto">
                {selectedTab === "controls" && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Drawing Mode</span>
                        <Switch
                          isSelected={drawingMode}
                          onValueChange={setDrawingMode}
                          color="primary"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Analysis Mode</span>
                        <Switch
                          isSelected={analysisMode}
                          onValueChange={(value) => {
                            setAnalysisMode(value);
                            // If enabling analysis mode, also enable drawing mode
                            if (value && !drawingMode) {
                              setDrawingMode(true);
                            }
                          }}
                          color="secondary"
                        />
                      </div>
                    </div>

                    <Divider />

                    <div className="space-y-3">
                      <Button
                        onClick={onAddLocationOpen}
                        color="primary"
                        className="w-full"
                      >
                        Add Location
                      </Button>
                      
                      {drawingMode && (
                        <div className={`p-3 rounded-lg ${analysisMode ? 'bg-secondary-50' : 'bg-primary-50'}`}>
                          <p className={`text-sm mb-2 ${analysisMode ? 'text-secondary-700' : 'text-primary-700'}`}>
                            {analysisMode ? "🔬 Analysis Mode" : "✏️ Drawing Mode"} Active
                          </p>
                          <p className={`text-xs ${analysisMode ? 'text-secondary-600' : 'text-primary-600'}`}>
                            {analysisMode 
                              ? "Draw shapes for spatial analysis (buffers, measurements, intersections)"
                              : "Draw shapes and save them to the database permanently"
                            }
                          </p>
                          {analysisMode && (
                            <p className="text-xs text-secondary-500 mt-1">
                              💡 Tip: Use the Tools panel → Analysis tab for advanced operations
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedTab === "layers" && (
                  <div className="space-y-3">
                    {layers.map((layer) => (
                      <div key={layer.id} className="flex items-center justify-between p-3 bg-content1 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: layer.color }}
                          />
                                                     <span className="text-sm font-medium">{layer.name}</span>
                        </div>
                        <Switch
                          isSelected={layer.visible}
                          onValueChange={(visible) => handleLayerToggle(layer.id, visible)}
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {selectedTab === "data" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Card className="p-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{locations.length}</div>
                          <div className="text-xs text-foreground-600">Total Locations</div>
                        </div>
                      </Card>
                      <Card className="p-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-secondary">{savedShapes.length}</div>
                          <div className="text-xs text-foreground-600">Saved Shapes</div>
                        </div>
                      </Card>
                    </div>
                    
                    <Divider />
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Layer Statistics</h4>
                      {layers.map(layer => {
                        const count = locations.filter(loc => loc.layerType === layer.id).length;
                        return (
                          <div key={layer.id} className="flex justify-between text-sm">
                                                         <span>{layer.name}</span>
                            <Chip size="sm" variant="flat" color={layer.visible ? "primary" : "default"}>
                              {count}
                            </Chip>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Map Area */}
          <div className="col-span-9">
            <Card className="h-full">
              <CardBody className="p-0">
                <Map 
                  locations={locations}
                  filteredLocations={visibleLocations}
                  onFilterChange={handleFilterChange}
                  className="w-full h-full rounded-lg"
                  enableDrawing={drawingMode}
                  enableAnalysis={analysisMode}
                  onShapeCreated={handleShapeCreated}
                  savedShapes={savedShapes}
                  initialGeoJson={{
                    type: 'FeatureCollection',
                    features: drawnShapes
                  }}
                />
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Modals */}
        <Modal 
          isOpen={isAddLocationOpen} 
          onClose={onAddLocationClose}
          size="2xl"
          classNames={{
            wrapper: "z-[9999]",
            backdrop: "z-[9998]",
            base: "z-[9999]"
          }}
          backdrop="opaque"
          placement="center"
          scrollBehavior="inside"
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">Add New Monitoring Location</h2>
              <p className="text-sm text-gray-600">Add a new environmental monitoring point to the map</p>
            </ModalHeader>
            <ModalBody className="py-6">
              <AddLocationForm 
                onLocationAdded={() => {
                  // Refresh the page or reload locations from the API
                  window.location.reload();
                }}
                onCancel={onAddLocationClose}
              />
            </ModalBody>
          </ModalContent>
        </Modal>

        {pendingShape && (
          <ShapePropertiesModal
            isOpen={showPropertiesModal}
            onClose={handleShapePropertiesCancelled}
            onSave={(properties) => handleShapePropertiesSaved(properties, pendingShape.geoJson, pendingShape.layer)}
            shapeType={pendingShape.type}
          />
        )}
      </div>
    </div>
  );
}