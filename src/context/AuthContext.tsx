import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  signInWithGoogleEmail,
  signOutUser,
  syncUserProfile,
  consumeExportCredit,
  UserProfile,
  getUserSessionCookie,
  setUserSessionCookie,
} from '../lib/firebase.ts';

export interface AppUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  consumeCredit: () => Promise<UserProfile>;
  refreshProfile: () => Promise<void>;
  isLimitReached: boolean;
  remainingCredits: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize from session cookie/cache while Firebase auth boots
  useEffect(() => {
    const cached = getUserSessionCookie();
    if (cached && cached.id) {
      setProfile(cached as UserProfile);
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const prof = await syncUserProfile(fbUser);
          setProfile(prof);
        } catch (err) {
          console.error('Failed to sync user profile:', err);
        }
      } else {
        // Retain session profile if present (e.g. email sign in)
        const session = getUserSessionCookie();
        if (session && session.id) {
          setProfile(session as UserProfile);
        } else {
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isSigningInRef = React.useRef(false);

  const handleSignIn = async () => {
    if (isSigningInRef.current) return;
    isSigningInRef.current = true;
    try {
      const prof = await signInWithGoogle();
      setProfile(prof);
    } catch (err) {
      console.error('Sign-in failed:', err);
      throw err;
    } finally {
      isSigningInRef.current = false;
    }
  };

  const handleSignInWithEmail = async (email: string, displayName?: string) => {
    try {
      const prof = await signInWithGoogleEmail(email, displayName);
      setProfile(prof);
    } catch (err) {
      console.error('Email sign-in failed:', err);
      throw err;
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setFirebaseUser(null);
    setProfile(null);
    setUserSessionCookie(null);
  };

  const activeUser: AppUser | null = firebaseUser
    ? {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      }
    : profile
    ? {
        uid: profile.id,
        email: profile.email,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
      }
    : null;

  const handleConsumeCredit = async (): Promise<UserProfile> => {
    const targetUid = activeUser?.uid || profile?.id;
    if (!targetUid) {
      throw new Error('AUTH_REQUIRED');
    }
    const updated = await consumeExportCredit(targetUid);
    setProfile(updated);
    return updated;
  };

  const refreshProfile = async () => {
    if (firebaseUser) {
      const prof = await syncUserProfile(firebaseUser);
      setProfile(prof);
    } else {
      const cached = getUserSessionCookie();
      if (cached) setProfile(cached as UserProfile);
    }
  };

  const isLimitReached = Boolean(
    profile && profile.plan === 'free' && profile.freeCreditsUsed >= profile.freeCreditsMax
  );

  const remainingCredits = profile
    ? profile.plan === 'free'
      ? Math.max(0, profile.freeCreditsMax - profile.freeCreditsUsed)
      : 9999
    : 3;

  return (
    <AuthContext.Provider
      value={{
        user: activeUser,
        profile,
        loading,
        signIn: handleSignIn,
        signInWithEmail: handleSignInWithEmail,
        signOut: handleSignOut,
        consumeCredit: handleConsumeCredit,
        refreshProfile,
        isLimitReached,
        remainingCredits,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
