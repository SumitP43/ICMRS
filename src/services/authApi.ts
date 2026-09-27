/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthResponse, AuthUser, LoginCredentials } from '../types';

const TOKEN_KEY = 'icmrs_auth_token';
const USER_CACHE_KEY = 'icmrs_auth_user';

export const authStorage = {
  getToken(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken(token: string, persist = false): void {
    try {
      if (persist) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        sessionStorage.setItem(TOKEN_KEY, token);
      }
    } catch (err) {
      console.warn('Unable to persist auth token:', err);
    }
  },

  removeToken(): void {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_CACHE_KEY);
      localStorage.removeItem(USER_CACHE_KEY);
    } catch (err) {
      console.warn('Unable to clear auth storage:', err);
    }
  },

  getCachedUser(): AuthUser | null {
    try {
      const raw = sessionStorage.getItem(USER_CACHE_KEY) || localStorage.getItem(USER_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setCachedUser(user: AuthUser, persist = false): void {
    try {
      const str = JSON.stringify(user);
      if (persist) {
        localStorage.setItem(USER_CACHE_KEY, str);
      } else {
        sessionStorage.setItem(USER_CACHE_KEY, str);
      }
    } catch (err) {
      console.warn('Unable to cache user:', err);
    }
  }
};

export async function loginUser(credentials: LoginCredentials, rememberMe = false): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email.trim(),
        password: credentials.password,
      }),
    });

    const data: AuthResponse = await res.json();

    if (res.ok && data.success && data.token && data.user) {
      authStorage.setToken(data.token, rememberMe);
      authStorage.setCachedUser(data.user, rememberMe);
      return data;
    }

    return {
      success: false,
      error: data.error || 'Authentication failed. Please verify your credentials.',
    };
  } catch (err) {
    console.error('API login error:', err);
    return {
      success: false,
      error: 'Network connection failure. Please check your connection and try again.',
    };
  }
}

export async function fetchCurrentUser(): Promise<AuthResponse> {
  const token = authStorage.getToken();
  if (!token) {
    return { success: false, error: 'No active session token found.' };
  }

  try {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      authStorage.removeToken();
      return { success: false, error: 'Session expired or invalidated.' };
    }

    const data: AuthResponse = await res.json();
    if (res.ok && data.success && data.user) {
      authStorage.setCachedUser(data.user);
      return data;
    }

    return {
      success: false,
      error: data.error || 'Failed to authenticate user profile.',
    };
  } catch (err) {
    console.warn('Failed to fetch current user session from API:', err);
    const cached = authStorage.getCachedUser();
    if (cached) {
      return { success: true, user: cached, token };
    }
    return { success: false, error: 'Connection failure verifying session.' };
  }
}

export async function logoutUser(): Promise<void> {
  const token = authStorage.getToken();
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.warn('Logout API notification error:', err);
    }
  }
  authStorage.removeToken();
}
