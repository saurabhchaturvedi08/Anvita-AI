import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserProfile } from '../types';
import { apiClient } from '../lib/api';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('anvita-token');
      if (token) {
        const response = await apiClient.getCurrentUser();
        if (response.success && response.data) {
          setUser(response.data);
          await loadProfile();
        } else {
          localStorage.removeItem('anvita-token');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('anvita-token');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await apiClient.getUserProfile();
      if (response.success && response.data) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.login(email, password);
      if (response.success && response.data) {
        localStorage.setItem('anvita-token', response.data.token);
        setUser(response.data.user);
        await loadProfile();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const response = await apiClient.register(email, password, name);
      if (response.success && response.data) {
        localStorage.setItem('anvita-token', response.data.token);
        setUser(response.data.user);
        await loadProfile();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('anvita-token');
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const response = await apiClient.updateProfile(updates);
      if (response.success && response.data) {
        setUser(response.data);
        await loadProfile();
      }
    } catch (error) {
      console.error('Profile update failed:', error);
    }
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isLoading,
      isGuest: !user,
      login,
      register,
      logout,
      updateProfile,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}