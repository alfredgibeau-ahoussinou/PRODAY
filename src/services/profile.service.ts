// src/services/profile.service.ts
// Logique métier : gestion des profils et validation des documents

import {
  User,
  UserRole,
  VerificationStatus,
  ROLES_REQUIRING_VERIFICATION,
} from '../models/User';

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

    // [FIREBASE] await db.collection('users').doc(uid).set(newUser);
    console.log(`[ProfileService] Created profile for ${uid} (role: ${role})`);
    
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
    file: File | Blob,
    documentType: 'diploma' | 'license' | 'id'
  ): Promise<DocumentUploadResult> {
    try {
      const fileName = `documents/${uid}/${documentType}_${Date.now()}.jpg`;
      
      // [FIREBASE] const ref = storage.ref(fileName);
      // [FIREBASE] await ref.put(file);
      // [FIREBASE] const url = await ref.getDownloadURL();
      const url = `https://storage.proday.app/${fileName}`; // placeholder

      const docRecord = {
        id: `doc_${Date.now()}`,
        type: documentType,
        storage_url: url,
        uploaded_at: new Date(),
      };

      // [FIREBASE] await db.collection('users').doc(uid)
      //   .collection('documents').add(docRecord);
      
      // Mettre à jour le statut du profil principal
      // [FIREBASE] await db.collection('users').doc(uid).update({
      //   verification_status: 'PENDING',
      //   updated_at: new Date(),
      // });

      console.log(`[ProfileService] Document uploaded for ${uid}: ${documentType}`);
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

      // [FIREBASE] await db.collection('users').doc(targetUid).update(update);

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
