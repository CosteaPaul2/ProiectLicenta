"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import L from 'leaflet';
import { ShapeData, AnalysisResult } from '@/types';
import { shapeApi, handleApiError } from '@/utils/apiClient';
import { isValidShapeData } from '@/utils/typeGuards';

// State interface
interface ShapeState {
  savedShapes: ShapeData[];
  drawnShapes: GeoJSON.Feature[];
  analysisResults: AnalysisResult[];
  loading: boolean;
  error: string | null;
  pendingShape: {
    geoJson: GeoJSON.Feature;
    layer: L.Layer;
    type: string;
  } | null;
  showPropertiesModal: boolean;
}

// Action types
type ShapeAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SAVED_SHAPES'; payload: ShapeData[] }
  | { type: 'ADD_SAVED_SHAPE'; payload: ShapeData }
  | { type: 'UPDATE_SAVED_SHAPE'; payload: ShapeData }
  | { type: 'DELETE_SAVED_SHAPE'; payload: string }
  | { type: 'SET_DRAWN_SHAPES'; payload: GeoJSON.Feature[] }
  | { type: 'ADD_DRAWN_SHAPE'; payload: GeoJSON.Feature }
  | { type: 'REMOVE_DRAWN_SHAPE'; payload: number }
  | { type: 'CLEAR_DRAWN_SHAPES' }
  | { type: 'ADD_ANALYSIS_RESULT'; payload: AnalysisResult }
  | { type: 'CLEAR_ANALYSIS_RESULTS' }
  | { type: 'SET_PENDING_SHAPE'; payload: { geoJson: GeoJSON.Feature; layer: L.Layer; type: string } | null }
  | { type: 'SET_SHOW_PROPERTIES_MODAL'; payload: boolean };

// Initial state
const initialState: ShapeState = {
  savedShapes: [],
  drawnShapes: [],
  analysisResults: [],
  loading: false,
  error: null,
  pendingShape: null,
  showPropertiesModal: false,
};

// Reducer
function shapeReducer(state: ShapeState, action: ShapeAction): ShapeState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_SAVED_SHAPES':
      return { ...state, savedShapes: action.payload, loading: false, error: null };
    
    case 'ADD_SAVED_SHAPE':
      return {
        ...state,
        savedShapes: [...state.savedShapes, action.payload],
        error: null,
      };
    
    case 'UPDATE_SAVED_SHAPE':
      return {
        ...state,
        savedShapes: state.savedShapes.map(shape =>
          shape.id === action.payload.id ? action.payload : shape
        ),
        error: null,
      };
    
    case 'DELETE_SAVED_SHAPE':
      return {
        ...state,
        savedShapes: state.savedShapes.filter(shape => shape.id !== action.payload),
        error: null,
      };
    
    case 'SET_DRAWN_SHAPES':
      return { ...state, drawnShapes: action.payload };
    
    case 'ADD_DRAWN_SHAPE':
      return {
        ...state,
        drawnShapes: [...state.drawnShapes, action.payload],
      };
    
    case 'REMOVE_DRAWN_SHAPE':
      return {
        ...state,
        drawnShapes: state.drawnShapes.filter((_, index) => index !== action.payload),
      };
    
    case 'CLEAR_DRAWN_SHAPES':
      return { ...state, drawnShapes: [] };
    
    case 'ADD_ANALYSIS_RESULT':
      return {
        ...state,
        analysisResults: [...state.analysisResults, action.payload],
      };
    
    case 'CLEAR_ANALYSIS_RESULTS':
      return { ...state, analysisResults: [] };
    
    case 'SET_PENDING_SHAPE':
      return { ...state, pendingShape: action.payload };
    
    case 'SET_SHOW_PROPERTIES_MODAL':
      return { ...state, showPropertiesModal: action.payload };
    
    default:
      return state;
  }
}

