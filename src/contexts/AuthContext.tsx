"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { userApi, handleApiError } from '@/utils/apiClient';

// State interface
interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Context interface
interface AuthContextType {
  // State
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  
  // Utilities
  getUserName: () => string;
  getUserEmail: () => string;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: initialUser,
    loading: false,
    error: null,
    isAuthenticated: !!initialUser,
  });

  // Get current user from API
  const getCurrentUser = async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const response = await userApi.getCurrentUser();
      
      if (response.success && response.data) {
        const user: User = {
          id: 'current-user', // You might get this from the API
          email: response.data.email,
          name: response.data.name,
        };
        
        setState(prev => ({
          ...prev,
          user,
          loading: false,
          error: null,
          isAuthenticated: true,
        }));
      } else {
        throw new Error(response.error || 'Failed to get user');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
        error: errorMessage,
        isAuthenticated: false,
      }));
    }
  };

  // Login (this would typically call your auth API)
  const login = async (email: string, password: string): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      // This would be replaced with your actual login API call
      // For now, just simulate successful login
      const user: User = {
        id: 'user-' + Date.now(),
        email,
        name: email.split('@')[0],
      };
      
      setState(prev => ({
        ...prev,
        user,
        loading: false,
        error: null,
        isAuthenticated: true,
      }));
      
      return true;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
        error: errorMessage,
        isAuthenticated: false,
      }));
      return false;
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      // This would call your logout API
      setState({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  };

  // Clear error
  const clearError = (): void => {
    setState(prev => ({ ...prev, error: null }));
  };

  // Utilities
  const getUserName = (): string => {
    return state.user?.name || state.user?.email?.split('@')[0] || 'User';
  };

  const getUserEmail = (): string => {
    return state.user?.email || '';
  };

  // Check auth status on mount
  useEffect(() => {
    if (!initialUser) {
      getCurrentUser();
    }
  }, []);

  const contextValue: AuthContextType = {
    // State
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: state.isAuthenticated,
    
    // Actions
    login,
    logout,
    getCurrentUser,
    clearError,
    
    // Utilities
    getUserName,
    getUserEmail,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 