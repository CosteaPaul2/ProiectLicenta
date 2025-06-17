"use client";

import React, { createContext, useContext, useReducer, ReactNode, useRef } from 'react';
import L from 'leaflet';
import { LayerConfig, MapState, LayerType } from '@/types';

// Default layer configuration
export const defaultLayers: LayerConfig[] = [
  { id: 'co2', name: 'CO2 Emissions', color: '#ff6b6b', visible: true, opacity: 0.8 },
  { id: 'air_quality', name: 'Air Quality', color: '#4ecdc4', visible: true, opacity: 0.8 },
  { id: 'temperature', name: 'Temperature', color: '#45b7d1', visible: true, opacity: 0.8 },
  { id: 'industrial', name: 'Industrial', color: '#f9ca24', visible: true, opacity: 0.8 },
  { id: 'traffic', name: 'Traffic', color: '#6c5ce7', visible: true, opacity: 0.8 },
];

// State interface
interface MapContextState {
  mapInstance: L.Map | null;
  drawnItems: L.FeatureGroup | null;
  mapState: MapState;
  layers: LayerConfig[];
  activePanel: 'controls' | 'layers' | 'data' | 'tools' | 'analysis';
}

// Action types
type MapAction =
  | { type: 'SET_MAP_INSTANCE'; payload: L.Map }
  | { type: 'SET_DRAWN_ITEMS'; payload: L.FeatureGroup }
  | { type: 'UPDATE_MAP_STATE'; payload: Partial<MapState> }
  | { type: 'TOGGLE_LAYER_VISIBILITY'; payload: { layerId: LayerType; visible: boolean } }
  | { type: 'UPDATE_LAYER_OPACITY'; payload: { layerId: LayerType; opacity: number } }
  | { type: 'SET_ACTIVE_PANEL'; payload: 'controls' | 'layers' | 'data' | 'tools' | 'analysis' }
  | { type: 'RESET_LAYERS' };

// Initial state
const initialState: MapContextState = {
  mapInstance: null,
  drawnItems: null,
  mapState: {
    center: [51.505, -0.09],
    zoom: 13,
    drawingMode: false,
    analysisMode: false,
    selectedTool: null,
  },
  layers: defaultLayers,
  activePanel: 'controls',
};

// Reducer
function mapReducer(state: MapContextState, action: MapAction): MapContextState {
  switch (action.type) {
    case 'SET_MAP_INSTANCE':
      return { ...state, mapInstance: action.payload };
    
    case 'SET_DRAWN_ITEMS':
      return { ...state, drawnItems: action.payload };
    
    case 'UPDATE_MAP_STATE':
      return {
        ...state,
        mapState: { ...state.mapState, ...action.payload },
      };
    
    case 'TOGGLE_LAYER_VISIBILITY':
      return {
        ...state,
        layers: state.layers.map(layer =>
          layer.id === action.payload.layerId
            ? { ...layer, visible: action.payload.visible }
            : layer
        ),
      };
    
    case 'UPDATE_LAYER_OPACITY':
      return {
        ...state,
        layers: state.layers.map(layer =>
          layer.id === action.payload.layerId
            ? { ...layer, opacity: action.payload.opacity }
            : layer
        ),
      };
    
    case 'SET_ACTIVE_PANEL':
      return { ...state, activePanel: action.payload };
    
    case 'RESET_LAYERS':
      return { ...state, layers: defaultLayers };
    
    default:
      return state;
  }
}

// Context interface
interface MapContextType {
  // State
  mapInstance: L.Map | null;
  drawnItems: L.FeatureGroup | null;
  mapState: MapState;
  layers: LayerConfig[];
  activePanel: string;
  
  // Map actions
  setMapInstance: (map: L.Map) => void;
  setDrawnItems: (drawnItems: L.FeatureGroup) => void;
  updateMapState: (updates: Partial<MapState>) => void;
  
  // Drawing actions
  toggleDrawingMode: () => void;
  toggleAnalysisMode: () => void;
  setSelectedTool: (tool: string | null) => void;
  
  // Layer actions
  toggleLayerVisibility: (layerId: LayerType, visible?: boolean) => void;
  updateLayerOpacity: (layerId: LayerType, opacity: number) => void;
  getVisibleLayers: () => LayerConfig[];
  getLayerById: (layerId: LayerType) => LayerConfig | undefined;
  resetLayers: () => void;
  
  // Panel actions
  setActivePanel: (panel: 'controls' | 'layers' | 'data' | 'tools' | 'analysis') => void;
  
  // Map utilities
  flyToLocation: (lat: number, lng: number, zoom?: number) => void;
  clearDrawnItems: () => void;
  getMapBounds: () => L.LatLngBounds | null;
  addShapeToMap: (geoJson: GeoJSON.Feature, options?: L.PathOptions) => L.Layer | null;
}

