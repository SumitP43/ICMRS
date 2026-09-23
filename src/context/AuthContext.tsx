/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, CivicRole, LoginCredentials, RegisterCredentials, AuthResponse } from '../types';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  fbSignOut, 
  onAuthStateChanged,
  doc, 
  getDoc, 
  setDoc,
  type FirebaseUser 
} from '../lib/firebase';

interface AuthContextType {
  currentUser: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  userRole: CivicRole;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<AuthUser>;
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
const STORAGE_TOKEN_KEY = 'icmrs_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to convert Firebase User + Firestore doc into AuthUser
  const buildAuthUserFromFirebase = async (fbUser: FirebaseUser): Promise<AuthUser> => {
    const email = (fbUser.email || '').toLowerCase().trim();
    const isBootstrappedAdmin = email === ADMIN_EMAIL.toLowerCase();

    let role: CivicRole = isBootstrappedAdmin ? 'admin' : 'citizen';
    let badgeNumber = isBootstrappedAdmin ? 'ADM-DIR-001' : 'Verified Resident';
    let department = isBootstrappedAdmin ? 'Central Municipal Administration' : 'Delhi NCT Resident';

    // Fetch or create profile from Firestore `/users/{uid}`
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const snapshot = await getDoc(userRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.role && (data.role === 'admin' || data.role === 'officer' || data.role === 'citizen')) {
          role = isBootstrappedAdmin ? 'admin' : (data.role as CivicRole);
        }
        if (data.badgeNumber) badgeNumber = data.badgeNumber;
        if (data.department) department = data.department;
      } else {
        // Create initial user document in Firestore
        const now = new Date().toISOString();
        const profileData = {
          id: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName || 'Google Verified Citizen',
          role,
          badgeNumber,
          department,
          avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(userRef, profileData);
      }
    } catch (e) {
      console.warn('[AuthContext] Firestore profile sync notice:', e);
    }

