import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { onAuthStateChanged, type User as FirebaseAuthUser } from 'firebase/auth';
import { getFirebaseAuth } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { authService, needsEmailVerification } from '../services/auth.service';
import { usersService } from '../services/users.service';
import { registerPushTokenIfPossible } from '../services/pushToken.service';
import type { User } from '../models/User';

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
    setProfile(await usersService.getById(uid));
    await refreshAdminClaim();
  }, [refreshAdminClaim]);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setProfile(await usersService.getById(user.uid));
        void registerPushTokenIfPossible(user.uid);
        void refreshAdminClaim();
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
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
    await authService.signOut();
    setProfile(null);
    setFirebaseUser(null);
    setIsAdmin(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        loading,
        configured: isFirebaseConfigured(),
        isAdmin,
        adminClaimLoading,
        needsEmailVerification: needsEmailVerification(firebaseUser),
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
