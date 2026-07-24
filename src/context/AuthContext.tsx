import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { onAuthStateChanged, type User as FirebaseAuthUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseAuth, getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { authService, needsEmailVerification } from '../services/auth.service';
import { productLineMigrationService } from '../services/productLineMigration.service';
import { usersService } from '../services/users.service';
import { registerPushTokenIfPossible } from '../services/pushToken.service';
import {
  getActiveProductLineFromStorage,
  profileMatchesActiveLine,
} from '../utils/productLineAccess';
import { userFromFirestore } from '../lib/firestoreMappers';
import type { User } from '../models/User';
import { userStateStore } from '../core/state/userState.store';
import { playAuthGreeting } from '../services/authGreeting.controller';

interface AuthContextValue {
  firebaseUser: FirebaseAuthUser | null;
  profile: User | null;
  loading: boolean;
  configured: boolean;
  isAdmin: boolean;
  adminClaimLoading: boolean;
  needsEmailVerification: boolean;
  refreshProfile: () => Promise<void>;
  refreshFirebaseUser: () => Promise<boolean>;
  resendEmailVerification: () => Promise<void>;
  refreshAdminClaim: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured());
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminClaimLoading, setAdminClaimLoading] = useState(false);

  const refreshAdminClaim = useCallback(async () => {
    const auth = getFirebaseAuth();
    const user = auth?.currentUser;
    if (!user) {
      setIsAdmin(false);
      return false;
    }
    setAdminClaimLoading(true);
    try {
      const token = await user.getIdTokenResult(true);
      const admin = token.claims.admin === true;
      setIsAdmin(admin);
      return admin;
    } catch {
      setIsAdmin(false);
      return false;
    } finally {
      setAdminClaimLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const auth = getFirebaseAuth();
    const uid = auth?.currentUser?.uid;
    if (!uid) {
      setProfile(null);
      return;
    }
    const loaded = await usersService.getById(uid);
    if (!loaded) {
      setProfile(null);
      return;
    }
    setProfile(await productLineMigrationService.migrateUserIfNeeded(loaded));
    await refreshAdminClaim();
  }, [refreshAdminClaim]);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    let unsubProfile: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubProfile?.();
      unsubProfile = undefined;
      setFirebaseUser(user);
      if (user) {
        const loaded = await usersService.getById(user.uid);
        const migrated = loaded
          ? await productLineMigrationService.migrateUserIfNeeded(loaded)
          : null;
        const activeLine = await getActiveProductLineFromStorage();
        if (migrated && !profileMatchesActiveLine(migrated, activeLine)) {
          await authService.signOut();
          setProfile(null);
        } else {
          setProfile(migrated);
          if (migrated) void registerPushTokenIfPossible(user.uid);
          void refreshAdminClaim();

          const database = getDb();
          if (database && migrated) {
            unsubProfile = onSnapshot(
              doc(database, 'users', user.uid),
              async (snap) => {
                if (!snap.exists()) {
                  setProfile(null);
                  return;
                }
                const next = userFromFirestore(
                  snap.id,
                  snap.data() as Record<string, unknown>,
                );
                const migratedNext =
                  await productLineMigrationService.migrateUserIfNeeded(next);
                setProfile(migratedNext);
              },
              () => {
                /* keep last known profile on transient listener errors */
              },
            );
          }
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      unsubProfile?.();
      unsubscribe();
    };
  }, [refreshAdminClaim]);

  const refreshFirebaseUser = useCallback(async () => {
    const user = await authService.reloadAuthUser();
    if (user) {
      setFirebaseUser(user);
      if (user.emailVerified && user.uid) {
        await authService.syncEmailVerifiedToProfile(user.uid, true);
        await refreshProfile();
      }
      return user.emailVerified;
    }
    return false;
  }, [refreshProfile]);

  const resendEmailVerification = useCallback(async () => {
    await authService.resendEmailVerification();
  }, []);

  const signOut = useCallback(async () => {
    const name = profile?.display_name;
    if (name) {
      await playAuthGreeting('goodbye', name);
    }
    await authService.signOut();
    userStateStore.reset();
    setProfile(null);
    setFirebaseUser(null);
    setIsAdmin(false);
  }, [profile]);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        loading,
        configured: isFirebaseConfigured(),
        isAdmin,
        adminClaimLoading,
        needsEmailVerification: needsEmailVerification(firebaseUser, profile?.email),
        refreshProfile,
        refreshFirebaseUser,
        resendEmailVerification,
        refreshAdminClaim,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
