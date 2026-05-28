// src/services/profile.service.ts
// Logique métier : gestion des profils et validation des documents

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  User,
  UserRole,
  VerificationStatus,
  ROLES_REQUIRING_VERIFICATION,
  type VerificationDocumentType,
  type PlayerVerificationCheckId,
  defaultPlayerVerificationState,
  computePlayerVerificationStatus,
  documentTypeForPlayerCheck,
} from '../models/User';
import type { AppSpaceId } from '../models/AppSpace';
import type { ParentalSettings } from '../models/ParentalSettings';
import { getDb } from '../lib/firebase';
import { storageService, type UploadFileInput } from './storage.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileUpdatePayload {
  display_name?: string;
  phone?: string;
  city?: string;
  department?: string;
  avatar_url?: string;
  email_verified?: boolean;
  profile?: Partial<User['profile']>;
  parental_settings?: Partial<ParentalSettings>;
}

const MAX_GALLERY_PHOTOS = 6;

/** Firestore rejette les valeurs undefined — les retirer avant écriture. */
function stripUndefinedDeep(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map(stripUndefinedDeep).filter((v) => v !== undefined);
  }
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (val === undefined) continue;
    const cleaned = stripUndefinedDeep(val);
    if (cleaned !== undefined) out[key] = cleaned;
  }
  return out;
}

export interface DocumentUploadResult {
  success: boolean;
  storage_url?: string;
  error?: string;
}

export interface ValidationResult {
  success: boolean;
  new_status?: VerificationStatus;
  error?: string;
}

// ─── Profile Service ──────────────────────────────────────────────────────────

/**
 * profileService
 * 
 * Abstraction au-dessus de Firebase Firestore + Storage.
 * En production : remplacer les commentaires par les vraies API Firebase.
 */
