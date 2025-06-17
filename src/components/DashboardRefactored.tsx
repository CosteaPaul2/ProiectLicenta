"use client";

import dynamic from 'next/dynamic';
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
  useDisclosure
} from "@heroui/react";

// Context hooks
import { useLocations } from '@/contexts/LocationContext';
import { useMap } from '@/contexts/MapContext';
import { useFilters } from '@/contexts/FilterContext';
import { useShapes } from '@/contexts/ShapeContext';
import { useAuth } from '@/contexts/AuthContext';

// Components
import AddLocationForm from "./AddLocationForm";
import UserCardComponent from "./UserCardComponent";
import ShapePropertiesModal from "./ShapePropertiesModal";

// Dynamically import the Map component to avoid SSR issues
const Map = dynamic(() => import('./Map'), { ssr: false });

export default function DashboardRefactored() {
  const { isOpen: isAddLocationOpen, onOpen: onAddLocationOpen, onClose: onAddLocationClose } = useDisclosure();

  // Use context hooks instead of props
  const { locations, loading: locationsLoading, getTotalLocations, clearError: clearLocationError } = useLocations();
  const { 
    mapState, 
    layers, 
    activePanel, 
    toggleDrawingMode, 
    toggleAnalysisMode, 
    setActivePanel,
    getVisibleLayers,
    toggleLayerVisibility 
  } = useMap();
  const { 
    filteredLocations, 
    hasActiveFilters, 
    getActiveFilterCount,
    getFilterSummary 
  } = useFilters();
  const { 
    savedShapes, 
    drawnShapes, 
    pendingShape, 
    showPropertiesModal,
    getTotalShapes,
    handleShapeCreated,
    setShowPropertiesModal,
    setPendingShape
  } = useShapes();
  const { getUserEmail } = useAuth();

  // Get visible locations based on layer settings and filters
  const visibleLocations = filteredLocations.filter(location => {
    const layer = layers.find(l => l.id === location.layerType);
    return layer?.visible === true;
  });

  // Handle shape properties saved
  const handleShapePropertiesSaved = async (properties: any) => {
    // This would now use the shape context methods
    setShowPropertiesModal(false);
    setPendingShape(null);
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
            <UserCardComponent email={getUserEmail()} />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Sidebar */}
          <div className="col-span-3 space-y-4">
            <Card className="h-full">
              <CardHeader>
                <Tabs 
                  selectedKey={activePanel} 
                  onSelectionChange={(key) => setActivePanel(key as any)}
                  className="w-full"
                >
                  <Tab key="controls" title="Controls" />
                  <Tab key="layers" title="Layers" />
                  <Tab key="data" title="Data" />
                </Tabs>
              </CardHeader>
              <CardBody className="overflow-y-auto">
                {/* Controls Panel */}
                {activePanel === "controls" && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Drawing Mode</span>
                        <Switch
                          isSelected={mapState.drawingMode}
                          onValueChange={toggleDrawingMode}
                          color="primary"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Analysis Mode</span>
                        <Switch
                          isSelected={mapState.analysisMode}
                          onValueChange={toggleAnalysisMode}
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
                      
                      {mapState.drawingMode && (
                        <div className={`p-3 rounded-lg ${mapState.analysisMode ? 'bg-secondary-50' : 'bg-primary-50'}`}>
                          <p className={`text-sm mb-2 ${mapState.analysisMode ? 'text-secondary-700' : 'text-primary-700'}`}>
                            {mapState.analysisMode ? "🔬 Analysis Mode" : "✏️ Drawing Mode"} Active
                          </p>
                          <p className={`text-xs ${mapState.analysisMode ? 'text-secondary-600' : 'text-primary-600'}`}>
                            {mapState.analysisMode 
                              ? "Draw shapes for spatial analysis (buffers, measurements, intersections)"
                              : "Draw shapes and save them to the database permanently"
                            }
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Filter Summary */}
                    {hasActiveFilters() && (
                      <div className="p-3 bg-info-50 rounded-lg">
                        <p className="text-sm font-medium text-info-700">
                          Active Filters ({getActiveFilterCount()})
                        </p>
                        <p className="text-xs text-info-600 mt-1">
                          {getFilterSummary()}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Layers Panel */}
                {activePanel === "layers" && (
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
                          onValueChange={(visible) => toggleLayerVisibility(layer.id, visible)}
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Data Panel */}
                {activePanel === "data" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Card className="p-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{getTotalLocations()}</div>
                          <div className="text-xs text-foreground-600">Total Locations</div>
                        </div>
                      </Card>
                      <Card className="p-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-secondary">{getTotalShapes()}</div>
                          <div className="text-xs text-foreground-600">Total Shapes</div>
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
                  className="w-full h-full rounded-lg"
                  enableDrawing={mapState.drawingMode}
                  enableAnalysis={mapState.analysisMode}
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
                  onAddLocationClose();
                  // The context will automatically update
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
            onSave={handleShapePropertiesSaved}
            shapeType={pendingShape.type}
          />
        )}
      </div>
    </div>
  );
} 