"use client";

import React, { ReactNode } from 'react';
import { HeroUIProvider } from "@heroui/react";
import { LocationProvider } from './LocationContext';
import { MapProvider } from './MapContext';
import { FilterProvider } from './FilterContext';
import { ShapeProvider } from './ShapeContext';
import { AuthProvider } from './AuthContext';
import { SubscriptionProvider } from './SubscriptionContext';
import { LocationData, User } from '@/types';
import { useLocations } from './LocationContext';

interface AppProvidersProps {
  children: ReactNode;
  initialLocations?: LocationData[];
  initialUser?: User | null;
}

export function AppProviders({ 
  children, 
  initialLocations = [],
  initialUser = null 
}: AppProvidersProps) {
  return (
    <HeroUIProvider>
      <div className="dark">
        <AuthProvider initialUser={initialUser}>
          <SubscriptionProvider>
            <LocationProvider initialLocations={initialLocations}>
              <MapProvider>
                <ShapeProvider>
                  <LocationBasedFilterProvider>
                    {children}
                  </LocationBasedFilterProvider>
                </ShapeProvider>
              </MapProvider>
            </LocationProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </div>
    </HeroUIProvider>
  );
}

// Wrapper component to provide FilterProvider with locations from LocationContext
function LocationBasedFilterProvider({ children }: { children: ReactNode }) {
  const { locations } = useLocations();
  
  return (
    <FilterProvider locations={locations}>
      {children}
    </FilterProvider>
  );
}

// Export individual providers for flexibility
export {
  LocationProvider,
  MapProvider,
  FilterProvider,
  ShapeProvider,
  AuthProvider,
  SubscriptionProvider,
};

// Export custom hooks for easy access
export { useLocations } from './LocationContext';
export { useMap } from './MapContext';
export { useFilters } from './FilterContext';
export { useShapes } from './ShapeContext';
export { useAuth } from './AuthContext';
export { useSubscription } from './SubscriptionContext';

// Error boundary component for context errors
export class ContextErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Context error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-danger-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-danger-600 mb-4">
              Something went wrong
            </h2>
            <p className="text-danger-500 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-danger-600 text-white rounded hover:bg-danger-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 