export const profileService = {

  /**
   * Crée un nouveau profil utilisateur après inscription.
   * Le profil est créé avec is_verified = false et status = PENDING (si rôle sensible)
   * ou NOT_REQUIRED (si joueur/organisateur/sponsor).
   */
  async createProfile(
    uid: string,
    email: string,
    role: UserRole,
    displayName: string,
    options?: {
      city?: string;
      department?: string;
      profile?: Partial<User['profile']>;
      parental_settings?: ParentalSettings;
      email_verified?: boolean;
      app_space?: AppSpaceId;
    }
  ): Promise<User> {
    const requiresStaffVerification = ROLES_REQUIRING_VERIFICATION.includes(role);
    const isPlayer = role === 'player';
    const isMinor = Boolean(options?.parental_settings?.is_minor);
    const playerVerification = isPlayer
      ? defaultPlayerVerificationState(isMinor)
      : undefined;
    const profileData: User['profile'] = { ...(options?.profile ?? {}) };

    const verificationStatus: VerificationStatus = requiresStaffVerification
      ? 'PENDING'
      : isPlayer
        ? 'PENDING'
        : 'NOT_REQUIRED';

    const newUser: User = {
      uid,
      display_name: displayName,
      email,
      role,
      city: options?.city?.trim() || undefined,
      department: options?.department?.trim() || undefined,
      email_verified: options?.email_verified ?? false,
      is_verified: false,
      verification_status: verificationStatus,
      profile: profileData,
      documents: [],
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true,
      app_space: options?.app_space ?? 'men',
      ...(playerVerification ? { player_verification: playerVerification } : {}),
      ...(options?.parental_settings ? { parental_settings: options.parental_settings } : {}),
    };

    const database = getDb();
    if (database) {
      await setDoc(doc(database, 'users', uid), {
        display_name: displayName,
        email,
        role,
        is_verified: false,
        verification_status: verificationStatus,
        email_verified: newUser.email_verified ?? false,
        profile: profileData,
        app_space: options?.app_space ?? 'men',
        ...(playerVerification ? { player_verification: playerVerification } : {}),
        ...(options?.city?.trim() ? { city: options.city.trim() } : {}),
        ...(options?.department?.trim() ? { department: options.department.trim() } : {}),
        ...(options?.parental_settings
          ? { parental_settings: stripUndefinedDeep(options.parental_settings) }
          : {}),
        is_active: true,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    }
    
    // Si le rôle nécessite vérification, notifier l'admin
    if (requiresStaffVerification) {
      await this._notifyAdminNewPendingProfile(uid, role, displayName);
    }

    return newUser;
  },

  async updateProfile(uid: string, payload: ProfileUpdatePayload): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const snap = await getDoc(doc(database, 'users', uid));
    if (!snap.exists()) throw new Error('Profil introuvable.');

    const current = snap.data() as Record<string, unknown>;
    const currentProfile = (current.profile as User['profile']) ?? {};

    const update: Record<string, unknown> = {
      updated_at: serverTimestamp(),
    };
    if (payload.display_name?.trim()) {
      update.display_name = payload.display_name.trim();
    }
    if (payload.city !== undefined) {
      update.city = payload.city.trim();
    }
    if (payload.department !== undefined) {
      update.department = payload.department.trim() || null;
    }
    if (payload.phone !== undefined) {
      update.phone = payload.phone.trim();
    }
    if (payload.avatar_url !== undefined) {
      update.avatar_url = payload.avatar_url;
    }
    if (payload.email_verified !== undefined) {
      update.email_verified = payload.email_verified;
    }
    if (payload.profile) {
      update.profile = stripUndefinedDeep({
        ...currentProfile,
        ...payload.profile,
      });
    }
    if (payload.parental_settings) {
      const currentParental =
        (current.parental_settings as ParentalSettings | undefined) ?? {};
      update.parental_settings = stripUndefinedDeep({
        ...currentParental,
        ...payload.parental_settings,
      });
    }

    const cleaned = stripUndefinedDeep(update) as Record<string, unknown>;
    if (Object.keys(cleaned).length <= 1 && cleaned.updated_at) {
      throw new Error('Aucune modification à enregistrer.');
    }

    await updateDoc(doc(database, 'users', uid), cleaned);
  },

  async updateParentalSettings(
    uid: string,
    settings: Partial<ParentalSettings>
  ): Promise<void> {
    await this.updateProfile(uid, { parental_settings: settings });
  },

  async uploadAvatar(uid: string, file: UploadFileInput): Promise<string> {
    const url = await storageService.uploadProfileImage(uid, file, 'avatars');
    await this.updateProfile(uid, { avatar_url: url });
    return url;
  },

  async addGalleryPhoto(uid: string, file: UploadFileInput): Promise<string[]> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const snap = await getDoc(doc(database, 'users', uid));
    if (!snap.exists()) throw new Error('Profil introuvable.');

    const current = snap.data() as Record<string, unknown>;
    const currentProfile = (current.profile as User['profile']) ?? {};
    const gallery = [...(currentProfile.gallery_urls ?? []).filter(Boolean)];

    if (gallery.length >= MAX_GALLERY_PHOTOS) {
      throw new Error(`Maximum ${MAX_GALLERY_PHOTOS} photos dans la galerie.`);
    }

    const url = await storageService.uploadProfileImage(uid, file, 'gallery');
    const next = [...gallery, url];
    await this.updateProfile(uid, { profile: { gallery_urls: next } });
    return next;
  },

  async removeGalleryPhoto(uid: string, photoUrl: string): Promise<string[]> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const snap = await getDoc(doc(database, 'users', uid));
    if (!snap.exists()) throw new Error('Profil introuvable.');

    const current = snap.data() as Record<string, unknown>;
    const currentProfile = (current.profile as User['profile']) ?? {};
    const next = (currentProfile.gallery_urls ?? []).filter((u) => u !== photoUrl);

    await this.updateProfile(uid, { profile: { gallery_urls: next } });
    return next;
  },

  async updateFcmToken(uid: string, token: string): Promise<void> {
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, 'users', uid), {
      fcm_token: token,
      updated_at: serverTimestamp(),
    });
  },

  /**
   * Upload d'un document de vérification (diplôme, carte pro, etc.)
   * Stocke dans Firebase Storage et met à jour Firestore.
   */
  async uploadVerificationDocument(
    uid: string,
    file: UploadFileInput,
    documentType: VerificationDocumentType
  ): Promise<DocumentUploadResult> {
    return this.uploadVerificationDocumentWithMeta(uid, file, documentType, {});
  },

  /** Upload avec métadonnées (vérification joueur multi-étapes). */
  async uploadVerificationDocumentWithMeta(
    uid: string,
    file: UploadFileInput,
    documentType: VerificationDocumentType,
    meta: { verification_check?: PlayerVerificationCheckId; role?: UserRole }
  ): Promise<DocumentUploadResult> {
    try {
      const url = await storageService.uploadUserDocument(uid, file, documentType);

      const database = getDb();
      if (database) {
        const docRef = await addDoc(collection(database, 'users', uid, 'documents'), {
          type: documentType,
          storage_url: url,
          uploaded_at: serverTimestamp(),
          ...(meta.verification_check
            ? { verification_check: meta.verification_check }
            : {}),
        });

        if (meta.verification_check) {
          const userRef = doc(database, 'users', uid);
          const snap = await getDoc(userRef);
          const data = snap.data() as Record<string, unknown> | undefined;
          const pv = {
            ...(data?.player_verification as Record<string, unknown>),
          };
          pv[meta.verification_check] = {
            status: 'pending',
            document_id: docRef.id,
            updated_at: serverTimestamp(),
          };
          const merged = { ...defaultPlayerVerificationState(false), ...pv };
          await updateDoc(userRef, {
            player_verification: merged,
            verification_status: computePlayerVerificationStatus(
              merged as ReturnType<typeof defaultPlayerVerificationState>
            ),
            is_verified: false,
            updated_at: serverTimestamp(),
          });
        } else {
          await updateDoc(doc(database, 'users', uid), {
            verification_status: 'PENDING',
            is_verified: false,
            updated_at: serverTimestamp(),
          });
        }
      }
      return { success: true, storage_url: url };
    } catch (error) {
      console.error('[ProfileService] Upload failed:', error);
      return { success: false, error: String(error) };
    }
  },

  async uploadPlayerVerificationCheck(
    uid: string,
    file: UploadFileInput,
    checkId: PlayerVerificationCheckId
  ): Promise<DocumentUploadResult> {
    return this.uploadVerificationDocumentWithMeta(
      uid,
      file,
      documentTypeForPlayerCheck(checkId),
      { verification_check: checkId, role: 'player' }
    );
  },

  /**
   * ADMIN ONLY — Valider ou rejeter un profil.
   * Met à jour is_verified et envoie une notification push au user.
   */
  async validateProfile(
    adminUid: string,
    targetUid: string,
    action: 'approve' | 'reject',
    rejectionReason?: string
  ): Promise<ValidationResult> {
    try {
      // Vérification que l'appelant est bien admin
      // [FIREBASE] const adminClaims = await auth.getUser(adminUid);
      // if (!adminClaims.customClaims?.admin) throw new Error('UNAUTHORIZED');

      const update: Partial<User> = {
        updated_at: new Date(),
        verification_date: new Date(),
      };

      if (action === 'approve') {
        update.is_verified = true;
        update.verification_status = 'VERIFIED';
      } else {
        update.is_verified = false;
        update.verification_status = 'REJECTED';
      }

      const database = getDb();
      if (database) {
        await updateDoc(doc(database, 'users', targetUid), {
          is_verified: update.is_verified,
          verification_status: update.verification_status,
          verification_date: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }

      // Envoyer notification push
      await this._sendVerificationNotification(targetUid, action, rejectionReason);

      return { success: true, new_status: update.verification_status };

    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Vérifie si un utilisateur peut effectuer une action sensible
   * (contacter un mineur, poster une annonce de recrutement, etc.)
   */
  canPerformSensitiveAction(user: User): boolean {
    if (user.role === 'player') {
      return user.player_verification?.identity?.status === 'verified';
    }
    if (!ROLES_REQUIRING_VERIFICATION.includes(user.role)) return true;
    return user.is_verified;
  },

  // ─── Méthodes privées ──────────────────────────────────────────────────────

  async _notifyAdminNewPendingProfile(
    uid: string,
    role: UserRole,
    displayName: string
  ): Promise<void> {
    // [FIREBASE] Appeler une Cloud Function ou envoyer un email admin
    console.log(
      `[AdminAlert] Nouveau profil en attente: ${displayName} (${role}) — UID: ${uid}`
    );
  },

  async _sendVerificationNotification(
    uid: string,
    action: 'approve' | 'reject',
    rejectionReason?: string
  ): Promise<void> {
    const message =
      action === 'approve'
        ? '🎉 Votre profil ProDay a été vérifié ! Vous pouvez maintenant accéder à toutes les fonctionnalités.'
        : `❌ Votre document a été rejeté. Raison : ${rejectionReason ?? 'Document illisible ou invalide.'}. Veuillez en soumettre un nouveau.`;

    // [FIREBASE] await messaging.send({ token: userFcmToken, notification: { body: message } });
    console.log(`[Notification → ${uid}]: ${message}`);
  },
};
