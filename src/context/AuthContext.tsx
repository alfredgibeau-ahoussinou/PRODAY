import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRODUCT_LINE_STORAGE_KEY } from '../models/ProductLine';
import {
  getActiveProductLineFromStorage,
  getUserProductLine,
  profileMatchesActiveLine,
} from '../utils/productLineAccess';
import { isPlatformAdminEmail } from '../config/admin';
import { userFromFirestore } from '../lib/firestoreMappers';
import type { User } from '../models/User';
import { userStateStore } from '../core/state/userState.store';
import { playAuthGreeting } from '../services/authGreeting.controller';
import {
  onboardingAccountService,
  type AppAccountResolutionState,
} from '../services/onboardingAccount.service';
import {
  classifyAccountType,
  type AccountType,
  type AccountTypeClassification,
} from '../domain/accountType';
import { saveAccountType } from '../services/accountType.service';

interface AuthContextValue {
  firebaseUser: FirebaseAuthUser | null;
  profile: User | null;
  loading: boolean;
  configured: boolean;
  isAdmin: boolean;
  adminClaimLoading: boolean;
  needsEmailVerification: boolean;
  sessionChecking: boolean;
  profileLoading: boolean;
  profileError: Error | null;
  accountResolutionState: AppAccountResolutionState;
  /**
   * Type de compte canonique, ou `null` tant qu'il n'est pas determine.
   * Seul point d'entree : aucun composant ne lit `role` pour le profil.
   */
  accountType: AccountType | null;
  /** `true` quand aucune donnee ne permet de deduire le type : question unique. */
  needsAccountTypeChoice: boolean;
  /** Valeur legacy observee, pour le diagnostic uniquement. */
  accountTypeLegacyValue: string | null;
  /** Ecrit le type choisi, purge le cache local et recharge le profil. */
  chooseAccountType: (accountType: AccountType) => Promise<void>;
  retryLoadProfile: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshFirebaseUser: () => Promise<boolean>;
  resendEmailVerification: () => Promise<void>;
  refreshAdminClaim: () => Promise<boolean>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured());
  const [sessionChecking, setSessionChecking] = useState(isFirebaseConfigured());
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<Error | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminClaimLoading, setAdminClaimLoading] = useState(false);

  const isInitialAuthRef = useRef(true);
  const prevUidRef = useRef<string | null>(null);

  /**
   * Lit le claim `admin`.
   *
   * Deux temps, volontairement :
   *
   *  1. `getIdTokenResult()` sans argument lit le jeton **en cache**. C'est
   *     instantané et local, donc la décision de coquille n'attend pas le
   *     réseau — sinon un administrateur dont le claim n'est pas encore dans
   *     son jeton verrait l'app joueur s'afficher avant l'Admin (un « flash de
   *     page interdite », exactement ce qu'on cherche à supprimer).
   *  2. Le rafraîchissement forcé part **en tâche de fond**. Il sert à
   *     récupérer un claim posé récemment (`adminSetUserRole`), pas à deciding
   *     quoi afficher au premier rendu.
   *
   * La lecture reste une commodité d'affichage : toute autorisation réelle est
   * revérifiée côté serveur (règles Firestore, callables), qui relit le rôle
   * depuis la base et non depuis le jeton du client.
   */
  const refreshAdminClaim = useCallback(async () => {
    const auth = getFirebaseAuth();
    const user = auth?.currentUser;
    if (!user) {
      setIsAdmin(false);
      setAdminClaimLoading(false);
      return false;
    }
    setAdminClaimLoading(true);
    try {
      const cached = await user.getIdTokenResult();
      const admin = cached.claims.admin === true;
      setIsAdmin(admin);
      setAdminClaimLoading(false);

      void user
        .getIdTokenResult(true)
        .then((fresh) => {
          const nextAdmin = fresh.claims.admin === true;
          setIsAdmin((prev) => (prev === nextAdmin ? prev : nextAdmin));
        })
        .catch(() => {
          /* le cache suffit : on ne casse pas l affichage sur un echec reseau */
        });

      return admin;
    } catch {
      setIsAdmin(false);
      setAdminClaimLoading(false);
      return false;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const auth = getFirebaseAuth();
    const currentUser = auth?.currentUser;
    const uid = currentUser?.uid;
    if (!uid) {
      setProfile(null);
      setProfileError(null);
      return;
    }
    setProfileLoading(true);
    try {
      const loaded = await usersService.getById(uid);
      let effectiveUser = loaded;
      if (!effectiveUser && currentUser.email && isPlatformAdminEmail(currentUser.email)) {
        effectiveUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          display_name: currentUser.displayName || 'Administrateur ProDay',
          role: 'coach',
          is_admin: true,
          email_verified: true,
          onboarding_documents_submitted: true,
          is_verified: true,
          verification_status: 'VERIFIED',
          profile: {},
          documents: [],
          created_at: new Date(),
          updated_at: new Date(),
          is_active: true,
          product_line: 'pro',
        };
      }
      if (!effectiveUser) {
        setProfile(null);
        setProfileError(null);
        return;
      }
      setProfile(await productLineMigrationService.migrateUserIfNeeded(effectiveUser));
      setProfileError(null);
      await refreshAdminClaim();
    } catch (err) {
      setProfileError(err as Error);
    } finally {
      setProfileLoading(false);
    }
  }, [refreshAdminClaim]);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      setSessionChecking(false);
      return;
    }

    let unsubProfile: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubProfile?.();
      unsubProfile = undefined;
      setFirebaseUser(user);
      if (user) {
        const isFreshLogin = !isInitialAuthRef.current && prevUidRef.current !== user.uid;
        prevUidRef.current = user.uid;
        isInitialAuthRef.current = false;

        void import('../services/revenueCat.service').then(({ revenueCatService }) => {
          if (revenueCatService.isAvailable()) {
            void revenueCatService.identify(user.uid);
          }
        });

        setProfileLoading(true);
        setProfileError(null);
        try {
          const loaded = await usersService.getById(user.uid);
          let effectiveUser = loaded;
          if (!effectiveUser && user.email && isPlatformAdminEmail(user.email)) {
            effectiveUser = {
              uid: user.uid,
              email: user.email,
              display_name: user.displayName || 'Administrateur ProDay',
              role: 'coach',
              is_admin: true,
              email_verified: true,
              onboarding_documents_submitted: true,
              is_verified: true,
              verification_status: 'VERIFIED',
              profile: {},
              documents: [],
              created_at: new Date(),
              updated_at: new Date(),
              is_active: true,
              product_line: 'pro',
            };
          }
          const migrated = effectiveUser
            ? await productLineMigrationService.migrateUserIfNeeded(effectiveUser)
            : null;
          const activeLine = await getActiveProductLineFromStorage();
          if (migrated) {
            const userLine = getUserProductLine(migrated);
            if (!profileMatchesActiveLine(migrated, activeLine)) {
              await AsyncStorage.setItem(PRODUCT_LINE_STORAGE_KEY, userLine);
            }
          }
          setProfile(migrated);
          setProfileError(null);
          if (migrated) void registerPushTokenIfPossible(user.uid);
          void refreshAdminClaim();

          if (isFreshLogin) {
            void playAuthGreeting('welcome', migrated?.display_name || user.displayName || '');
          }

          const database = getDb();
          if (database && migrated) {
            unsubProfile = onSnapshot(
              doc(database, 'users', user.uid),
              async (snap) => {
                if (!snap.exists()) {
                  if (user.email && isPlatformAdminEmail(user.email)) {
                    // Ne jamais effacer le profil d'un admin plateforme si son document Firestore est absent ou en cours d'écriture
                    return;
                  }
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
        } catch (err) {
          // Une erreur réseau n'est pas un profil absent.
          //
          // Le code faisait `setProfile(null)` ici, alors que le commentaire
          // affirmait le contraire. Conséquence réelle : un simple hoquet de
          // réseau au demarrage faisait tomber `profile` a null, et `App.tsx`
          // — qui teste `!profile` — renvoyait l'utilisateur vers l'écran de
          // connexion alors qu'il etait authentifie. C'etait une mauvaise
          // redirection produite par un echec transitoire.
          //
          // On conserve donc le dernier profil connu et on expose l'erreur via
          // `profileError` / `accountResolutionState`. Un compte qui n'a
          // jamais eu de profil garde `null`, ce qui est correct : dans ce cas
          // la lecture n'a pas echoue, elle n'a rien trouve.
          setProfileError(err as Error);
        } finally {
          setProfileLoading(false);
          setLoading(false);
          setSessionChecking(false);
        }
      } else {
        prevUidRef.current = null;
        isInitialAuthRef.current = false;
        void import('../services/revenueCat.service').then(({ revenueCatService }) => {
          void revenueCatService.logOut();
        });
        setProfile(null);
        setProfileError(null);
        setIsAdmin(false);
        setProfileLoading(false);
        setLoading(false);
        setSessionChecking(false);
      }
    });

    return () => {
      unsubProfile?.();
      unsubscribe();
    };
  }, [refreshAdminClaim]);

  const retryLoadProfile = useCallback(async () => {
    const auth = getFirebaseAuth();
    const uid = firebaseUser?.uid ?? auth?.currentUser?.uid;
    if (!uid) {
      setProfileError(null);
      return;
    }
    setProfileLoading(true);
    setProfileError(null);
    try {
      const loaded = await usersService.getById(uid);
      const migrated = loaded
        ? await productLineMigrationService.migrateUserIfNeeded(loaded)
        : null;
      setProfile(migrated);
      setProfileError(null);
      await refreshAdminClaim();
    } catch (err) {
      setProfileError(err as Error);
    } finally {
      setProfileLoading(false);
    }
  }, [firebaseUser, refreshAdminClaim]);

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
    await playAuthGreeting('goodbye', profile?.display_name ?? '');
    try {
      const { revenueCatService } = await import('../services/revenueCat.service');
      await revenueCatService.logOut();
    } catch {
      // optional
    }
    await onboardingAccountService.clearAccountLocalCache(firebaseUser?.uid);
    await authService.signOut();
    userStateStore.reset();
    setProfile(null);
    setProfileError(null);
    setFirebaseUser(null);
    setIsAdmin(false);
  }, [profile, firebaseUser]);

  const deleteAccount = useCallback(async () => {
    try {
      const { revenueCatService } = await import('../services/revenueCat.service');
      await revenueCatService.logOut();
    } catch {
      // optional
    }
    await onboardingAccountService.clearAccountLocalCache(firebaseUser?.uid);
    await authService.deleteAccount();
    userStateStore.reset();
    setProfile(null);
    setProfileError(null);
    setFirebaseUser(null);
    setIsAdmin(false);
  }, [firebaseUser]);

  /**
   * Type de compte : derive du profil, jamais determine ailleurs.
   *
   * `account_type` alimente quand il existe ; sinon on retombe sur les valeurs
   * legacy (`profile_type`, `role`) pour **classer** le compte — c'est
   * `classifyAccountType` qui decide, jamais une comparaison de chaine dans un
   * composant.
   */
  const accountTypeClassification: AccountTypeClassification = useMemo(
    () =>
      classifyAccountType({
        account_type: profile?.account_type,
        profile_type: profile?.profile_type,
        role: profile?.role,
      }),
    [profile?.account_type, profile?.profile_type, profile?.role],
  );

  const accountType = accountTypeClassification.accountType;
  const needsAccountTypeChoice =
    Boolean(profile) && accountTypeClassification.status === 'needs_choice';

  /**
   * Enregistre le reponse et rafraichit l'etat global dans l'ordre impose :
   * ecrire -> purger le cache -> relire -> re-rendre.
   */
  const chooseAccountType = useCallback(
    async (next: AccountType) => {
      await saveAccountType(next);
      // `onSnapshot` sur users/{uid} met a jour `profile`, donc
      // `accountType` suit ; on relit quand meme pour ne pas dependre de la
      // latence de l'ecouteur.
      await refreshProfile();
    },
    [refreshProfile],
  );

  const accountResolutionState: AppAccountResolutionState = useMemo(() => {
    return onboardingAccountService.resolveAccountResolution({
      isSessionChecking: sessionChecking,
      firebaseUser,
      profile,
      isProfileLoading: profileLoading,
      profileError,
    });
  }, [sessionChecking, firebaseUser, profile, profileLoading, profileError]);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        loading,
        configured: isFirebaseConfigured(),
        isAdmin,
        adminClaimLoading,
        needsEmailVerification: needsEmailVerification(
          firebaseUser,
          profile?.email,
          profile?.email_verified,
          profile?.role
        ),
        sessionChecking,
        profileLoading,
        profileError,
        accountResolutionState,
        accountType,
        needsAccountTypeChoice,
        accountTypeLegacyValue: accountTypeClassification.legacyValue,
        chooseAccountType,
        retryLoadProfile,
        refreshProfile,
        refreshFirebaseUser,
        resendEmailVerification,
        refreshAdminClaim,
        signOut,
        deleteAccount,
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

/** Variante sûre pour les providers racine: retourne null hors AuthProvider. */
export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext);
}
