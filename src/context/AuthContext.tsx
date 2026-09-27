/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { AuthUser, CivicRole, LoginCredentials, RegisterCredentials, AuthResponse } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  currentUser: AuthUser | null;
  userRole: CivicRole;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<AuthResponse>;
  register: (credentials: RegisterCredentials, rememberMe?: boolean) => Promise<AuthResponse>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isOfficer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'dp7899899@gmail.com';
const STORAGE_USER_KEY = 'icmrs_current_user';

/**
 * Fetch and construct the enriched AuthUser from Supabase profiles table
 * Safely maps Google OAuth metadata (full_name, avatar_url, picture) and ensures public.profiles row exists.
 */
async function fetchAuthUserProfile(user: User): Promise<AuthUser> {
  const emailLower = (user.email || '').toLowerCase().trim();
  const isDefaultAdmin = emailLower === 'admin@icmrs.gov' || emailLower === ADMIN_EMAIL.toLowerCase();
  const isDefaultOfficer = emailLower === 'officer@icmrs.gov';

  let role: CivicRole = isDefaultAdmin ? 'admin' : (isDefaultOfficer ? 'officer' : 'citizen');
  let badgeNumber = isDefaultAdmin ? 'ADM-DIR-001' : (isDefaultOfficer ? 'OFFICER-042' : 'Verified Resident');
  let department = isDefaultAdmin 
    ? 'Central Municipal Administration' 
    : (isDefaultOfficer ? 'Rapid Triage & Incident Dispatch' : 'Delhi NCT Resident');

  // Extract name prioritizing Google OAuth metadata
  const metaName = user.user_metadata?.full_name || 
                   user.user_metadata?.name || 
                   user.user_metadata?.display_name || 
                   user.user_metadata?.user_name;
  let name = metaName || (isDefaultAdmin 
    ? 'Dir. A. Vance-Miller' 
    : (isDefaultOfficer 
      ? 'Insp. Elena Vance' 
      : (user.email ? user.email.split('@')[0] : 'Marcus Vance')));

  // Extract avatar prioritizing Google OAuth metadata (avatar_url / picture)
  const metaAvatar = user.user_metadata?.avatar_url || 
                     user.user_metadata?.picture || 
                     user.user_metadata?.avatar;
  let avatar = metaAvatar || (isDefaultOfficer 
    ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo1spD6uHFwwgatDTJluJOHotpybzw1nBkawW4CpVC6tlgHanXHxZvE0b9hld20gHblmdWB1BKG26TxYFl08U0B-ZXXEI1jdhNWju4uXF9hCFgd5N9KkNaLrVmbsK6jSUlD-791HHLMzt7oy1RI-Z_Jg1iOQ8Hblq4NHF2N2s9dbKjfkqQu2gyn0Km1a1bvL1fpxUYzB9D3cLbyVdzxcmXvTJctldXOlrLGGDuADl4FDBluoZE6eIUaQ'
    : (isDefaultAdmin 
      ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' 
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'));

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (data && !error) {
      if (data.role) role = isDefaultAdmin ? 'admin' : (data.role as CivicRole);
      if (data.name) name = data.name;
      if (data.badge_number) badgeNumber = data.badge_number;
      if (data.department) department = data.department;
      if (data.avatar) avatar = data.avatar;
    } else if (!data && !error) {
      // Profile does not exist yet (e.g. initial Google sign-in before trigger or in environments without active trigger)
      // Safely perform an idempotent upsert. The default role for new users is strictly 'citizen'.
      try {
        const newProfile = {
          id: user.id,
          email: user.email || '',
          name,
          avatar,
          role: isDefaultAdmin ? 'admin' : (isDefaultOfficer ? 'officer' : 'citizen'),
          department,
          badge_number: badgeNumber,
          updated_at: new Date().toISOString()
        };

        const { data: upserted } = await supabase
          .from('profiles')
          .upsert(newProfile, { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (upserted) {
          if (upserted.role) role = isDefaultAdmin ? 'admin' : (upserted.role as CivicRole);
          if (upserted.name) name = upserted.name;
          if (upserted.avatar) avatar = upserted.avatar;
        }
      } catch (upsertErr) {
        console.warn('[AuthContext] Profile idempotent sync notice (database trigger active):', upsertErr);
      }
    }
  } catch (err) {
    console.warn('[AuthContext] Profile lookup note:', err);
  }

  const authUser: AuthUser = {
    id: user.id,
    name,
    email: user.email || '',
    role,
    badgeNumber,
    department,
    avatar,
  };

  try {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(authUser));
  } catch {
    // Ignored
  }

  return authUser;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronize with Supabase Auth state changes & handle OAuth redirects
  useEffect(() => {
    // 0. Check for OAuth callback errors in URL
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      const params = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : search);
      const errorDesc = params.get('error_description');
      const oauthErr = params.get('error');
      if (errorDesc || oauthErr) {
        const clean = decodeURIComponent(errorDesc || oauthErr || 'Google authentication failed');
        console.warn('[AuthContext] Google OAuth redirect error:', clean);
        setError(`Google Sign-In: ${clean}`);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    // 1. Initial session load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchAuthUserProfile(session.user).then((authUser) => {
          setCurrentUser(authUser);
          setLoading(false);
          // Clean OAuth access token fragment from address bar for security
          if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }).catch(() => setLoading(false));
      } else {
        // No active Supabase Auth session
        setCurrentUser(null);
        try {
          localStorage.removeItem(STORAGE_USER_KEY);
        } catch {
          // Ignored
        }
        setLoading(false);
      }
    }).catch(() => {
      setCurrentUser(null);
      setLoading(false);
    });

    // 2. Realtime Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const authUser = await fetchAuthUserProfile(session.user);
        setCurrentUser(authUser);
        // Clean OAuth hash from URL
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else {
        setCurrentUser(null);
        try {
          localStorage.removeItem(STORAGE_USER_KEY);
        } catch {
          // Ignored
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Google Sign-in with Supabase Auth OAuth.
   * Redirects browser to Google's consent screen. Real session is processed on return.
   */
  const signInWithGoogle = async (): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error: oAuthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (oAuthError) throw oAuthError;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google authentication failed';
      console.error('[AuthContext] Google sign-in error:', err);
      setError(msg);
      setLoading(false);
      throw err;
    }
  };

  /**
   * Supabase credential login (with automatic real-account provision for demo presets)
   */
  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setError(null);
    const emailLower = credentials.email.toLowerCase().trim();

    const isPresetAdmin = emailLower === 'admin@icmrs.gov' && credentials.password === 'Admin123!';
    const isPresetOfficer = emailLower === 'officer@icmrs.gov' && credentials.password === 'Officer123!';
    const isPresetCitizen = emailLower === 'citizen@icmrs.gov' && credentials.password === 'Citizen123!';

    try {
      // 1. Authenticate with real Supabase Auth account
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailLower,
        password: credentials.password,
      });

      if (signInError) {
        // If demo account hasn't been created yet on Supabase Auth, register it automatically
        if ((isPresetAdmin || isPresetOfficer || isPresetCitizen) && 
            signInError.message.toLowerCase().includes('invalid login credentials')) {
          const role = isPresetAdmin ? 'admin' : (isPresetOfficer ? 'officer' : 'citizen');
          const name = isPresetAdmin ? 'Dir. A. Vance-Miller' : (isPresetOfficer ? 'Insp. Elena Vance' : 'Marcus Vance');
          const department = isPresetAdmin 
            ? 'Executive Oversight & Analytics' 
            : (isPresetOfficer ? 'Rapid Triage & Incident Dispatch' : 'Delhi NCT Resident');

          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: emailLower,
            password: credentials.password,
            options: {
              data: {
                name,
                role,
                department,
              },
            },
          });

          if (signUpData.session && signUpData.user && !signUpError) {
            const authUser = await fetchAuthUserProfile(signUpData.user);
            setCurrentUser(authUser);
            return { success: true, user: authUser };
          } else if (signUpData.user && !signUpError) {
            return {
              success: false,
              error: 'User created in Supabase Auth, but requires email confirmation before signing in. In Supabase Dashboard, toggle OFF "Confirm email" under Authentication -> Providers -> Email, or confirm the user in the Users tab.'
            };
          }
        }

        return { 
          success: false, 
          error: signInError.message || 'Invalid email or password. Please verify credentials.' 
        };
      }

      if (data.session && data.user) {
        const authUser = await fetchAuthUserProfile(data.user);
        setCurrentUser(authUser);
        return { success: true, user: authUser };
      } else if (data.user && !data.session) {
        return {
          success: false,
          error: 'Email address has not been confirmed yet. Please verify your email or disable "Confirm email" in Supabase settings.'
        };
      }
    } catch (err: unknown) {
      console.error('[AuthContext] Login error:', err);
      const msg = err instanceof Error ? err.message : 'Login failed';
      return { success: false, error: msg };
    }

    return { success: false, error: 'Authentication failed. Please verify credentials.' };
  };

  /**
   * Register a new Citizen account in Supabase Auth
   */
  const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    setError(null);
    setLoading(true);

    try {
      const emailLower = credentials.email.toLowerCase().trim();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailLower,
        password: credentials.password,
        options: {
          data: {
            name: credentials.name.trim(),
            role: 'citizen',
            wardOrSector: credentials.wardOrSector || 'District 04 Resident',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          },
        },
      });

      if (signUpError) {
        setLoading(false);
        return { success: false, error: signUpError.message };
      }

      if (data.user) {
        const authUser = await fetchAuthUserProfile(data.user);
        setCurrentUser(authUser);
        setLoading(false);
        return { 
          success: true, 
          user: authUser,
          message: data.session ? undefined : 'Registration successful! Check your email to confirm your account.' 
        };
      }
    } catch (err: unknown) {
      console.error('[AuthContext] Registration error:', err);
      setLoading(false);
      const msg = err instanceof Error ? err.message : 'Registration failed';
      return { success: false, error: msg };
    }

    setLoading(false);
    return { success: false, error: 'Registration failed. Please check network connection.' };
  };

  /**
   * Password reset via Supabase Auth
   */
  const resetPassword = async (emailToReset: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(emailToReset.trim(), {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
      });

      if (resetErr) {
        return { success: false, message: resetErr.message };
      }

      return { 
        success: true, 
        message: 'Password reset instructions have been sent to your email address.' 
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send password reset email. Please try again.';
      return { success: false, message: msg };
    }
  };

  /**
   * Log out of Supabase Auth
   */
  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[AuthContext] Supabase signOut notice:', err);
    }

    try {
      localStorage.removeItem(STORAGE_USER_KEY);
    } catch {
      // Ignored
    }

    setCurrentUser(null);
  };

  const userRole: CivicRole = currentUser?.role || 'citizen';
  const isAuthenticated = !!currentUser;
  const isAdmin = userRole === 'admin' || currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isOfficer = isAdmin || userRole === 'officer';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userRole,
        isAuthenticated,
        loading,
        error,
        signInWithGoogle,
        login,
        register,
        resetPassword,
        logout,
        isAdmin,
        isOfficer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
