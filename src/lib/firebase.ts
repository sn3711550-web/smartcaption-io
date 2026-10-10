import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  getDocFromServer,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID (CRITICAL: Do not remove firestoreDatabaseId)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth & Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Firestore Error Handler conformant to FirestoreErrorInfo specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Boot test connection as required by skill guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore test connection: client is offline');
    }
  }
}
testConnection();

// User Profile Model
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  plan: 'free' | 'pro' | 'business';
  freeCreditsUsed: number;
  freeCreditsMax: number;
  totalExportsCount: number;
  createdAt: string;
  updatedAt: string;
}

// User Project Model
export interface SavedProject {
  id: string;
  userId: string;
  title: string;
  language: string;
  styleId: string;
  aspectRatio: '9:16' | '1:1' | '16:9' | '4:5';
  duration: number;
  segmentsCount: number;
  createdAt: string;
  updatedAt: string;
}

// Cookie Helper for User Session
const COOKIE_NAME = 'sc_user_session';

export function setUserSessionCookie(profile: UserProfile | null) {
  if (typeof document === 'undefined') return;
  if (!profile) {
    document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
    localStorage.removeItem(COOKIE_NAME);
    return;
  }
  try {
    const data = JSON.stringify({
      id: profile.id,
      email: profile.email,
      plan: profile.plan,
      freeCreditsUsed: profile.freeCreditsUsed,
      freeCreditsMax: profile.freeCreditsMax,
      updatedAt: profile.updatedAt,
    });
    // Set cookie for 30 days
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(data)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    localStorage.setItem(COOKIE_NAME, data);
  } catch {
    // ignore cookie parse error
  }
}

export function getUserSessionCookie(): Partial<UserProfile> | null {
  if (typeof document === 'undefined') return null;
  try {
    // Try localStorage first
    const local = localStorage.getItem(COOKIE_NAME);
    if (local) {
      return JSON.parse(local);
    }
    // Fallback to cookie
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${COOKIE_NAME}=`));
    if (match) {
      const val = decodeURIComponent(match.split('=')[1]);
      return JSON.parse(val);
    }
  } catch {
    return null;
  }
  return null;
}

// Sign In with Google Popup
export async function signInWithGoogle(): Promise<UserProfile> {
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    const fbUser = credential.user;
    return await syncUserProfile(fbUser);
  } catch (error: any) {
    const code = error?.code || '';
    const message = error?.message || '';
    console.error('Google Sign-In Error code:', code, message);

    if (code === 'auth/popup-blocked') {
      const err = new Error('POPUP_BLOCKED');
      (err as any).code = 'auth/popup-blocked';
      throw err;
    }
    if (code === 'auth/cancelled-popup-request') {
      const err = new Error('POPUP_INTERRUPTED');
      (err as any).code = 'auth/cancelled-popup-request';
      throw err;
    }
    if (code === 'auth/popup-closed-by-user') {
      const err = new Error('POPUP_CLOSED');
      (err as any).code = 'auth/popup-closed-by-user';
      throw err;
    }
    if (code === 'auth/unauthorized-domain') {
      const err = new Error('UNAUTHORIZED_DOMAIN');
      (err as any).code = 'auth/unauthorized-domain';
      throw err;
    }
    throw error;
  }
}

// Sign In with Google Email (Zero Popup Fallback)
export async function signInWithGoogleEmail(
  email: string,
  displayName?: string
): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    throw new Error('Please enter a valid Gmail or email address');
  }

  // Try Firebase Auth session if supported
  let fbUser = auth.currentUser;
  if (!fbUser) {
    try {
      const cred = await signInAnonymously(auth);
      fbUser = cred.user;
    } catch (anonErr) {
      console.warn('Anonymous auth not enabled in Firebase Console, using client session:', anonErr);
    }
  }

  const name = displayName || cleanEmail.split('@')[0];
  const stableId = fbUser?.uid || ('usr_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 24));
  const userRef = doc(db, 'users', stableId);
  const nowIso = new Date().toISOString();

  // Check if user previously had credit count in cookies
  const cached = getUserSessionCookie();
  const prevUsed =
    cached && cached.email === cleanEmail && typeof cached.freeCreditsUsed === 'number'
      ? cached.freeCreditsUsed
      : 0;

  let profile: UserProfile = {
    id: stableId,
    email: cleanEmail,
    displayName: name,
    photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=8b5cf6`,
    plan: cached?.plan || 'free',
    freeCreditsUsed: prevUsed,
    freeCreditsMax: 3,
    totalExportsCount: prevUsed,
    createdAt: cached?.createdAt || nowIso,
    updatedAt: nowIso,
  };

  try {
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as UserProfile;
      await updateDoc(userRef, {
        updatedAt: nowIso,
        displayName: name,
        email: cleanEmail,
      });
      profile = {
        ...data,
        displayName: name,
        email: cleanEmail,
        updatedAt: nowIso,
      };
    } else {
      await setDoc(userRef, profile);
    }
  } catch (firestoreErr) {
    console.warn('Firestore write skipped, maintaining local session:', firestoreErr);
  }

  setUserSessionCookie(profile);
  return profile;
}

