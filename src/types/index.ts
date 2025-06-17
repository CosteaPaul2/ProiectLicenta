// Base types
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Location types
export type LayerType = 'co2' | 'air_quality' | 'temperature' | 'industrial' | 'traffic';

export interface LocationData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  layerType: LayerType;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  // Dynamic properties based on layer type
  [key: string]: any;
}

// Shape types
export type ShapeType = 'polygon' | 'circle' | 'rectangle' | 'polyline' | 'marker';
export type ShapeCategory = 'environmental' | 'monitoring' | 'industrial' | 'residential' | 'commercial' | 'research' | 'restricted' | 'other';

export interface ShapeData {
  id: string;
  name: string;
  description?: string;
  category: ShapeCategory;
  shapeType: ShapeType;
  properties: ShapeProperties;
  geometry: GeoJSON.Geometry;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShapeProperties {
  color: string;
  fillColor?: string;
  fillOpacity?: number;
  weight?: number;
  [key: string]: any;
}

// Filter types
export interface FilterCriteria {
  searchText: string;
  layerTypes: LayerType[];
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

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterCriteria;
}

// Layer types
export interface LayerConfig {
  id: LayerType;
  name: string;
  color: string;
  visible: boolean;
  opacity?: number;
}

// Map types
export interface MapState {
  center: [number, number];
  zoom: number;
  drawingMode: boolean;
  analysisMode: boolean;
  selectedTool: string | null;
}

// Analysis types
export interface AnalysisResult {
  id: string;
  type: 'buffer' | 'measurement' | 'intersection';
  result: GeoJSON.Feature;
  metadata: {
    [key: string]: any;
  };
} 