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
import { authService } from '../services/auth.service';
import { usersService } from '../services/users.service';
import type { User } from '../models/User';

interface AuthContextValue {
  firebaseUser: FirebaseAuthUser | null;
  profile: User | null;
  loading: boolean;
  configured: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured());

  const refreshProfile = useCallback(async () => {
    const auth = getFirebaseAuth();
    const uid = auth?.currentUser?.uid;
    if (!uid) {
      setProfile(null);
      return;
    }
    setProfile(await usersService.getById(uid));
  }, []);

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
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setProfile(null);
    setFirebaseUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        loading,
        configured: isFirebaseConfigured(),
        refreshProfile,
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