// Sign Out
export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
  setUserSessionCookie(null);
}

// Fetch or create user record in Firestore
export async function syncUserProfile(fbUser: FirebaseUser): Promise<UserProfile> {
  const userRef = doc(db, 'users', fbUser.uid);
  const path = `users/${fbUser.uid}`;

  try {
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      const data = snapshot.data() as UserProfile;
      // Update last active timestamp
      const nowIso = new Date().toISOString();
      await updateDoc(userRef, {
        updatedAt: nowIso,
        displayName: fbUser.displayName || data.displayName || 'Creator',
        photoURL: fbUser.photoURL || data.photoURL || '',
      });
      const updatedProfile: UserProfile = {
        ...data,
        displayName: fbUser.displayName || data.displayName || 'Creator',
        photoURL: fbUser.photoURL || data.photoURL || '',
        updatedAt: nowIso,
      };
      setUserSessionCookie(updatedProfile);
      return updatedProfile;
    } else {
      // First time registration: provision initial 3 free credits
      const nowIso = new Date().toISOString();
      const newProfile: UserProfile = {
        id: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || 'Smart Caption Creator',
        photoURL: fbUser.photoURL || '',
        plan: 'free',
        freeCreditsUsed: 0,
        freeCreditsMax: 3,
        totalExportsCount: 0,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await setDoc(userRef, newProfile);
      setUserSessionCookie(newProfile);
      return newProfile;
    }
  } catch (error) {
    console.warn('Firestore sync skipped or permission denied, maintaining local session:', error);
    const nowIso = new Date().toISOString();
    const fallbackProfile: UserProfile = {
      id: fbUser.uid,
      email: fbUser.email || 'creator@smartcaption.ai',
      displayName: fbUser.displayName || 'Smart Caption Creator',
      photoURL:
        fbUser.photoURL ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fbUser.displayName || 'Creator')}&backgroundColor=8b5cf6`,
      plan: 'free',
      freeCreditsUsed: 0,
      freeCreditsMax: 3,
      totalExportsCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setUserSessionCookie(fallbackProfile);
    return fallbackProfile;
  }
}

// Consume 1 credit upon video export
export async function consumeExportCredit(userId: string): Promise<UserProfile> {
  const userRef = doc(db, 'users', userId);
  const path = `users/${userId}`;

  try {
    const snapshot = await getDoc(userRef);
    if (!snapshot.exists()) {
      throw new Error('User profile not found');
    }
    const current = snapshot.data() as UserProfile;

    // Check if free user has reached limit
    if (current.plan === 'free' && current.freeCreditsUsed >= current.freeCreditsMax) {
      throw new Error('LIMIT_REACHED');
    }

    const nowIso = new Date().toISOString();
    await updateDoc(userRef, {
      freeCreditsUsed: increment(1),
      totalExportsCount: increment(1),
      updatedAt: nowIso,
    });

    const updatedProfile: UserProfile = {
      ...current,
      freeCreditsUsed: current.freeCreditsUsed + 1,
      totalExportsCount: (current.totalExportsCount || 0) + 1,
      updatedAt: nowIso,
    };
    setUserSessionCookie(updatedProfile);
    return updatedProfile;
  } catch (error) {
    if (error instanceof Error && error.message === 'LIMIT_REACHED') {
      throw error;
    }
    // Fallback to local session cookie if Firestore write fails
    const cached = getUserSessionCookie();
    if (cached) {
      const used = (cached.freeCreditsUsed || 0) + 1;
      const max = cached.freeCreditsMax || 3;
      if (cached.plan === 'free' && used > max) {
        throw new Error('LIMIT_REACHED');
      }
      const updated: UserProfile = {
        id: userId,
        email: cached.email || '',
        displayName: cached.displayName || 'Creator',
        photoURL: cached.photoURL || '',
        plan: cached.plan || 'free',
        freeCreditsUsed: used,
        freeCreditsMax: max,
        totalExportsCount: used,
        createdAt: cached.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUserSessionCookie(updated);
      return updated;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Upgrade user plan (e.g. after Razorpay payment)
export async function upgradeUserPlan(
  userId: string,
  plan: 'pro' | 'business'
): Promise<UserProfile> {
  const userRef = doc(db, 'users', userId);
  const path = `users/${userId}`;

  try {
    const nowIso = new Date().toISOString();
    await updateDoc(userRef, {
      plan,
      updatedAt: nowIso,
    });

    const snapshot = await getDoc(userRef);
    const updated = snapshot.data() as UserProfile;
    setUserSessionCookie(updated);
    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Save project to history
export async function saveProjectToHistory(
  userId: string,
  project: Omit<SavedProject, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const projectRef = doc(db, 'users', userId, 'projects', project.id);
  const path = `users/${userId}/projects/${project.id}`;

  try {
    const nowIso = new Date().toISOString();
    await setDoc(projectRef, {
      ...project,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Fetch user projects
export async function getUserProjects(userId: string): Promise<SavedProject[]> {
  const colRef = collection(db, 'users', userId, 'projects');
  const path = `users/${userId}/projects`;

  try {
    const q = query(colRef, orderBy('updatedAt', 'desc'), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as SavedProject);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
