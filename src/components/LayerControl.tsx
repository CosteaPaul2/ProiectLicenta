"use client";

import { useState } from "react";
import { LayerType } from "@/db/schema/locations";
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Switch, 
  Slider, 
  Chip, 
  Button,
  Divider 
} from "@heroui/react";

export interface LayerConfig {
  id: LayerType;
  name: string;
  icon: string;
  description: string;
  color: string;
  visible: boolean;
}

interface LayerControlProps {
  layers: LayerConfig[];
  onLayerToggle: (layerId: LayerType, visible: boolean) => void;
  onOpacityChange?: (layerId: LayerType, opacity: number) => void;
}

export default function LayerControl({ 
  layers, 
  onLayerToggle, 
  onOpacityChange 
}: LayerControlProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <Card className="absolute top-4 right-4 z-[1000] w-80 bg-gray-900/95 backdrop-blur-md border border-gray-700 shadow-2xl">
      {/* Header */}
      <CardHeader className="flex items-center justify-between pb-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xl">🗂️</span>
          <h3 className="font-semibold text-white">Data Layers</h3>
        </div>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-300 hover:text-white"
        >
          {isCollapsed ? "▼" : "▲"}
        </Button>
      </CardHeader>

      {/* Layer Controls */}
      {!isCollapsed && (
        <CardBody className="pt-0 space-y-4 max-h-96 overflow-y-auto">
          {layers.map((layer, index) => (
            <div key={layer.id}>
              <div className="space-y-3">
                {/* Layer Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{layer.icon}</span>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-white">
                        {layer.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {layer.description}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Color indicator */}
                    <div
                      className="w-3 h-3 rounded-full border border-gray-500"
                      style={{ backgroundColor: layer.color }}
                    />
                    <Switch
                      size="sm"
                      isSelected={layer.visible}
                      onValueChange={(checked) => onLayerToggle(layer.id, checked)}
                      color="primary"
                      classNames={{
                        wrapper: "group-data-[selected=true]:bg-primary-500"
                      }}
                    />
                  </div>
                </div>

                {/* Opacity Control (if layer is visible) */}
                {layer.visible && onOpacityChange && (
                  <div className="ml-8">
                    <Slider
                      size="sm"
                      step={0.1}
                      minValue={0.1}
                      maxValue={1}
                      defaultValue={1}
                      className="max-w-md"
                      color="primary"
                      label="Opacity"
                      onChange={(value) => onOpacityChange(layer.id, Array.isArray(value) ? value[0] : value)}
                      classNames={{
                        label: "text-xs text-gray-300",
                        value: "text-xs text-gray-300",
                        track: "bg-gray-700",
                        filler: "bg-primary-500"
                      }}
                    />
                  </div>
                )}
              </div>
              
              {/* Divider between layers */}
              {index < layers.length - 1 && (
                <Divider className="mt-3 bg-gray-700" />
              )}
            </div>
          ))}

          {/* Legend */}
          <div className="pt-2">
            <Divider className="mb-3 bg-gray-700" />
            <h4 className="text-xs font-semibold text-gray-300 mb-3 uppercase tracking-wide">
              Active Layers
            </h4>
            <div className="flex flex-wrap gap-1">
              {layers.filter(l => l.visible).map((layer) => (
                <Chip
                  key={`legend-${layer.id}`}
                  size="sm"
                  variant="flat"
                  startContent={
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: layer.color }}
                    />
                  }
                  classNames={{
                    base: "bg-gray-800 border border-gray-600",
                    content: "text-xs text-gray-200"
                  }}
                >
                  {layer.name}
                </Chip>
              ))}
              {layers.filter(l => l.visible).length === 0 && (
                <span className="text-xs text-gray-400 italic">
                  No active layers
                </span>
              )}
            </div>
          </div>
        </CardBody>
      )}
    </Card>
  );
}

// Default layer configurations with updated colors for dark theme
export const defaultLayers: LayerConfig[] = [
  {
    id: 'co2',
    name: 'CO2 Emissions',
    icon: '🏭',
    description: 'Carbon dioxide monitoring locations',
    color: '#f87171',
    visible: true,
  },
  {
    id: 'air_quality',
    name: 'Air Quality',
    icon: '💨',
    description: 'PM2.5, PM10, and other air pollutants',
    color: '#a78bfa',
    visible: true,
  },
  {
    id: 'temperature',
    name: 'Temperature',
    icon: '🌡️',
    description: 'Temperature monitoring stations',
    color: '#fbbf24',
    visible: true,
  },
  {
    id: 'industrial',
    name: 'Industrial Sources',
    icon: '🏭',
    description: 'Factories, power plants, and industrial facilities',
    color: '#9ca3af',
    visible: true,
  },
  {
    id: 'traffic',
    name: 'Traffic Monitoring',
    icon: '🚗',
    description: 'Vehicle emissions and traffic data',
    color: '#34d399',
    visible: true,
  },
]; 