// Create context
const MapContext = createContext<MapContextType | undefined>(undefined);

// Provider component
interface MapProviderProps {
  children: ReactNode;
}

export function MapProvider({ children }: MapProviderProps) {
  const [state, dispatch] = useReducer(mapReducer, initialState);

  // Map instance management
  const setMapInstance = (map: L.Map): void => {
    dispatch({ type: 'SET_MAP_INSTANCE', payload: map });
  };

  const setDrawnItems = (drawnItems: L.FeatureGroup): void => {
    dispatch({ type: 'SET_DRAWN_ITEMS', payload: drawnItems });
  };

  const updateMapState = (updates: Partial<MapState>): void => {
    dispatch({ type: 'UPDATE_MAP_STATE', payload: updates });
  };

  // Drawing mode management
  const toggleDrawingMode = (): void => {
    const newDrawingMode = !state.mapState.drawingMode;
    dispatch({
      type: 'UPDATE_MAP_STATE',
      payload: { drawingMode: newDrawingMode },
    });
  };

  const toggleAnalysisMode = (): void => {
    const newAnalysisMode = !state.mapState.analysisMode;
    dispatch({
      type: 'UPDATE_MAP_STATE',
      payload: {
        analysisMode: newAnalysisMode,
        // Enable drawing mode when analysis mode is enabled
        drawingMode: newAnalysisMode ? true : state.mapState.drawingMode,
      },
    });
  };

  const setSelectedTool = (tool: string | null): void => {
    dispatch({
      type: 'UPDATE_MAP_STATE',
      payload: { selectedTool: tool },
    });
  };

  // Layer management
  const toggleLayerVisibility = (layerId: LayerType, visible?: boolean): void => {
    const currentLayer = state.layers.find(l => l.id === layerId);
    const newVisibility = visible !== undefined ? visible : !currentLayer?.visible;
    
    dispatch({
      type: 'TOGGLE_LAYER_VISIBILITY',
      payload: { layerId, visible: newVisibility },
    });
  };

  const updateLayerOpacity = (layerId: LayerType, opacity: number): void => {
    dispatch({
      type: 'UPDATE_LAYER_OPACITY',
      payload: { layerId, opacity: Math.max(0, Math.min(1, opacity)) },
    });
  };

  const getVisibleLayers = (): LayerConfig[] => {
    return state.layers.filter(layer => layer.visible);
  };

  const getLayerById = (layerId: LayerType): LayerConfig | undefined => {
    return state.layers.find(layer => layer.id === layerId);
  };

  const resetLayers = (): void => {
    dispatch({ type: 'RESET_LAYERS' });
  };

  // Panel management
  const setActivePanel = (panel: 'controls' | 'layers' | 'data' | 'tools' | 'analysis'): void => {
    dispatch({ type: 'SET_ACTIVE_PANEL', payload: panel });
  };

  // Map utilities
  const flyToLocation = (lat: number, lng: number, zoom = 15): void => {
    if (state.mapInstance) {
      state.mapInstance.flyTo([lat, lng], zoom);
    }
  };

  const clearDrawnItems = (): void => {
    if (state.drawnItems) {
      state.drawnItems.clearLayers();
    }
  };

  const getMapBounds = (): L.LatLngBounds | null => {
    return state.mapInstance?.getBounds() || null;
  };

  const addShapeToMap = (geoJson: GeoJSON.Feature, options?: L.PathOptions): L.Layer | null => {
    if (!state.mapInstance) return null;

    try {
      const layer = L.geoJSON(geoJson, {
        style: options || {
          color: '#3388ff',
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.2,
        },
      }).addTo(state.mapInstance);

      return layer;
    } catch (error) {
      console.error('Error adding shape to map:', error);
      return null;
    }
  };

  const contextValue: MapContextType = {
    // State
    mapInstance: state.mapInstance,
    drawnItems: state.drawnItems,
    mapState: state.mapState,
    layers: state.layers,
    activePanel: state.activePanel,
    
    // Map actions
    setMapInstance,
    setDrawnItems,
    updateMapState,
    
    // Drawing actions
    toggleDrawingMode,
    toggleAnalysisMode,
    setSelectedTool,
    
    // Layer actions
    toggleLayerVisibility,
    updateLayerOpacity,
    getVisibleLayers,
    getLayerById,
    resetLayers,
    
    // Panel actions
    setActivePanel,
    
    // Map utilities
    flyToLocation,
    clearDrawnItems,
    getMapBounds,
    addShapeToMap,
  };

  return (
    <MapContext.Provider value={contextValue}>
      {children}
    </MapContext.Provider>
  );
}

// Custom hook to use map context
export function useMap(): MapContextType {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
} 