// Context interface
interface ShapeContextType {
  // State
  savedShapes: ShapeData[];
  drawnShapes: GeoJSON.Feature[];
  analysisResults: AnalysisResult[];
  loading: boolean;
  error: string | null;
  pendingShape: {
    geoJson: GeoJSON.Feature;
    layer: L.Layer;
    type: string;
  } | null;
  showPropertiesModal: boolean;
  
  // Saved shapes operations
  loadSavedShapes: () => Promise<void>;
  createSavedShape: (shapeData: Omit<ShapeData, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ShapeData | null>;
  updateSavedShape: (id: string, shapeData: Partial<ShapeData>) => Promise<ShapeData | null>;
  deleteSavedShape: (id: string) => Promise<boolean>;
  
  // Drawn shapes operations
  addDrawnShape: (shape: GeoJSON.Feature) => void;
  removeDrawnShape: (index: number) => void;
  clearDrawnShapes: () => void;
  setDrawnShapes: (shapes: GeoJSON.Feature[]) => void;
  
  // Analysis operations
  addAnalysisResult: (result: AnalysisResult) => void;
  clearAnalysisResults: () => void;
  
  // Shape creation flow
  setPendingShape: (shape: { geoJson: GeoJSON.Feature; layer: L.Layer; type: string } | null) => void;
  setShowPropertiesModal: (show: boolean) => void;
  handleShapeCreated: (geoJson: GeoJSON.Feature, layer: L.Layer, isAnalysis?: boolean) => void;
  
  // Utilities
  getTotalShapes: () => number;
  exportShapesToGeoJSON: () => GeoJSON.FeatureCollection;
  importShapesFromGeoJSON: (geoJson: GeoJSON.FeatureCollection) => void;
  clearError: () => void;
}

// Create context
const ShapeContext = createContext<ShapeContextType | undefined>(undefined);

// Provider component
interface ShapeProviderProps {
  children: ReactNode;
}

export function ShapeProvider({ children }: ShapeProviderProps) {
  const [state, dispatch] = useReducer(shapeReducer, initialState);

  // Load saved shapes from API
  const loadSavedShapes = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await shapeApi.getAll();
      
      if (response.success && response.data) {
        const validShapes = response.data.filter(isValidShapeData);
        dispatch({ type: 'SET_SAVED_SHAPES', payload: validShapes });
      } else {
        // Silently handle if shapes API is not available
        dispatch({ type: 'SET_SAVED_SHAPES', payload: [] });
      }
    } catch (error) {
      // Don't show error for shapes API not being available
      dispatch({ type: 'SET_SAVED_SHAPES', payload: [] });
    }
  };

  // Create new saved shape
  const createSavedShape = async (
    shapeData: Omit<ShapeData, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ShapeData | null> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await shapeApi.create(shapeData);
      
      if (response.success && response.data) {
        dispatch({ type: 'ADD_SAVED_SHAPE', payload: response.data });
        dispatch({ type: 'SET_LOADING', payload: false });
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create shape');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return null;
    }
  };

  // Update saved shape
  const updateSavedShape = async (
    id: string,
    shapeData: Partial<ShapeData>
  ): Promise<ShapeData | null> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await shapeApi.update(id, shapeData);
      
      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_SAVED_SHAPE', payload: response.data });
        dispatch({ type: 'SET_LOADING', payload: false });
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update shape');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return null;
    }
  };

  // Delete saved shape
  const deleteSavedShape = async (id: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await shapeApi.delete(id);
      
      if (response.success) {
        dispatch({ type: 'DELETE_SAVED_SHAPE', payload: id });
        dispatch({ type: 'SET_LOADING', payload: false });
        return true;
      } else {
        throw new Error(response.error || 'Failed to delete shape');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return false;
    }
  };

  // Drawn shapes operations
  const addDrawnShape = (shape: GeoJSON.Feature): void => {
    dispatch({ type: 'ADD_DRAWN_SHAPE', payload: shape });
  };

  const removeDrawnShape = (index: number): void => {
    dispatch({ type: 'REMOVE_DRAWN_SHAPE', payload: index });
  };

  const clearDrawnShapes = (): void => {
    dispatch({ type: 'CLEAR_DRAWN_SHAPES' });
  };

  const setDrawnShapes = (shapes: GeoJSON.Feature[]): void => {
    dispatch({ type: 'SET_DRAWN_SHAPES', payload: shapes });
  };

  // Analysis operations
  const addAnalysisResult = (result: AnalysisResult): void => {
    dispatch({ type: 'ADD_ANALYSIS_RESULT', payload: result });
  };

  const clearAnalysisResults = (): void => {
    dispatch({ type: 'CLEAR_ANALYSIS_RESULTS' });
  };

  // Shape creation flow
  const setPendingShape = (shape: { geoJson: GeoJSON.Feature; layer: L.Layer; type: string } | null): void => {
    dispatch({ type: 'SET_PENDING_SHAPE', payload: shape });
  };

  const setShowPropertiesModal = (show: boolean): void => {
    dispatch({ type: 'SET_SHOW_PROPERTIES_MODAL', payload: show });
  };

  const handleShapeCreated = (geoJson: GeoJSON.Feature, layer: L.Layer, isAnalysis = false): void => {
    if (isAnalysis) {
      // In analysis mode, just add the shape without saving to database
      dispatch({ type: 'ADD_DRAWN_SHAPE', payload: geoJson });
    } else {
      // In normal drawing mode, show properties modal
      const shapeType = geoJson.geometry.type;
      dispatch({ type: 'SET_PENDING_SHAPE', payload: { geoJson, layer, type: shapeType } });
      dispatch({ type: 'SET_SHOW_PROPERTIES_MODAL', payload: true });
    }
  };

  // Utilities
  const getTotalShapes = (): number => {
    return state.savedShapes.length + state.drawnShapes.length;
  };

  const exportShapesToGeoJSON = (): GeoJSON.FeatureCollection => {
    const allFeatures = [
      ...state.drawnShapes,
      ...state.savedShapes.map(shape => ({
        type: 'Feature' as const,
        geometry: shape.geometry,
        properties: {
          id: shape.id,
          name: shape.name,
          description: shape.description,
          category: shape.category,
          shapeType: shape.shapeType,
          ...shape.properties,
        },
      })),
    ];

    return {
      type: 'FeatureCollection',
      features: allFeatures,
    };
  };

  const importShapesFromGeoJSON = (geoJson: GeoJSON.FeatureCollection): void => {
    if (geoJson.features) {
      dispatch({ type: 'SET_DRAWN_SHAPES', payload: geoJson.features });
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  // Load saved shapes on mount
  useEffect(() => {
    loadSavedShapes();
  }, []);

  const contextValue: ShapeContextType = {
    // State
    savedShapes: state.savedShapes,
    drawnShapes: state.drawnShapes,
    analysisResults: state.analysisResults,
    loading: state.loading,
    error: state.error,
    pendingShape: state.pendingShape,
    showPropertiesModal: state.showPropertiesModal,
    
    // Saved shapes operations
    loadSavedShapes,
    createSavedShape,
    updateSavedShape,
    deleteSavedShape,
    
    // Drawn shapes operations
    addDrawnShape,
    removeDrawnShape,
    clearDrawnShapes,
    setDrawnShapes,
    
    // Analysis operations
    addAnalysisResult,
    clearAnalysisResults,
    
    // Shape creation flow
    setPendingShape,
    setShowPropertiesModal,
    handleShapeCreated,
    
    // Utilities
    getTotalShapes,
    exportShapesToGeoJSON,
    importShapesFromGeoJSON,
    clearError,
  };

  return (
    <ShapeContext.Provider value={contextValue}>
      {children}
    </ShapeContext.Provider>
  );
}

// Custom hook to use shape context
export function useShapes(): ShapeContextType {
  const context = useContext(ShapeContext);
  if (context === undefined) {
    throw new Error('useShapes must be used within a ShapeProvider');
  }
  return context;
} 