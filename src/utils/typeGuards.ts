import { LocationData, ShapeData, LayerType, ShapeType, ShapeCategory, ApiResponse } from '@/types';

// Type guard for LayerType
export function isValidLayerType(value: any): value is LayerType {
  return typeof value === 'string' && 
    ['co2', 'air_quality', 'temperature', 'industrial', 'traffic'].includes(value);
}

// Type guard for ShapeType
export function isValidShapeType(value: any): value is ShapeType {
  return typeof value === 'string' && 
    ['polygon', 'circle', 'rectangle', 'polyline', 'marker'].includes(value);
}

// Type guard for ShapeCategory
export function isValidShapeCategory(value: any): value is ShapeCategory {
  return typeof value === 'string' && 
    ['environmental', 'monitoring', 'industrial', 'residential', 'commercial', 'research', 'restricted', 'other'].includes(value);
}

// Type guard for LocationData
export function isValidLocationData(obj: any): obj is LocationData {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.latitude === 'number' &&
    typeof obj.longitude === 'number' &&
    isValidLayerType(obj.layerType) &&
    typeof obj.category === 'string' &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date &&
    typeof obj.userId === 'string' &&
    obj.latitude >= -90 && obj.latitude <= 90 &&
    obj.longitude >= -180 && obj.longitude <= 180
  );
}

// Type guard for ShapeData
export function isValidShapeData(obj: any): obj is ShapeData {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    (obj.description === undefined || typeof obj.description === 'string') &&
    isValidShapeCategory(obj.category) &&
    isValidShapeType(obj.shapeType) &&
    obj.properties &&
    typeof obj.properties === 'object' &&
    obj.geometry &&
    typeof obj.geometry === 'object' &&
    typeof obj.userId === 'string' &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  );
}

// Type guard for GeoJSON Feature
export function isValidGeoJSONFeature(obj: any): obj is GeoJSON.Feature {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.type === 'Feature' &&
    obj.geometry &&
    typeof obj.geometry === 'object' &&
    typeof obj.geometry.type === 'string' &&
    Array.isArray(obj.geometry.coordinates) &&
    (obj.properties === null || typeof obj.properties === 'object')
  );
}

// Type guard for GeoJSON FeatureCollection
export function isValidGeoJSONFeatureCollection(obj: any): obj is GeoJSON.FeatureCollection {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.type === 'FeatureCollection' &&
    Array.isArray(obj.features) &&
    obj.features.every(isValidGeoJSONFeature)
  );
}

// Type guard for API Response
export function isValidApiResponse<T>(obj: any, dataValidator?: (data: any) => data is T): obj is ApiResponse<T> {
  const baseValid = (
    obj &&
    typeof obj === 'object' &&
    typeof obj.success === 'boolean' &&
    (obj.error === undefined || typeof obj.error === 'string') &&
    (obj.message === undefined || typeof obj.message === 'string')
  );

  if (!baseValid) return false;

  if (obj.data !== undefined && dataValidator) {
    return dataValidator(obj.data);
  }

  return true;
}

// Coordinate validation
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !isNaN(lat) && !isNaN(lng)
  );
}

// Array validation helper
export function isArrayOf<T>(arr: any, itemValidator: (item: any) => item is T): arr is T[] {
  return Array.isArray(arr) && arr.every(itemValidator);
}

// Validation with error messages
export function validateLocationData(obj: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!obj || typeof obj !== 'object') {
    errors.push('Location data must be an object');
    return { isValid: false, errors };
  }

  if (typeof obj.id !== 'string') errors.push('ID must be a string');
  if (typeof obj.name !== 'string') errors.push('Name must be a string');
  if (typeof obj.latitude !== 'number') errors.push('Latitude must be a number');
  if (typeof obj.longitude !== 'number') errors.push('Longitude must be a number');
  if (!isValidLayerType(obj.layerType)) errors.push('Invalid layer type');
  if (typeof obj.category !== 'string') errors.push('Category must be a string');
  if (typeof obj.userId !== 'string') errors.push('User ID must be a string');

  if (typeof obj.latitude === 'number' && (obj.latitude < -90 || obj.latitude > 90)) {
    errors.push('Latitude must be between -90 and 90');
  }
  if (typeof obj.longitude === 'number' && (obj.longitude < -180 || obj.longitude > 180)) {
    errors.push('Longitude must be between -180 and 180');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateShapeData(obj: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!obj || typeof obj !== 'object') {
    errors.push('Shape data must be an object');
    return { isValid: false, errors };
  }

  if (typeof obj.id !== 'string') errors.push('ID must be a string');
  if (typeof obj.name !== 'string') errors.push('Name must be a string');
  if (obj.description !== undefined && typeof obj.description !== 'string') {
    errors.push('Description must be a string');
  }
  if (!isValidShapeCategory(obj.category)) errors.push('Invalid shape category');
  if (!isValidShapeType(obj.shapeType)) errors.push('Invalid shape type');
  if (!obj.properties || typeof obj.properties !== 'object') {
    errors.push('Properties must be an object');
  }
  if (!obj.geometry || typeof obj.geometry !== 'object') {
    errors.push('Geometry must be an object');
  }
  if (typeof obj.userId !== 'string') errors.push('User ID must be a string');

  return { isValid: errors.length === 0, errors };
} 