/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, CivicRole, LoginCredentials, AuthResponse } from '../types';
import { fetchCurrentUser, loginUser, logoutUser } from '../services/authApi';

interface AuthContextType {
  currentUser: AuthUser | null;
  userRole: CivicRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  hasRole: (roles: CivicRole | CivicRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Hydrate session on initial app mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const res = await fetchCurrentUser();
        if (isMounted && res.success && res.user) {
          setCurrentUser(res.user);
        }
      } catch (err) {
        console.warn('Initial session hydration failed:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials, rememberMe = false): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const res = await loginUser(credentials, rememberMe);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, error: res.error || 'Invalid credentials.' };
    } catch (err) {
      console.error('Login action error:', err);
      return { success: false, error: 'An unexpected authentication error occurred.' };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await logoutUser();
    } finally {
      setCurrentUser(null);
      setLoading(false);
    }
  }, []);

  const hasRole = useCallback((roles: CivicRole | CivicRole[]): boolean => {
    if (!currentUser) return false;
    if (Array.isArray(roles)) {
      return roles.includes(currentUser.role);
    }
    return currentUser.role === roles;
  }, [currentUser]);

  const value: AuthContextType = {
    currentUser,
    userRole: currentUser ? currentUser.role : null,
    isAuthenticated: !!currentUser,
    loading,
    login,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
