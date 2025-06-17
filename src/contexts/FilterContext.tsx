"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useMemo } from 'react';
import * as turf from '@turf/turf';
import { LocationData, FilterCriteria, FilterPreset, LayerType } from '@/types';

// State interface
interface FilterState {
  criteria: FilterCriteria;
  filteredLocations: LocationData[];
  savedPresets: FilterPreset[];
  isFiltering: boolean;
}

// Action types
type FilterAction =
  | { type: 'UPDATE_SEARCH_TEXT'; payload: string }
  | { type: 'UPDATE_LAYER_TYPES'; payload: LayerType[] }
  | { type: 'UPDATE_DATE_RANGE'; payload: { start: string; end: string } }
  | { type: 'UPDATE_SPATIAL_QUERY'; payload: { type: 'within' | 'intersects' | 'contains' | null; shape: GeoJSON.Feature | null } }
  | { type: 'UPDATE_ATTRIBUTE_FILTER'; payload: { attribute: string; min?: number; max?: number } }
  | { type: 'CLEAR_ATTRIBUTE_FILTER'; payload: string }
  | { type: 'SET_FILTERED_LOCATIONS'; payload: LocationData[] }
  | { type: 'ADD_PRESET'; payload: FilterPreset }
  | { type: 'REMOVE_PRESET'; payload: string }
  | { type: 'LOAD_PRESETS'; payload: FilterPreset[] }
  | { type: 'CLEAR_ALL_FILTERS' }
  | { type: 'SET_FILTERING'; payload: boolean };

// Initial state
const initialCriteria: FilterCriteria = {
  searchText: '',
  layerTypes: [],
  dateRange: { start: '', end: '' },
  spatialQuery: { type: null, shape: null },
  attributes: {},
};

const initialState: FilterState = {
  criteria: initialCriteria,
  filteredLocations: [],
  savedPresets: [],
  isFiltering: false,
};

// Reducer
function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'UPDATE_SEARCH_TEXT':
      return {
        ...state,
        criteria: { ...state.criteria, searchText: action.payload },
      };
    
    case 'UPDATE_LAYER_TYPES':
      return {
        ...state,
        criteria: { ...state.criteria, layerTypes: action.payload },
      };
    
    case 'UPDATE_DATE_RANGE':
      return {
        ...state,
        criteria: { ...state.criteria, dateRange: action.payload },
      };
    
    case 'UPDATE_SPATIAL_QUERY':
      return {
        ...state,
        criteria: { ...state.criteria, spatialQuery: action.payload },
      };
    
    case 'UPDATE_ATTRIBUTE_FILTER':
      return {
        ...state,
        criteria: {
          ...state.criteria,
          attributes: {
            ...state.criteria.attributes,
            [action.payload.attribute]: {
              min: action.payload.min,
              max: action.payload.max,
            },
          },
        },
      };
    
    case 'CLEAR_ATTRIBUTE_FILTER':
      const { [action.payload]: removed, ...remainingAttributes } = state.criteria.attributes;
      return {
        ...state,
        criteria: {
          ...state.criteria,
          attributes: remainingAttributes,
        },
      };
    
    case 'SET_FILTERED_LOCATIONS':
      return { ...state, filteredLocations: action.payload };
    
    case 'ADD_PRESET':
      const newPresets = [...state.savedPresets, action.payload];
      return { ...state, savedPresets: newPresets };
    
    case 'REMOVE_PRESET':
      return {
        ...state,
        savedPresets: state.savedPresets.filter(preset => preset.id !== action.payload),
      };
    
    case 'LOAD_PRESETS':
      return { ...state, savedPresets: action.payload };
    
    case 'CLEAR_ALL_FILTERS':
      return {
        ...state,
        criteria: initialCriteria,
      };
    
    case 'SET_FILTERING':
      return { ...state, isFiltering: action.payload };
    
    default:
      return state;
  }
}

// Context interface
interface FilterContextType {
  // State
  criteria: FilterCriteria;
  filteredLocations: LocationData[];
  savedPresets: FilterPreset[];
  isFiltering: boolean;
  
  // Search and text filters
  updateSearchText: (text: string) => void;
  
  // Layer filters
  updateLayerTypes: (layerTypes: LayerType[]) => void;
  toggleLayerType: (layerType: LayerType) => void;
  
  // Date filters
  updateDateRange: (start: string, end: string) => void;
  clearDateRange: () => void;
  
  // Spatial filters
  setSpatialQuery: (type: 'within' | 'intersects' | 'contains' | null, shape: GeoJSON.Feature | null) => void;
  clearSpatialQuery: () => void;
  
  // Attribute filters
  setAttributeFilter: (attribute: string, min?: number, max?: number) => void;
  clearAttributeFilter: (attribute: string) => void;
  
  // Filter application
  applyFilters: (locations: LocationData[]) => LocationData[];
  clearAllFilters: () => void;
  
