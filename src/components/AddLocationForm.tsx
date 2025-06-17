"use client";

import { useState, useEffect } from "react";
import { LayerType } from "@/db/schema/locations";
import { useSubscriptionFeatures } from "@/hooks/useSubscriptionFeatures";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Textarea,
  Button,
  Chip,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@heroui/react";

interface AddLocationFormProps {
  selectedCoords?: { lat: number; lng: number };
  onSuccess?: () => void;
  onCancel?: () => void;
  onLocationAdded?: () => void;
}

export default function AddLocationForm({ 
  selectedCoords, 
  onSuccess, 
  onCancel,
  onLocationAdded
}: AddLocationFormProps) {
  const { plan, canCreateLocation, maxLocations, isLoading: subscriptionLoading } = useSubscriptionFeatures();
  const { isOpen: isUpgradeModalOpen, onOpen: onUpgradeModalOpen, onClose: onUpgradeModalClose } = useDisclosure();
  
  const [currentLocationCount, setCurrentLocationCount] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    latitude: selectedCoords?.lat?.toString() || "",
    longitude: selectedCoords?.lng?.toString() || "",
    layerType: "co2" as LayerType,
    category: "monitoring_station",
    // CO2 fields
    co2Level: "",
    // Air Quality fields
    pm25Level: "",
    pm10Level: "",
    // Temperature fields
    temperature: "",
    // Common fields
    description: "",
    source: "Manual Entry"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current location count
  useEffect(() => {
    const fetchLocationCount = async () => {
      try {
        const response = await fetch('/api/locations');
        if (response.ok) {
          const data = await response.json();
          setCurrentLocationCount(data.locations?.length || 0);
        }
      } catch (err) {
        console.error('Failed to fetch location count:', err);
      }
    };

    fetchLocationCount();
  }, []);

  const canUserCreateLocation = canCreateLocation(currentLocationCount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check subscription limits
    if (!canUserCreateLocation) {
      onUpgradeModalOpen();
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          layerType: formData.layerType,
          category: formData.category,
          co2Level: formData.co2Level ? parseFloat(formData.co2Level) : undefined,
          pm25Level: formData.pm25Level ? parseFloat(formData.pm25Level) : undefined,
          pm10Level: formData.pm10Level ? parseFloat(formData.pm10Level) : undefined,
          temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
          description: formData.description,
          source: formData.source
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Reset form
        setFormData({
          name: "",
          latitude: "",
          longitude: "",
          layerType: "co2",
          category: "monitoring_station",
          co2Level: "",
          pm25Level: "",
          pm10Level: "",
          temperature: "",
          description: "",
          source: "Manual Entry"
        });
        
        if (onSuccess) {
          onSuccess();
        }
        if (onLocationAdded) {
          onLocationAdded();
        }
      } else {
        setError(result.error || "Failed to create location");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getLayerIcon = (layerType: LayerType) => {
    const icons = {
      co2: '🏭',
      air_quality: '💨',
      temperature: '🌡️',
      industrial: '🏭',
      traffic: '🚗'
    };
    return icons[layerType];
  };

  const getCategoryOptions = (layerType: LayerType) => {
    switch (layerType) {
      case 'co2':
        return [
          { value: 'monitoring_station', label: 'Monitoring Station' },
          { value: 'industrial', label: 'Industrial Source' },
          { value: 'vehicle', label: 'Vehicle Emissions' },
          { value: 'natural', label: 'Natural Source' }
        ];
      case 'air_quality':
        return [
          { value: 'pm25', label: 'PM2.5 Monitor' },
          { value: 'pm10', label: 'PM10 Monitor' },
          { value: 'ozone', label: 'Ozone Monitor' },
          { value: 'no2', label: 'NO2 Monitor' }
        ];
      case 'temperature':
        return [
          { value: 'weather_station', label: 'Weather Station' },
          { value: 'urban_heat', label: 'Urban Heat Monitor' },
          { value: 'climate_monitoring', label: 'Climate Monitor' }
        ];
      case 'industrial':
        return [
          { value: 'factory', label: 'Factory' },
          { value: 'power_plant', label: 'Power Plant' },
          { value: 'refinery', label: 'Refinery' },
          { value: 'chemical_plant', label: 'Chemical Plant' }
        ];
      case 'traffic':
        return [
          { value: 'highway', label: 'Highway Monitor' },
          { value: 'intersection', label: 'Intersection' },
          { value: 'parking', label: 'Parking Area' },
          { value: 'public_transport', label: 'Public Transport' }
        ];
      default:
        return [{ value: 'monitoring_station', label: 'Monitoring Station' }];
    }
  };

  const layerOptions = [
    { value: 'co2', label: '🏭 CO2 Emissions' },
    { value: 'air_quality', label: '💨 Air Quality' },
    { value: 'temperature', label: '🌡️ Temperature' },
    { value: 'industrial', label: '🏭 Industrial Sources' },
    { value: 'traffic', label: '🚗 Traffic Monitoring' }
  ];

  const sourceOptions = [
    { value: 'Manual Entry', label: 'Manual Entry' },
    { value: 'Sensor Reading', label: 'Sensor Reading' },
    { value: 'Government Data', label: 'Government Data' },
    { value: 'Research Study', label: 'Research Study' },
    { value: 'Third Party', label: 'Third Party' }
  ];

  const renderLayerSpecificFields = () => {
    switch (formData.layerType) {
      case 'co2':
        return (
          <Input
            type="number"
            label="CO2 Level (ppm)"
            placeholder="420.5"
            value={formData.co2Level}
            onValueChange={(value) => handleInputChange(value, 'co2Level')}
            isRequired
            min="0"
            max="10000"
            step="0.1"
            description="Normal atmospheric CO2: ~400-420 ppm"
            startContent="🌍"
          />
        );

      case 'air_quality':
        return (
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="PM2.5 Level (μg/m³)"
              placeholder="25.5"
              value={formData.pm25Level}
              onValueChange={(value) => handleInputChange(value, 'pm25Level')}
              min="0"
              max="500"
              step="0.1"
              startContent="💨"
            />
            <Input
              type="number"
              label="PM10 Level (μg/m³)"
              placeholder="45.0"
              value={formData.pm10Level}
              onValueChange={(value) => handleInputChange(value, 'pm10Level')}
              min="0"
              max="500"
              step="0.1"
              startContent="💨"
            />
          </div>
        );

      case 'temperature':
        return (
          <Input
            type="number"
            label="Temperature (°C)"
            placeholder="22.5"
            value={formData.temperature}
            onValueChange={(value) => handleInputChange(value, 'temperature')}
            isRequired
            min="-50"
            max="60"
            step="0.1"
            startContent="🌡️"
          />
        );

      case 'industrial':
      case 'traffic':
        return (
          <Card className="bg-default-50 dark:bg-default-100">
            <CardBody className="p-4">
              <div className="flex items-center gap-2 text-default-600">
                <span>📍</span>
                <span className="text-sm">
                  Location and description are sufficient for {formData.layerType} monitoring points.
                </span>
              </div>
            </CardBody>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-background/95 backdrop-blur-md">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getLayerIcon(formData.layerType)}</span>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">
              Add Environmental Location
            </h2>
            <p className="text-small text-default-500">
              Create a new monitoring point
            </p>
          </div>
        </div>
        
        <div className="mt-4">
          <Card className={`${canUserCreateLocation ? 'bg-success-50 border-success-200' : 'bg-warning-50 border-warning-200'}`}>
            <CardBody className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{canUserCreateLocation ? '✅' : '⚠️'}</span>
                  <span className="text-sm font-medium">
                    Plan: {plan.name}
                  </span>
                </div>
                <Chip 
                  size="sm" 
                  variant="flat" 
                  color={canUserCreateLocation ? 'success' : 'warning'}
                >
                  {currentLocationCount}/{maxLocations} locations
                </Chip>
              </div>
              {!canUserCreateLocation && (
                <p className="text-xs text-warning-600 mt-2">
                  You've reached your location limit. Upgrade to add more locations.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </CardHeader>

      <CardBody className="space-y-6">
        {error && (
          <Card className="bg-danger-50 border border-danger-200">
            <CardBody className="p-3">
              <div className="flex items-center gap-2 text-danger-600">
                <span>⚠️</span>
                <span className="text-sm">{error}</span>
              </div>
            </CardBody>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Select
            label="Data Layer Type"
            placeholder="Select layer type"
            selectedKeys={[formData.layerType]}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] as LayerType;
              handleInputChange(value, 'layerType');
              // Reset category when layer type changes
              const firstCategory = getCategoryOptions(value)[0]?.value || 'monitoring_station';
              handleInputChange(firstCategory, 'category');
            }}
            isRequired
          >
            {layerOptions.map((option) => (
              <SelectItem key={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>

          <Select
            label="Category"
            placeholder="Select category"
            selectedKeys={[formData.category]}
            onSelectionChange={(keys) => handleInputChange(Array.from(keys)[0] as string, 'category')}
            isRequired
          >
            {getCategoryOptions(formData.layerType).map((option) => (
              <SelectItem key={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>

          <Input
            label="Location Name"
            placeholder="e.g., City Center Station"
            value={formData.name}
            onValueChange={(value) => handleInputChange(value, 'name')}
            isRequired
            startContent="📍"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Latitude"
              placeholder="51.505"
              value={formData.latitude}
              onValueChange={(value) => handleInputChange(value, 'latitude')}
              isRequired
              step="any"
              min="-90"
              max="90"
              startContent="🌐"
            />
            <Input
              type="number"
              label="Longitude"
              placeholder="-0.09"
              value={formData.longitude}
              onValueChange={(value) => handleInputChange(value, 'longitude')}
              isRequired
              step="any"
              min="-180"
              max="180"
              startContent="🌐"
            />
          </div>

          {renderLayerSpecificFields()}

          <Select
            label="Data Source"
            placeholder="Select data source"
            selectedKeys={[formData.source]}
            onSelectionChange={(keys) => handleInputChange(Array.from(keys)[0] as string, 'source')}
          >
            {sourceOptions.map((option) => (
              <SelectItem key={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>

          <Textarea
            label="Description"
            placeholder="Optional description or notes about this location..."
            value={formData.description}
            onValueChange={(value) => handleInputChange(value, 'description')}
            minRows={3}
          />

          <Divider />

          <div className="flex gap-3">
            <Button
              type="submit"
              color={canUserCreateLocation ? "primary" : "warning"}
              isLoading={loading}
              isDisabled={!canUserCreateLocation || subscriptionLoading}
              className="flex-1"
              startContent={!loading ? (canUserCreateLocation ? "💾" : "⚠️") : undefined}
            >
              {loading ? "Adding Location..." : 
               canUserCreateLocation ? "Add Location" : "Upgrade Required"}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="flat"
                onPress={onCancel}
                className="flex-1"
                startContent="❌"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>

        {selectedCoords && (
          <Card className="bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800">
            <CardBody className="p-3">
              <Chip
                size="sm"
                variant="flat"
                color="primary"
                startContent="📍"
                className="w-full"
              >
                Coordinates: {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
              </Chip>
            </CardBody>
          </Card>
        )}
      </CardBody>

      <Modal isOpen={isUpgradeModalOpen} onClose={onUpgradeModalClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>🚀 Upgrade Required</span>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p>You've reached your location limit for the <strong>{plan.name}</strong> plan.</p>
              
              <div className="bg-default-100 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Current Plan Limits:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Locations: {maxLocations}</li>
                  <li>• Storage: {plan.features.storageGB}GB</li>
                  <li>• Advanced Tools: {plan.features.advancedDrawingTools ? 'Yes' : 'No'}</li>
                </ul>
              </div>

              <p className="text-sm">
                Upgrade to Pro for unlimited locations and advanced features!
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onUpgradeModalClose}>
              Cancel
            </Button>
            <Button 
              color="primary" 
              onPress={() => {
                onUpgradeModalClose();
                window.open('/pricing', '_blank');
              }}
            >
              View Plans
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
} 