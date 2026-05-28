import { Platform } from 'react-native';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig, isFirebaseConfigured } from '../config/firebase';

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;
let storage: FirebaseStorage | undefined;

function initAuth(firebaseApp: FirebaseApp): Auth {
  if (Platform.OS === 'web') {
    return getAuth(firebaseApp);
  }

  // Persistance Auth React Native (API présente au runtime Expo, absente des types web)
  try {
    const authMod = require('firebase/auth') as {
      initializeAuth: (
        app: FirebaseApp,
        opts: { persistence: unknown }
      ) => Auth;
      getReactNativePersistence: (storage: typeof AsyncStorage) => unknown;
      getAuth: (app: FirebaseApp) => Auth;
    };
    return authMod.initializeAuth(firebaseApp, {
      persistence: authMod.getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(firebaseApp);
  }
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  if (!app) {
    app = getApps().length
      ? getApps()[0]
      : initializeApp(firebaseConfig);
  }
  return app;
}

export function getDb(): Firestore | null {
  if (!isFirebaseConfigured()) return null;
  if (!db) {
    const firebaseApp = getFirebaseApp();
    if (!firebaseApp) return null;
    db = getFirestore(firebaseApp);
  }
  return db;
}

export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured()) return null;
  if (!auth) {
    const firebaseApp = getFirebaseApp();
    if (!firebaseApp) return null;
    auth = initAuth(firebaseApp);
  }
  return auth;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  if (!isFirebaseConfigured() || !firebaseConfig.storageBucket) return null;
  if (!storage) {
    const firebaseApp = getFirebaseApp();
    if (!firebaseApp) return null;
    storage = getStorage(firebaseApp);
  }
  return storage;
}
