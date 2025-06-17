"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { LocationData, LayerType } from '@/types';
import { locationApi, handleApiError } from '@/utils/apiClient';
import { isValidLocationData } from '@/utils/typeGuards';

// State interface
interface LocationState {
  locations: LocationData[];
  loading: boolean;
  error: string | null;
  selectedLocation: LocationData | null;
}

// Action types
type LocationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOCATIONS'; payload: LocationData[] }
  | { type: 'ADD_LOCATION'; payload: LocationData }
  | { type: 'UPDATE_LOCATION'; payload: LocationData }
  | { type: 'DELETE_LOCATION'; payload: string }
  | { type: 'SELECT_LOCATION'; payload: LocationData | null }
  | { type: 'CLEAR_LOCATIONS' };

// Initial state
const initialState: LocationState = {
  locations: [],
  loading: false,
  error: null,
  selectedLocation: null,
};

// Reducer
function locationReducer(state: LocationState, action: LocationAction): LocationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_LOCATIONS':
      return { ...state, locations: action.payload, loading: false, error: null };
    
    case 'ADD_LOCATION':
      return {
        ...state,
        locations: [...state.locations, action.payload],
        error: null,
      };
    
    case 'UPDATE_LOCATION':
      return {
        ...state,
        locations: state.locations.map(loc =>
          loc.id === action.payload.id ? action.payload : loc
        ),
        selectedLocation: state.selectedLocation?.id === action.payload.id
          ? action.payload
          : state.selectedLocation,
        error: null,
      };
    
    case 'DELETE_LOCATION':
      return {
        ...state,
        locations: state.locations.filter(loc => loc.id !== action.payload),
        selectedLocation: state.selectedLocation?.id === action.payload
          ? null
          : state.selectedLocation,
        error: null,
      };
    
    case 'SELECT_LOCATION':
      return { ...state, selectedLocation: action.payload };
    
    case 'CLEAR_LOCATIONS':
      return { ...state, locations: [], selectedLocation: null };
    
    default:
      return state;
  }
}

// Context interface
interface LocationContextType {
  // State
  locations: LocationData[];
  loading: boolean;
  error: string | null;
  selectedLocation: LocationData | null;
  
  // Actions
  loadLocations: () => Promise<void>;
  createLocation: (locationData: Omit<LocationData, 'id' | 'createdAt' | 'updatedAt'>) => Promise<LocationData | null>;
  updateLocation: (id: string, locationData: Partial<LocationData>) => Promise<LocationData | null>;
  deleteLocation: (id: string) => Promise<boolean>;
  selectLocation: (location: LocationData | null) => void;
  clearError: () => void;
  
  // Computed values
  getLocationsByLayerType: (layerType: LayerType) => LocationData[];
  getLocationsByCategory: (category: string) => LocationData[];
  getTotalLocations: () => number;
}

// Create context
const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Provider component
interface LocationProviderProps {
  children: ReactNode;
  initialLocations?: LocationData[];
}

export function LocationProvider({ children, initialLocations = [] }: LocationProviderProps) {
  const [state, dispatch] = useReducer(locationReducer, {
    ...initialState,
    locations: initialLocations,
  });

  // Load locations from API
  const loadLocations = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await locationApi.getAll();
      
      if (response.success && response.data) {
        // Validate all location data
        const validLocations = response.data.filter(isValidLocationData);
        dispatch({ type: 'SET_LOCATIONS', payload: validLocations });
      } else {
        throw new Error(response.error || 'Failed to load locations');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  // Create new location
  const createLocation = async (
    locationData: Omit<LocationData, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<LocationData | null> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await locationApi.create(locationData);
      
      if (response.success && response.data) {
        dispatch({ type: 'ADD_LOCATION', payload: response.data });
        dispatch({ type: 'SET_LOADING', payload: false });
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create location');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return null;
    }
  };

  // Update location
  const updateLocation = async (
    id: string,
    locationData: Partial<LocationData>
  ): Promise<LocationData | null> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await locationApi.update(id, locationData);
      
      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_LOCATION', payload: response.data });
        dispatch({ type: 'SET_LOADING', payload: false });
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update location');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return null;
    }
  };

  // Delete location
  const deleteLocation = async (id: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await locationApi.delete(id);
      
      if (response.success) {
        dispatch({ type: 'DELETE_LOCATION', payload: id });
        dispatch({ type: 'SET_LOADING', payload: false });
        return true;
      } else {
        throw new Error(response.error || 'Failed to delete location');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return false;
    }
  };

  // Select location
  const selectLocation = (location: LocationData | null): void => {
    dispatch({ type: 'SELECT_LOCATION', payload: location });
  };

  // Clear error
  const clearError = (): void => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  // Computed values
  const getLocationsByLayerType = (layerType: LayerType): LocationData[] => {
    return state.locations.filter(location => location.layerType === layerType);
  };

  const getLocationsByCategory = (category: string): LocationData[] => {
    return state.locations.filter(location => location.category === category);
  };

  const getTotalLocations = (): number => {
    return state.locations.length;
  };

  // Load initial data on mount
  useEffect(() => {
    if (initialLocations.length === 0) {
      loadLocations();
    }
  }, []);

  const contextValue: LocationContextType = {
    // State
    locations: state.locations,
    loading: state.loading,
    error: state.error,
    selectedLocation: state.selectedLocation,
    
    // Actions
    loadLocations,
    createLocation,
    updateLocation,
    deleteLocation,
    selectLocation,
    clearError,
    
    // Computed values
    getLocationsByLayerType,
    getLocationsByCategory,
    getTotalLocations,
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
}

// Custom hook to use location context
export function useLocations(): LocationContextType {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocations must be used within a LocationProvider');
  }
  return context;
} 