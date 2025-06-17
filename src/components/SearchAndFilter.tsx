"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import * as turf from '@turf/turf';
import { Button, Input, Select, SelectItem, Chip, Divider } from "@heroui/react";
import { LocationWithData } from '@/types/location';

interface SearchAndFilterProps {
  locations: LocationWithData[];
  onFilterChange: (filteredLocations: LocationWithData[]) => void;
}

interface FilterPreset {
  id: string;
  name: string;
  filters: FilterCriteria;
}

interface FilterCriteria {
  searchText: string;
  layerTypes: string[];
  dateRange: {
    start: string;
    end: string;
  };
  spatialQuery: {
    type: 'within' | 'intersects' | 'contains' | null;
    shape: GeoJSON.Feature | null;
  };
  attributes: {
    [key: string]: {
      min?: number;
      max?: number;
    };
  };
}

export default function SearchAndFilter({ locations, onFilterChange }: SearchAndFilterProps) {
  const [searchText, setSearchText] = useState('');
  const [selectedLayerTypes, setSelectedLayerTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [spatialQueryType, setSpatialQueryType] = useState<'within' | 'intersects' | 'contains' | null>(null);
  const [spatialQueryShape, setSpatialQueryShape] = useState<GeoJSON.Feature | null>(null);
  const [attributeFilters, setAttributeFilters] = useState<{ [key: string]: { min?: number; max?: number } }>({});
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Memoize layer types to prevent recalculation on every render
  const layerTypes = useMemo(() => 
    Array.from(new Set(locations.map(loc => loc.layerType))), 
    [locations]
  );

  // Memoize attributes to prevent recalculation on every render
  const attributes = useMemo(() => 
    Array.from(
      new Set(
        locations.flatMap(loc => 
          Object.keys(loc).filter(key => 
            typeof loc[key as keyof LocationWithData] === 'number' && 
            !['latitude', 'longitude'].includes(key)
          )
        )
      )
    ), 
    [locations]
  );

  // Memoized filter function to prevent unnecessary recalculations
  const applyFilters = useCallback(() => {
    let filteredLocations = [...locations];

    // Text search
    if (searchText.trim()) {
      filteredLocations = filteredLocations.filter(loc =>
        loc.name.toLowerCase().includes(searchText.toLowerCase()) ||
        loc.category?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Layer type filter
    if (selectedLayerTypes.length > 0) {
      filteredLocations = filteredLocations.filter(loc =>
        selectedLayerTypes.includes(loc.layerType)
      );
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      filteredLocations = filteredLocations.filter(loc => {
        const locDate = new Date(loc.createdAt);
        const start = dateRange.start ? new Date(dateRange.start) : null;
        const end = dateRange.end ? new Date(dateRange.end) : null;
        
        if (start && end) {
          return locDate >= start && locDate <= end;
        } else if (start) {
          return locDate >= start;
        } else if (end) {
          return locDate <= end;
        }
        return true;
      });
    }

    // Spatial query
    if (spatialQueryType && spatialQueryShape) {
      filteredLocations = filteredLocations.filter(loc => {
        try {
          const point = turf.point([loc.longitude, loc.latitude]);
          
          switch (spatialQueryType) {
            case 'within':
              return turf.booleanWithin(point, spatialQueryShape);
            case 'intersects':
              return turf.booleanIntersects(point, spatialQueryShape);
            case 'contains':
              return turf.booleanContains(spatialQueryShape, point);
            default:
              return true;
          }
        } catch (error) {
          console.error('Spatial query error:', error);
          return true;
        }
      });
    }

    // Attribute filters
    Object.entries(attributeFilters).forEach(([attr, { min, max }]) => {
      if (min !== undefined || max !== undefined) {
        filteredLocations = filteredLocations.filter(loc => {
          const value = loc[attr as keyof LocationWithData];
          if (typeof value !== 'number') return true;
          
          if (min !== undefined && max !== undefined) {
            return value >= min && value <= max;
          } else if (min !== undefined) {
            return value >= min;
          } else if (max !== undefined) {
            return value <= max;
          }
          return true;
        });
      }
    });

    return filteredLocations;
  }, [
    locations,
    searchText,
    selectedLayerTypes,
    dateRange,
    spatialQueryType,
    spatialQueryShape,
    attributeFilters
  ]);

  // Apply filters when dependencies change
  useEffect(() => {
    const filtered = applyFilters();
    onFilterChange(filtered);
  }, [
    searchText,
    selectedLayerTypes,
    dateRange,
    spatialQueryType,
    spatialQueryShape,
    attributeFilters,
    locations
  ]);

  // Save current filter as preset
  const savePreset = () => {
    const presetName = prompt('Enter a name for this filter preset:');
    if (!presetName) return;

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName,
      filters: {
        searchText,
        layerTypes: selectedLayerTypes,
        dateRange,
        spatialQuery: {
          type: spatialQueryType,
          shape: spatialQueryShape
        },
        attributes: attributeFilters
      }
    };

    setSavedPresets(prev => [...prev, newPreset]);
    localStorage.setItem('filterPresets', JSON.stringify([...savedPresets, newPreset]));
  };

  // Load saved presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('filterPresets');
    if (saved) {
      setSavedPresets(JSON.parse(saved));
    }
  }, []);

  // Apply a saved preset
  const applyPreset = (preset: FilterPreset) => {
    setSearchText(preset.filters.searchText);
    setSelectedLayerTypes(preset.filters.layerTypes);
    setDateRange(preset.filters.dateRange);
    setSpatialQueryType(preset.filters.spatialQuery.type);
    setSpatialQueryShape(preset.filters.spatialQuery.shape);
    setAttributeFilters(preset.filters.attributes);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchText('');
    setSelectedLayerTypes([]);
    setDateRange({ start: '', end: '' });
    setSpatialQueryType(null);
    setSpatialQueryShape(null);
    setAttributeFilters({});
  };

  return (
    <div className="space-y-4 max-h-80 overflow-y-auto text-white">
      {/* Basic Search */}
      <div className="space-y-3">
        <Input
          type="text"
          placeholder="Search locations..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          size="sm"
          className="w-full"
          classNames={{
            input: "bg-gray-800 text-white placeholder:text-gray-400",
            inputWrapper: "bg-gray-800 border-gray-600 hover:border-gray-500"
          }}
        />

        {/* Layer Type Filter */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-200">
            Layer Types
          </label>
          <div className="flex flex-wrap gap-1">
            {layerTypes.map(type => (
              <Chip
                key={type}
                size="sm"
                variant={selectedLayerTypes.includes(type) ? "solid" : "flat"}
                color={selectedLayerTypes.includes(type) ? "primary" : "default"}
                onClick={() => {
                  setSelectedLayerTypes(prev =>
                    prev.includes(type)
                      ? prev.filter(t => t !== type)
                      : [...prev, type]
                  );
                }}
                className={`cursor-pointer ${
                  selectedLayerTypes.includes(type) 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {type}
              </Chip>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            size="sm"
            placeholder="Start date"
            classNames={{
              input: "bg-gray-800 text-white",
              inputWrapper: "bg-gray-800 border-gray-600 hover:border-gray-500"
            }}
          />
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            size="sm"
            placeholder="End date"
            classNames={{
              input: "bg-gray-800 text-white",
              inputWrapper: "bg-gray-800 border-gray-600 hover:border-gray-500"
            }}
          />
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <Button
        size="sm"
        variant="light"
        onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
        className="w-full text-gray-300 hover:text-white hover:bg-gray-700"
      >
        {showAdvancedFilters ? 'Hide Advanced' : 'Show Advanced'}
      </Button>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="space-y-3">
          <Divider className="bg-gray-700" />
          
          {/* Spatial Query */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-200">
              Spatial Query
            </label>
            <Select
              size="sm"
              selectedKeys={spatialQueryType ? [spatialQueryType] : []}
              onSelectionChange={(keys) => setSpatialQueryType(Array.from(keys)[0] as any)}
              placeholder="Select spatial operation"
              classNames={{
                trigger: "bg-gray-800 border-gray-600 hover:border-gray-500",
                value: "text-white",
                popoverContent: "bg-gray-800 border-gray-600",
                listboxWrapper: "bg-gray-800"
              }}
            >
              <SelectItem key="within" className="text-white hover:bg-gray-700">Within Shape</SelectItem>
              <SelectItem key="intersects" className="text-white hover:bg-gray-700">Intersects Shape</SelectItem>
              <SelectItem key="contains" className="text-white hover:bg-gray-700">Contains Points</SelectItem>
            </Select>
          </div>

          {/* Attribute Filters */}
          {attributes.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">
                Attribute Filters
              </label>
              <div className="space-y-2">
                {attributes.slice(0, 3).map(attr => (
                  <div key={attr}>
                    <label className="text-xs text-gray-400 capitalize">{attr}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        size="sm"
                        value={attributeFilters[attr]?.min?.toString() || ''}
                        onChange={(e) => setAttributeFilters(prev => ({
                          ...prev,
                          [attr]: { ...prev[attr], min: Number(e.target.value) }
                        }))}
                        classNames={{
                          input: "bg-gray-800 text-white placeholder:text-gray-400",
                          inputWrapper: "bg-gray-800 border-gray-600 hover:border-gray-500"
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        size="sm"
                        value={attributeFilters[attr]?.max?.toString() || ''}
                        onChange={(e) => setAttributeFilters(prev => ({
                          ...prev,
                          [attr]: { ...prev[attr], max: Number(e.target.value) }
                        }))}
                        classNames={{
                          input: "bg-gray-800 text-white placeholder:text-gray-400",
                          inputWrapper: "bg-gray-800 border-gray-600 hover:border-gray-500"
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Divider className="bg-gray-700" />

      {/* Control Buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          color="success"
          variant="flat"
          onPress={savePreset}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          Save
        </Button>
        <Button
          size="sm"
          variant="flat"
          onPress={clearFilters}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
        >
          Clear
        </Button>
      </div>

      {/* Saved Presets */}
      {savedPresets.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-200">
            Saved Presets
          </label>
          <div className="space-y-1">
            {savedPresets.slice(0, 3).map(preset => (
              <div
                key={preset.id}
                className="flex justify-between items-center p-2 bg-gray-800 rounded text-sm border border-gray-600"
              >
                <span className="truncate text-gray-200">{preset.name}</span>
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => applyPreset(preset)}
                  className="text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                >
                  Apply
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 