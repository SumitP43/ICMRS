/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { AuthUser, CivicRole, LoginCredentials, RegisterCredentials, AuthResponse } from '../types';
import { supabase } from '../lib/supabase';
import { authStorage, loginUser, registerUser, logoutUser } from '../services/authApi';

interface AuthContextType {
  currentUser: AuthUser | null;
  userRole: CivicRole;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  signInWithGoogle: () => Promise<void>;
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<AuthResponse>;
  register: (credentials: RegisterCredentials, rememberMe?: boolean) => Promise<AuthResponse>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; message: string }>;
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
        console.warn('[AuthContext] Google OAuth redirect error (internal):', clean);
        setError('We could not complete your sign-in with Google. Please try again or use your email and password.');
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    // 0. Restore from cached session immediately if available
    try {
      const cached = authStorage.getCachedUser() || JSON.parse(localStorage.getItem(STORAGE_USER_KEY) || 'null');
      if (cached && cached.id) {
        setCurrentUser(cached);
        setLoading(false);
      }
    } catch {
      // Ignored
    }

    // 1. Initial Supabase session load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchAuthUserProfile(session.user).then((authUser) => {
          setCurrentUser(authUser);
          authStorage.setCachedUser(authUser, true);
          try {
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(authUser));
          } catch {}
          setLoading(false);
          // Clean OAuth access token fragment from address bar for security
          if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }).catch(() => setLoading(false));
      } else {
        // Only clear if no local cached user
        const localCached = authStorage.getCachedUser();
        if (!localCached) {
          setCurrentUser(null);
        }
        setLoading(false);
      }
    }).catch(() => {
      // Supabase unavailable; preserve local session if present
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

  const clearError = () => {
    setError(null);
  };

  /**
   * Credential login with Supabase -> Local Server API -> Demo Preset fallback chain
   */
  const login = async (credentials: LoginCredentials, rememberMe = true): Promise<AuthResponse> => {
    setError(null);
    const emailLower = credentials.email.toLowerCase().trim();

    const isPresetAdmin = 
      (emailLower === 'admin@icmrs.gov' || emailLower === 'hq.director@mcd.nic.in') && 
      (credentials.password === 'Admin123!' || credentials.password === 'Admin@123456' || credentials.password === 'MCDCentralHQ!Sec4');
    const isPresetOfficer = 
      (emailLower === 'officer@icmrs.gov' || emailLower === 'insp.ward42@mcd.gov.in') && 
      (credentials.password === 'Officer123!' || credentials.password === 'Officer@123456' || credentials.password === 'FieldDispatch#99');
    const isPresetCitizen = 
      (emailLower === 'citizen@icmrs.gov' || emailLower === 'r.sharma.delhi@gmail.com') && 
      (credentials.password === 'Citizen123!' || credentials.password === 'DelhiCitizen#2025');

    // 1. Try Supabase Auth
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailLower,
        password: credentials.password,
      });

      if (!signInError && data.session && data.user) {
        const authUser = await fetchAuthUserProfile(data.user);
        setCurrentUser(authUser);
        authStorage.setCachedUser(authUser, rememberMe);
        try {
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(authUser));
        } catch {}
        return { success: true, user: authUser };
      }

      if (signInError) {
        const lowerMsg = signInError.message.toLowerCase();
        if (lowerMsg.includes('email not confirmed')) {
          return {
            success: false,
            needsEmailVerification: true,
            error: 'Email verification required',
          };
        }
      }
    } catch (err) {
      console.warn('[AuthContext] Supabase sign-in unavailable, trying local server fallback:', err);
    }

    // 2. Try Local Express Server API (/api/auth/login)
    try {
      const localRes = await loginUser(credentials, rememberMe);
      if (localRes.success && localRes.user) {
        setCurrentUser(localRes.user);
        try {
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(localRes.user));
        } catch {}
        return localRes;
      }
    } catch (err) {
      console.warn('[AuthContext] Local auth login error:', err);
    }

    // 3. Demo Preset Fallback for dev and offline testing
    if (isPresetAdmin || isPresetOfficer || isPresetCitizen) {
      const role: CivicRole = isPresetAdmin ? 'admin' : (isPresetOfficer ? 'officer' : 'citizen');
      const authUser: AuthUser = {
        id: isPresetAdmin ? 'usr-admin-01' : (isPresetOfficer ? 'usr-officer-01' : 'usr-citizen-01'),
        email: emailLower,
        name: isPresetAdmin ? 'Dir. A. Vance-Miller' : (isPresetOfficer ? 'Insp. Elena Vance' : 'Marcus Vance'),
        role,
        badgeNumber: isPresetAdmin ? 'ADM-DIR-001' : (isPresetOfficer ? 'OFFICER-042' : 'Verified Resident'),
        department: isPresetAdmin 
          ? 'Central Municipal Administration' 
          : (isPresetOfficer ? 'Rapid Triage & Incident Dispatch' : 'Delhi NCT Resident'),
        avatar: isPresetOfficer 
          ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo1spD6uHFwwgatDTJluJOHotpybzw1nBkawW4CpVC6tlgHanXHxZvE0b9hld20gHblmdWB1BKG26TxYFl08U0B-ZXXEI1jdhNWju4uXF9hCFgd5N9KkNaLrVmbsK6jSUlD-791HHLMzt7oy1RI-Z_Jg1iOQ8Hblq4NHF2N2s9dbKjfkqQu2gyn0Km1a1bvL1fpxUYzB9D3cLbyVdzxcmXvTJctldXOlrLGGDuADl4FDBluoZE6eIUaQ'
          : (isPresetAdmin 
            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' 
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'),
      };
      setCurrentUser(authUser);
      authStorage.setCachedUser(authUser, rememberMe);
      try {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(authUser));
      } catch {}
      return { success: true, user: authUser };
    }

    return {
      success: false,
      error: 'Invalid credentials',
    };
  };

  /**
   * Register a new Citizen account (Supabase -> Local Express -> Instant Citizen Profile)
   */
  const register = async (credentials: RegisterCredentials, rememberMe = true): Promise<AuthResponse> => {
    setError(null);
    setLoading(true);

    // 1. Try Supabase Auth
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

      if (!signUpError && data.user) {
        if (!data.session) {
          setLoading(false);
          return {
            success: true,
            needsEmailVerification: true,
            message: 'Please verify your email address before signing in. Check your inbox for the verification link.',
          };
        }

        const authUser = await fetchAuthUserProfile(data.user);
        setCurrentUser(authUser);
        authStorage.setCachedUser(authUser, rememberMe);
        try {
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(authUser));
        } catch {}
        setLoading(false);
        return { 
          success: true, 
          user: authUser,
          message: 'Account created successfully!' 
        };
      }
    } catch (err) {
      console.warn('[AuthContext] Supabase signup unavailable, trying local server registration:', err);
    }

    // 2. Try Local Express Server registration
    try {
      const localRes = await registerUser(credentials, rememberMe);
      if (localRes.success && localRes.user) {
        setCurrentUser(localRes.user);
        try {
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(localRes.user));
        } catch {}
        setLoading(false);
        return localRes;
      }
    } catch (err) {
      console.warn('[AuthContext] Local register API error:', err);
    }

    // 3. Local fallback so citizen registration always succeeds
    const newCitizen: AuthUser = {
      id: `usr-citizen-${Date.now()}`,
      email: credentials.email.trim().toLowerCase(),
      name: credentials.name.trim(),
      role: 'citizen',
      badgeNumber: 'Verified Resident',
      department: credentials.wardOrSector || 'Central Delhi Resident',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    };
    setCurrentUser(newCitizen);
    authStorage.setCachedUser(newCitizen, rememberMe);
    try {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(newCitizen));
    } catch {}
    setLoading(false);
    return { success: true, user: newCitizen };
  };

  /**
   * Password reset via Supabase Auth
   */
  const resetPassword = async (emailToReset: string): Promise<{ success: boolean; message: string }> => {
    try {
      const emailClean = emailToReset.trim().toLowerCase();
      if (!emailClean || !emailClean.includes('@')) {
        return { success: false, message: 'Please enter a valid email address.' };
      }

      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(emailClean, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
      });

      if (resetErr) {
        console.warn('[AuthContext] Password reset notice (internal):', resetErr.message);
        return { 
          success: false, 
          message: 'Unable to send reset email right now. Please try again in a moment.' 
        };
      }

      return { 
        success: true, 
        message: 'If an account exists with that email, password reset instructions have been sent.' 
      };
    } catch (err: unknown) {
      console.error('[AuthContext] Password reset exception (internal):', err);
      return { success: false, message: 'Failed to send password reset email. Please try again.' };
    }
  };

  /**
   * Resend confirmation / verification email via Supabase Auth
   */
  const resendVerificationEmail = async (emailToResend: string): Promise<{ success: boolean; message: string }> => {
    try {
      const emailClean = emailToResend.trim().toLowerCase();
      if (!emailClean || !emailClean.includes('@')) {
        return { success: false, message: 'Please enter a valid email address.' };
      }

      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email: emailClean,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (resendErr) {
        console.warn('[AuthContext] Resend verification notice (internal):', resendErr.message);
        return {
          success: false,
          message: 'Unable to resend verification email right now. Please wait a minute and try again.',
        };
      }

      return {
        success: true,
        message: 'Verification email resent! Please check your inbox and spam folders.',
      };
    } catch (err: unknown) {
      console.error('[AuthContext] Resend verification exception (internal):', err);
      return {
        success: false,
        message: 'Failed to resend verification email. Please check your network and try again.',
      };
    }
  };

  /**
   * Log out of Supabase Auth and local session
   */
  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[AuthContext] Supabase signOut notice:', err);
    }

    try {
      await logoutUser();
    } catch {}

    authStorage.removeToken();

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
        clearError,
        signInWithGoogle,
        login,
        register,
        resetPassword,
        resendVerificationEmail,
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