  // Presets
  savePreset: (name: string) => void;
  loadPreset: (preset: FilterPreset) => void;
  deletePreset: (id: string) => void;
  
  // Utilities
  getActiveFilterCount: () => number;
  hasActiveFilters: () => boolean;
  getFilterSummary: () => string;
}

// Create context
const FilterContext = createContext<FilterContextType | undefined>(undefined);

// Provider component
interface FilterProviderProps {
  children: ReactNode;
  locations: LocationData[];
  onFilterChange?: (filteredLocations: LocationData[]) => void;
}

export function FilterProvider({ children, locations, onFilterChange }: FilterProviderProps) {
  const [state, dispatch] = useReducer(filterReducer, initialState);

  // Apply filters function
  const applyFilters = (locationsToFilter: LocationData[]): LocationData[] => {
    dispatch({ type: 'SET_FILTERING', payload: true });
    
    let filtered = [...locationsToFilter];

    // Text search
    if (state.criteria.searchText.trim()) {
      const searchTerm = state.criteria.searchText.toLowerCase();
      filtered = filtered.filter(location =>
        location.name.toLowerCase().includes(searchTerm) ||
        location.category.toLowerCase().includes(searchTerm)
      );
    }

    // Layer type filter
    if (state.criteria.layerTypes.length > 0) {
      filtered = filtered.filter(location =>
        state.criteria.layerTypes.includes(location.layerType)
      );
    }

    // Date range filter
    if (state.criteria.dateRange.start || state.criteria.dateRange.end) {
      filtered = filtered.filter(location => {
        const locationDate = new Date(location.createdAt);
        const startDate = state.criteria.dateRange.start ? new Date(state.criteria.dateRange.start) : null;
        const endDate = state.criteria.dateRange.end ? new Date(state.criteria.dateRange.end) : null;
        
        if (startDate && endDate) {
          return locationDate >= startDate && locationDate <= endDate;
        } else if (startDate) {
          return locationDate >= startDate;
        } else if (endDate) {
          return locationDate <= endDate;
        }
        return true;
      });
    }

    // Spatial query filter
    if (state.criteria.spatialQuery.type && state.criteria.spatialQuery.shape) {
      filtered = filtered.filter(location => {
        try {
          const point = turf.point([location.longitude, location.latitude]);
          
          switch (state.criteria.spatialQuery.type) {
            case 'within':
              return turf.booleanWithin(point, state.criteria.spatialQuery.shape!);
            case 'intersects':
              return turf.booleanIntersects(point, state.criteria.spatialQuery.shape!);
            case 'contains':
              return turf.booleanContains(state.criteria.spatialQuery.shape!, point);
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
    Object.entries(state.criteria.attributes).forEach(([attribute, { min, max }]) => {
      if (min !== undefined || max !== undefined) {
        filtered = filtered.filter(location => {
          const value = location[attribute as keyof LocationData];
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

    dispatch({ type: 'SET_FILTERING', payload: false });
    return filtered;
  };

  // Memoized filtered locations
  const filteredLocations = useMemo(() => {
    return applyFilters(locations);
  }, [locations, state.criteria]);

  // Update filtered locations when they change
  useEffect(() => {
    dispatch({ type: 'SET_FILTERED_LOCATIONS', payload: filteredLocations });
    onFilterChange?.(filteredLocations);
  }, [filteredLocations, onFilterChange]);

  // Load saved presets from localStorage on mount
  useEffect(() => {
    const savedPresets = localStorage.getItem('filterPresets');
    if (savedPresets) {
      try {
        const presets = JSON.parse(savedPresets);
        dispatch({ type: 'LOAD_PRESETS', payload: presets });
      } catch (error) {
        console.error('Error loading saved presets:', error);
      }
    }
  }, []);

  // Search and text filters
  const updateSearchText = (text: string): void => {
    dispatch({ type: 'UPDATE_SEARCH_TEXT', payload: text });
  };

  // Layer filters
  const updateLayerTypes = (layerTypes: LayerType[]): void => {
    dispatch({ type: 'UPDATE_LAYER_TYPES', payload: layerTypes });
  };

  const toggleLayerType = (layerType: LayerType): void => {
    const currentTypes = state.criteria.layerTypes;
    const newTypes = currentTypes.includes(layerType)
      ? currentTypes.filter(type => type !== layerType)
      : [...currentTypes, layerType];
    
    dispatch({ type: 'UPDATE_LAYER_TYPES', payload: newTypes });
  };

  // Date filters
  const updateDateRange = (start: string, end: string): void => {
    dispatch({ type: 'UPDATE_DATE_RANGE', payload: { start, end } });
  };

  const clearDateRange = (): void => {
    dispatch({ type: 'UPDATE_DATE_RANGE', payload: { start: '', end: '' } });
  };

  // Spatial filters
  const setSpatialQuery = (
    type: 'within' | 'intersects' | 'contains' | null,
    shape: GeoJSON.Feature | null
  ): void => {
    dispatch({ type: 'UPDATE_SPATIAL_QUERY', payload: { type, shape } });
  };

  const clearSpatialQuery = (): void => {
    dispatch({ type: 'UPDATE_SPATIAL_QUERY', payload: { type: null, shape: null } });
  };

  // Attribute filters
  const setAttributeFilter = (attribute: string, min?: number, max?: number): void => {
    dispatch({ type: 'UPDATE_ATTRIBUTE_FILTER', payload: { attribute, min, max } });
  };

  const clearAttributeFilter = (attribute: string): void => {
    dispatch({ type: 'CLEAR_ATTRIBUTE_FILTER', payload: attribute });
  };

  // Filter management
  const clearAllFilters = (): void => {
    dispatch({ type: 'CLEAR_ALL_FILTERS' });
  };

  // Presets
  const savePreset = (name: string): void => {
    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name,
      filters: state.criteria,
    };
    
    dispatch({ type: 'ADD_PRESET', payload: newPreset });
    
    // Save to localStorage
    const updatedPresets = [...state.savedPresets, newPreset];
    localStorage.setItem('filterPresets', JSON.stringify(updatedPresets));
  };

  const loadPreset = (preset: FilterPreset): void => {
    dispatch({ type: 'UPDATE_SEARCH_TEXT', payload: preset.filters.searchText });
    dispatch({ type: 'UPDATE_LAYER_TYPES', payload: preset.filters.layerTypes });
    dispatch({ type: 'UPDATE_DATE_RANGE', payload: preset.filters.dateRange });
    dispatch({ type: 'UPDATE_SPATIAL_QUERY', payload: preset.filters.spatialQuery });
    
    // Load attribute filters
    Object.entries(preset.filters.attributes).forEach(([attribute, { min, max }]) => {
      dispatch({ type: 'UPDATE_ATTRIBUTE_FILTER', payload: { attribute, min, max } });
    });
  };

  const deletePreset = (id: string): void => {
    dispatch({ type: 'REMOVE_PRESET', payload: id });
    
    // Update localStorage
    const updatedPresets = state.savedPresets.filter(preset => preset.id !== id);
    localStorage.setItem('filterPresets', JSON.stringify(updatedPresets));
  };

  // Utilities
  const getActiveFilterCount = (): number => {
    let count = 0;
    
    if (state.criteria.searchText.trim()) count++;
    if (state.criteria.layerTypes.length > 0) count++;
    if (state.criteria.dateRange.start || state.criteria.dateRange.end) count++;
    if (state.criteria.spatialQuery.type && state.criteria.spatialQuery.shape) count++;
    
    count += Object.keys(state.criteria.attributes).length;
    
    return count;
  };

  const hasActiveFilters = (): boolean => {
    return getActiveFilterCount() > 0;
  };

  const getFilterSummary = (): string => {
    const parts: string[] = [];
    
    if (state.criteria.searchText.trim()) {
      parts.push(`Search: "${state.criteria.searchText}"`);
    }
    
    if (state.criteria.layerTypes.length > 0) {
      parts.push(`Layers: ${state.criteria.layerTypes.join(', ')}`);
    }
    
    if (state.criteria.dateRange.start || state.criteria.dateRange.end) {
      parts.push('Date range active');
    }
    
    if (state.criteria.spatialQuery.type) {
      parts.push(`Spatial: ${state.criteria.spatialQuery.type}`);
    }
    
    const attributeCount = Object.keys(state.criteria.attributes).length;
    if (attributeCount > 0) {
      parts.push(`${attributeCount} attribute filter${attributeCount > 1 ? 's' : ''}`);
    }
    
    return parts.length > 0 ? parts.join(' | ') : 'No filters active';
  };

  const contextValue: FilterContextType = {
    // State
    criteria: state.criteria,
    filteredLocations: state.filteredLocations,
    savedPresets: state.savedPresets,
    isFiltering: state.isFiltering,
    
    // Search and text filters
    updateSearchText,
    
    // Layer filters
    updateLayerTypes,
    toggleLayerType,
    
    // Date filters
    updateDateRange,
    clearDateRange,
    
    // Spatial filters
    setSpatialQuery,
    clearSpatialQuery,
    
    // Attribute filters
    setAttributeFilter,
    clearAttributeFilter,
    
    // Filter application
    applyFilters,
    clearAllFilters,
    
    // Presets
    savePreset,
    loadPreset,
    deletePreset,
    
    // Utilities
    getActiveFilterCount,
    hasActiveFilters,
    getFilterSummary,
  };

  return (
    <FilterContext.Provider value={contextValue}>
      {children}
    </FilterContext.Provider>
  );
}

// Custom hook to use filter context
export function useFilters(): FilterContextType {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
} 