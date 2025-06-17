import { LocationData, ShapeData, ApiResponse } from '@/types';
import { isValidApiResponse, isValidLocationData, isValidShapeData, isArrayOf } from './typeGuards';

// Base API client configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Error classes for better error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: string[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Generic fetch wrapper with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  dataValidator?: (data: any) => data is T
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        data.code
      );
    }

    // Validate response structure
    if (!isValidApiResponse(data, dataValidator)) {
      throw new ValidationError('Invalid API response format', [
        'Response does not match expected structure'
      ]);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError || error instanceof ValidationError) {
      throw error;
    }

    // Network or other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      undefined,
      'NETWORK_ERROR'
    );
  }
}

// Location API
export const locationApi = {
  // Get all locations
  async getAll(): Promise<ApiResponse<LocationData[]>> {
    return apiRequest(
      '/api/locations',
      { method: 'GET' },
      (data): data is LocationData[] => isArrayOf(data, isValidLocationData)
    );
  },

  // Get location by ID
  async getById(id: string): Promise<ApiResponse<LocationData>> {
    return apiRequest(
      `/api/locations/${id}`,
      { method: 'GET' },
      isValidLocationData
    );
  },

  // Create new location
  async create(locationData: Omit<LocationData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<LocationData>> {
    return apiRequest(
      '/api/locations',
      {
        method: 'POST',
        body: JSON.stringify(locationData),
      },
      isValidLocationData
    );
  },

  // Update location
  async update(id: string, locationData: Partial<LocationData>): Promise<ApiResponse<LocationData>> {
    return apiRequest(
      `/api/locations/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(locationData),
      },
      isValidLocationData
    );
  },

  // Delete location
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiRequest(`/api/locations/${id}`, { method: 'DELETE' });
  },
};

// Shape API
export const shapeApi = {
  // Get all shapes
  async getAll(): Promise<ApiResponse<ShapeData[]>> {
    return apiRequest(
      '/api/shapes',
      { method: 'GET' },
      (data): data is ShapeData[] => isArrayOf(data, isValidShapeData)
    );
  },

  // Get shape by ID
  async getById(id: string): Promise<ApiResponse<ShapeData>> {
    return apiRequest(
      `/api/shapes/${id}`,
      { method: 'GET' },
      isValidShapeData
    );
  },

  // Create new shape
  async create(shapeData: Omit<ShapeData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ShapeData>> {
    return apiRequest(
      '/api/shapes',
      {
        method: 'POST',
        body: JSON.stringify(shapeData),
      },
      isValidShapeData
    );
  },

  // Update shape
  async update(id: string, shapeData: Partial<ShapeData>): Promise<ApiResponse<ShapeData>> {
    return apiRequest(
      `/api/shapes/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(shapeData),
      },
      isValidShapeData
    );
  },

  // Delete shape
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiRequest(`/api/shapes/${id}`, { method: 'DELETE' });
  },
};

// User API
export const userApi = {
  // Get current user
  async getCurrentUser(): Promise<ApiResponse<{ email: string; name?: string }>> {
    return apiRequest('/api/users/me', { method: 'GET' });
  },
};

// Utility functions for error handling
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof ValidationError) {
    return `Validation Error: ${error.errors.join(', ')}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}

// Retry mechanism for failed requests
export async function retryApiCall<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Don't retry for validation errors or 4xx errors
      if (error instanceof ValidationError || 
          (error instanceof ApiError && error.status && error.status >= 400 && error.status < 500)) {
        throw error;
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError;
}

// Batch operations
export const batchApi = {
  // Batch create locations
  async createLocations(locations: Omit<LocationData, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<ApiResponse<LocationData[]>> {
    return apiRequest(
      '/api/locations/batch',
      {
        method: 'POST',
        body: JSON.stringify({ locations }),
      },
      (data): data is LocationData[] => isArrayOf(data, isValidLocationData)
    );
  },

  // Batch delete locations
  async deleteLocations(ids: string[]): Promise<ApiResponse<void>> {
    return apiRequest(
      '/api/locations/batch',
      {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      }
    );
  },
}; 