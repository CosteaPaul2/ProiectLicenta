"use client";

import { useState } from 'react';
import { Button, Input, Textarea, Select, SelectItem } from "@heroui/react";

interface ShapeProperties {
  name: string;
  description: string;
  category: string;
  color: string;
  fillColor: string;
  fillOpacity: number;
  [key: string]: any;
}

interface ShapePropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (properties: ShapeProperties) => void;
  shapeType: string;
  initialProperties?: Partial<ShapeProperties>;
}

const SHAPE_CATEGORIES = [
  { key: 'environmental', label: 'Environmental Zone' },
  { key: 'monitoring', label: 'Monitoring Area' },
  { key: 'industrial', label: 'Industrial Area' },
  { key: 'residential', label: 'Residential Area' },
  { key: 'commercial', label: 'Commercial Area' },
  { key: 'research', label: 'Research Zone' },
  { key: 'restricted', label: 'Restricted Area' },
  { key: 'other', label: 'Other' }
];

const COLOR_OPTIONS = [
  { key: '#3388ff', label: 'Blue', color: '#3388ff' },
  { key: '#28a745', label: 'Green', color: '#28a745' },
  { key: '#dc3545', label: 'Red', color: '#dc3545' },
  { key: '#ffc107', label: 'Yellow', color: '#ffc107' },
  { key: '#6f42c1', label: 'Purple', color: '#6f42c1' },
  { key: '#fd7e14', label: 'Orange', color: '#fd7e14' },
  { key: '#20c997', label: 'Teal', color: '#20c997' },
  { key: '#e83e8c', label: 'Pink', color: '#e83e8c' }
];

export default function ShapePropertiesModal({
  isOpen,
  onClose,
  onSave,
  shapeType,
  initialProperties = {}
}: ShapePropertiesModalProps) {
  const [properties, setProperties] = useState<ShapeProperties>({
    name: initialProperties.name || '',
    description: initialProperties.description || '',
    category: initialProperties.category || 'environmental',
    color: initialProperties.color || '#3388ff',
    fillColor: initialProperties.fillColor || '#3388ff',
    fillOpacity: initialProperties.fillOpacity || 0.2,
    ...initialProperties
  });

  const handleSave = () => {
    onSave(properties);
    onClose();
  };

  const updateProperty = (key: string, value: any) => {
    setProperties(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-background rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-auto shadow-2xl border border-divider">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            {shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} Properties
          </h3>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={onClose}
          >
            ✕
          </Button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <Input
            label="Name"
            placeholder="Enter shape name"
            value={properties.name}
            onChange={(e) => updateProperty('name', e.target.value)}
          />

          {/* Description */}
          <Textarea
            label="Description"
            placeholder="Enter description (optional)"
            value={properties.description}
            onChange={(e) => updateProperty('description', e.target.value)}
            rows={3}
          />

          {/* Category */}
          <Select
            label="Category"
            placeholder="Select category"
            selectedKeys={[properties.category]}
            onSelectionChange={(keys) => updateProperty('category', Array.from(keys)[0])}
          >
            {SHAPE_CATEGORIES.map((category) => (
              <SelectItem key={category.key}>
                {category.label}
              </SelectItem>
            ))}
          </Select>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Border Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_OPTIONS.map((colorOption) => (
                <button
                  key={colorOption.key}
                  className={`w-full h-10 rounded border-2 ${
                    properties.color === colorOption.key 
                      ? 'border-foreground ring-2 ring-primary-500' 
                      : 'border-divider'
                  }`}
                  style={{ backgroundColor: colorOption.color }}
                  onClick={() => updateProperty('color', colorOption.key)}
                  title={colorOption.label}
                />
              ))}
            </div>
          </div>

          {/* Fill Color (for polygons and circles) */}
          {(shapeType === 'polygon' || shapeType === 'rectangle' || shapeType === 'circle') && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Fill Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_OPTIONS.map((colorOption) => (
                  <button
                    key={colorOption.key}
                    className={`w-full h-10 rounded border-2 ${
                      properties.fillColor === colorOption.key 
                        ? 'border-foreground ring-2 ring-primary-500' 
                        : 'border-divider'
                    }`}
                    style={{ backgroundColor: colorOption.color, opacity: properties.fillOpacity }}
                    onClick={() => updateProperty('fillColor', colorOption.key)}
                    title={colorOption.label}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Fill Opacity */}
          {(shapeType === 'polygon' || shapeType === 'rectangle' || shapeType === 'circle') && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Fill Opacity: {Math.round(properties.fillOpacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={properties.fillOpacity}
                onChange={(e) => updateProperty('fillOpacity', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            color="primary"
            onPress={handleSave}
            isDisabled={!properties.name.trim()}
          >
            Save Properties
          </Button>
          <Button
            variant="light"
            onPress={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
} 