    return {
      id: fbUser.uid,
      name: fbUser.displayName || (isBootstrappedAdmin ? 'Administrator (Google Verified)' : 'Google Verified Citizen'),
      email: fbUser.email || '',
      role,
      badgeNumber,
      department,
      avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    };
  };

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const authUser = await buildAuthUserFromFirebase(fbUser);
          setCurrentUser(authUser);
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(authUser));
        } catch (err) {
          console.error('[AuthContext] Failed to load Firebase profile:', err);
        } finally {
          setLoading(false);
        }
      } else {
        // Check if there's a stored session (e.g. municipal demo credentials)
        try {
          const stored = localStorage.getItem(STORAGE_USER_KEY);
          if (stored) {
            const user = JSON.parse(stored);
            setCurrentUser(user);
          } else {
            setCurrentUser(null);
          }
        } catch {
          setCurrentUser(null);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Google Sign-in with Firebase Auth
   */
  const signInWithGoogle = async (): Promise<AuthUser> => {
    setError(null);
    setLoading(true);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const fbUser = credential.user;
      setFirebaseUser(fbUser);

      const authUser = await buildAuthUserFromFirebase(fbUser);
      setCurrentUser(authUser);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(authUser));
      setLoading(false);
      return authUser;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      console.error('[AuthContext] Google sign-in error:', err);
      setError(msg);
      setLoading(false);
      throw err;
    }
  };

  /**
   * Municipal and Firebase credential login (supporting Google, Firebase Email/Password, demo accounts, and backend API)
   */
  const login = async (credentials: LoginCredentials, rememberMe: boolean = false): Promise<AuthResponse> => {
    setError(null);
    const emailLower = credentials.email.toLowerCase().trim();

    // 1. Rapid testing municipal preset accounts
    const isPresetAdmin = emailLower === 'admin@icmrs.gov' && credentials.password === 'Admin123!';
    const isPresetOfficer = emailLower === 'officer@icmrs.gov' && credentials.password === 'Officer123!';
    const isPresetCitizen = emailLower === 'citizen@icmrs.gov' && credentials.password === 'Citizen123!';

    if (isPresetAdmin || isPresetOfficer || isPresetCitizen) {
      let matchedUser: AuthUser;
      if (isPresetAdmin) {
        matchedUser = {
          id: 'usr-admin-01',
          name: 'Dir. A. Vance-Miller',
          email: 'admin@icmrs.gov',
          role: 'admin',
          badgeNumber: 'ADM-DIR-001',
          department: 'Executive Oversight & Analytics',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        };
      } else if (isPresetOfficer) {
        matchedUser = {
          id: 'usr-officer-01',
          name: 'Insp. Elena Vance',
          email: 'officer@icmrs.gov',
          role: 'officer',
          badgeNumber: 'OFFICER-042',
          department: 'Rapid Triage & Incident Dispatch',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo1spD6uHFwwgatDTJluJOHotpybzw1nBkawW4CpVC6tlgHanXHxZvE0b9hld20gHblmdWB1BKG26TxYFl08U0B-ZXXEI1jdhNWju4uXF9hCFgd5N9KkNaLrVmbsK6jSUlD-791HHLMzt7oy1RI-Z_Jg1iOQ8Hblq4NHF2N2s9dbKjfkqQu2gyn0Km1a1bvL1fpxUYzB9D3cLbyVdzxcmXvTJctldXOlrLGGDuADl4FDBluoZE6eIUaQ',
        };
      } else {
        matchedUser = {
          id: 'usr-citizen-demo',
          name: 'Marcus Vance',
          email: 'citizen@icmrs.gov',
          role: 'citizen',
          badgeNumber: 'Verified Resident',
          department: 'Delhi NCT Resident',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        };
      }

      setCurrentUser(matchedUser);
      if (rememberMe) {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(matchedUser));
      }
      return { success: true, user: matchedUser };
    }

    // 2. Attempt direct Firebase Email & Password authentication
    try {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email.trim(), credentials.password);
      if (userCredential.user) {
        setFirebaseUser(userCredential.user);
        const authUser = await buildAuthUserFromFirebase(userCredential.user);
        setCurrentUser(authUser);
        if (rememberMe) {
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(authUser));
        }
        return { success: true, user: authUser };
      }
    } catch (fbAuthErr: unknown) {
      const fbErr = fbAuthErr as { code?: string; message?: string };
      console.warn('[AuthContext] Firebase email/password sign-in notice:', fbErr?.code || fbErr);

      // If user not found in Firebase, check backend server database
      if (fbErr?.code === 'auth/wrong-password' || fbErr?.code === 'auth/invalid-credential') {
        // Continue to check backend in case registered on local backend
      }
    }

    // 3. Backend API authentication check
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          const authUser: AuthUser = {
            ...data.user,
            role: (emailLower === ADMIN_EMAIL.toLowerCase() ? 'admin' : data.user.role) as CivicRole,
          };
          setCurrentUser(authUser);
          if (rememberMe) {
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(authUser));
            if (data.token) localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
          }
          return { success: true, user: authUser };
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        if (errData.error) {
          return { success: false, error: errData.error };
        }
      }
    } catch (apiErr) {
      console.warn('[AuthContext] Backend API login notice:', apiErr);
    }

    // Default error message for invalid credentials
    return { 
      success: false, 
      error: 'Invalid email or password. Please verify your credentials or sign in with Google.' 
    };
  };

  /**
   * Register a new Citizen account (Firebase Auth + Firestore + Backend)
   */
  const register = async (credentials: RegisterCredentials, rememberMe: boolean = true): Promise<AuthResponse> => {
    setError(null);
    setLoading(true);

    let fbUser: FirebaseUser | null = null;

    // 1. Try Firebase Authentication user creation
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        credentials.email.trim(), 
        credentials.password
      );
      fbUser = userCredential.user;

      if (fbUser) {
        try {
          await updateProfile(fbUser, { displayName: credentials.name.trim() });
        } catch (pErr) {
          console.warn('[AuthContext] updateProfile notice:', pErr);
        }

        // Save user profile record in Firestore `users/{uid}`
        try {
          const userRef = doc(db, 'users', fbUser.uid);
          const now = new Date().toISOString();
          await setDoc(userRef, {
            id: fbUser.uid,
            email: credentials.email.trim().toLowerCase(),
            name: credentials.name.trim(),
            role: 'citizen',
            badgeNumber: 'Verified Resident',
            department: credentials.wardOrSector || 'Delhi NCT Resident',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            createdAt: now,
            updatedAt: now,
          });
        } catch (fsErr) {
          console.warn('[AuthContext] Firestore profile creation notice:', fsErr);
        }
      }
    } catch (fbErr: unknown) {
      const err = fbErr as { code?: string; message?: string };
      if (err?.code === 'auth/email-already-in-use') {
        setLoading(false);
        return {
          success: false,
          error: 'An account with this email address already exists. Please sign in instead.'
        };
      }
      if (err?.code === 'auth/weak-password') {
        setLoading(false);
        return {
          success: false,
          error: 'Password should be at least 6 characters long.'
        };
      }
      console.warn('[AuthContext] Firebase user creation notice, falling back to server:', err?.code || err);
    }

    // 2. Also register on backend /api/auth/register for full stack session synchronization
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        const newUser: AuthUser = fbUser ? await buildAuthUserFromFirebase(fbUser) : data.user;
        setCurrentUser(newUser);
        if (rememberMe) {
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(newUser));
          if (data.token) localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
        }
        setLoading(false);
        return { success: true, user: newUser, token: data.token };
      }
    } catch (err) {
      console.warn('[AuthContext] Registration API notice, using authenticated profile:', err);
    }

    // Fallback user construction
    const fallbackUser: AuthUser = fbUser 
      ? await buildAuthUserFromFirebase(fbUser)
      : {
          id: `usr-citizen-${Date.now()}`,
          name: credentials.name.trim(),
          email: credentials.email.trim().toLowerCase(),
          role: 'citizen',
          badgeNumber: 'Verified Resident',
          department: credentials.wardOrSector || 'Delhi NCT Resident',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        };

    setCurrentUser(fallbackUser);
    if (rememberMe) {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(fallbackUser));
    }
    setLoading(false);
    return { success: true, user: fallbackUser };
  };

  /**
   * Password reset using Firebase Auth
   */
  const resetPassword = async (emailToReset: string): Promise<{ success: boolean; message: string }> => {
    try {
      await sendPasswordResetEmail(auth, emailToReset.trim());
      return { 
        success: true, 
        message: 'Password reset instructions have been sent to your email address.' 
      };
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      let msg = 'Failed to send password reset email. Please try again.';
      if (error?.code === 'auth/user-not-found') {
        msg = 'No registered user found with this email address.';
      } else if (error?.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (error?.message) {
        msg = error.message;
      }
      return { success: false, message: msg };
    }
  };

  /**
   * Log out and clear session from Firebase and local state
   */
  const logout = async (): Promise<void> => {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn('[AuthContext] Firebase signOut notice:', err);
    }

    try {
      const token = localStorage.getItem(STORAGE_TOKEN_KEY);
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Ignored
    }

    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    setCurrentUser(null);
    setFirebaseUser(null);
  };

  const userRole: CivicRole = currentUser?.role || 'citizen';
  const isAuthenticated = !!currentUser;
  const isAdmin = userRole === 'admin' || currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isOfficer = isAdmin || userRole === 'officer';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
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
