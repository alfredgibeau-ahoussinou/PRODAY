// src/services/profile.service.ts
// Logique métier : gestion des profils et validation des documents

import {
  doc,
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
} from '../models/User';
import { getDb } from '../lib/firebase';
import { storageService, type UploadFileInput } from './storage.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileUpdatePayload {
  display_name?: string;
  phone?: string;
  city?: string;
  department?: string;
  profile?: Partial<User['profile']>;
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
    displayName: string
  ): Promise<User> {
    const requiresVerification = ROLES_REQUIRING_VERIFICATION.includes(role);

    const newUser: User = {
      uid,
      display_name: displayName,
      email,
      role,
      is_verified: !requiresVerification, // Joueurs sont auto-vérifiés
      verification_status: requiresVerification ? 'PENDING' : 'NOT_REQUIRED',
      profile: {},
      documents: [],
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true,
    };

    const database = getDb();
    if (database) {
      await setDoc(doc(database, 'users', uid), {
        display_name: displayName,
        email,
        role,
        is_verified: newUser.is_verified,
        verification_status: newUser.verification_status,
        profile: {},
        is_active: true,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    }
    
    // Si le rôle nécessite vérification, notifier l'admin
    if (requiresVerification) {
      await this._notifyAdminNewPendingProfile(uid, role, displayName);
    }

    return newUser;
  },

  /**
   * Upload d'un document de vérification (diplôme, carte pro, etc.)
   * Stocke dans Firebase Storage et met à jour Firestore.
   */
  async uploadVerificationDocument(
    uid: string,
    file: UploadFileInput,
    documentType: 'diploma' | 'license' | 'id'
  ): Promise<DocumentUploadResult> {
    try {
      const url = await storageService.uploadUserDocument(uid, file, documentType);

      const database = getDb();
      if (database) {
        await addDoc(collection(database, 'users', uid, 'documents'), {
          type: documentType,
          storage_url: url,
          uploaded_at: serverTimestamp(),
        });
        await updateDoc(doc(database, 'users', uid), {
          verification_status: 'PENDING',
          is_verified: false,
          updated_at: serverTimestamp(),
        });
      }
      return { success: true, storage_url: url };

    } catch (error) {
      console.error('[ProfileService] Upload failed:', error);
      return { success: false, error: String(error) };
    }
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
