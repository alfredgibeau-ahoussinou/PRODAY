/**
 * Service de gestion des licences club (import Footclubs, certification rapide, export).
 */

import { doc, updateDoc, serverTimestamp, setDoc, collection, getDocs, getDoc, query, where } from 'firebase/firestore';
import { getDb } from '../../../lib/firebase';
import { isFirebaseConfigured } from '../../../config/firebase';
import { profileService } from '../../../services/profile.service';
import { membershipsService } from '../../../services/memberships.service';
import type { ParsedLicenseRow } from '../utils/footclubsCsvParser';
import type { User } from '../../../models/User';
import type { Membership } from '../../../models/Membership';

export interface LicenseImportSummary {
  totalProcessed: number;
  updatedCount: number;
  newPendingCount: number;
  errors: string[];
}

export const clubLicenseService = {
  /**
   * Certifie et valide la licence d'un joueur en 1 clic par le staff/président.
   */
  async verifyPlayerLicense(params: {
    clubId: string;
    playerUid: string;
    licenseNumber?: string;
    approverUid: string;
  }): Promise<void> {
    const { clubId, playerUid, licenseNumber, approverUid } = params;
    if (!isFirebaseConfigured() || !playerUid) return;

    const database = getDb();
    if (!database) return;

    // 1. Mise à jour du profil utilisateur
    const userRef = doc(database, 'users', playerUid);
    const updates: Record<string, unknown> = {
      'profile.verification_status': 'verified',
      'player_verification.club_license.status': 'verified',
      'player_verification.club_license.updated_at': new Date().toISOString(),
      'player_verification.club_license.verified_by_uid': approverUid,
      updated_at: serverTimestamp(),
    };

    if (licenseNumber?.trim()) {
      updates['profile.license_number'] = licenseNumber.trim();
    }

    try {
      await updateDoc(userRef, updates);
    } catch {
      // Fallback via profileService
      await profileService.updateProfile(playerUid, {
        profile: {
          verification_status: 'verified',
          ...(licenseNumber ? { license_number: licenseNumber.trim() } : {}),
        },
      });
    }

    // 2. Mise à jour de la membership si présente
    try {
      const memberships = await membershipsService.listByClub(clubId);
      const m = memberships.find((item) => item.player_uid === playerUid);
      if (m && database) {
        const memRef = doc(database, 'memberships', m.id);
        await updateDoc(memRef, {
          license_number: licenseNumber?.trim() || m.license_number || null,
          status: 'active',
          validated_by_uid: approverUid,
          validated_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }
    } catch {
      // Tolérance silencieuse
    }
  },

  /**
   * Importe un lot de licenciés depuis un fichier Footclubs FFF parsé.
   */
  async importLicensedRoster(params: {
    clubId: string;
    rows: ParsedLicenseRow[];
    approverUid: string;
    existingPlayers: User[];
    /** N° d’affiliation FFF — publie le cache inscription si fourni ou déjà sur le club. */
    fffAffiliationNumber?: string;
    clubName?: string;
    clubCity?: string;
  }): Promise<LicenseImportSummary> {
    const { clubId, rows, approverUid, existingPlayers } = params;
    const summary: LicenseImportSummary = {
      totalProcessed: rows.length,
      updatedCount: 0,
      newPendingCount: 0,
      errors: [],
    };

    if (!isFirebaseConfigured()) {
      summary.errors.push('Mode hors-ligne ou Firebase non initialisé.');
      return summary;
    }

    const database = getDb();
    if (!database) {
      summary.errors.push('Base de données inaccessible.');
      return summary;
    }

    const emailMap = new Map<string, User>();
    const nameMap = new Map<string, User>();

    existingPlayers.forEach((p) => {
      if (p.email) emailMap.set(p.email.toLowerCase().trim(), p);
      if (p.display_name) nameMap.set(p.display_name.toLowerCase().trim(), p);
    });

    const publishedMembers: Array<{
      id: string;
      displayName: string;
      role: 'player' | 'coach';
      category: string;
      licenseNumber?: string;
    }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const matched =
          (row.email ? emailMap.get(row.email.toLowerCase()) : null) ||
          nameMap.get(row.displayName.toLowerCase());

        publishedMembers.push({
          id: row.licenseNumber || `row_${i}`,
          displayName: row.displayName,
          role: 'player',
          category: row.category || '',
          licenseNumber: row.licenseNumber || undefined,
        });

        if (matched) {
          await this.verifyPlayerLicense({
            clubId,
            playerUid: matched.uid,
            licenseNumber: row.licenseNumber,
            approverUid,
          });
          summary.updatedCount++;
        } else {
          const ref = doc(collection(database, 'memberships'));
          await setDoc(ref, {
            club_id: clubId,
            team_id: 'unassigned',
            player_uid: `pre_${row.licenseNumber || Date.now()}_${i}`,
            player_name: row.displayName,
            email: row.email || null,
            license_number: row.licenseNumber || null,
            category: row.category || null,
            status: 'pending',
            source: 'footclubs_import',
            imported_by_uid: approverUid,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          });
          summary.newPendingCount++;
        }
      } catch (err) {
        summary.errors.push(`Erreur sur ${row.displayName} : ${err instanceof Error ? err.message : 'inconnue'}`);
      }
    }

    // Cache inscription (lecture publique par n° FFF) — hors memberships (ACL stricte)
    try {
      let affiliation = params.fffAffiliationNumber?.trim() || '';
      let clubName = params.clubName?.trim() || '';
      let clubCity = params.clubCity?.trim() || '';

      if (!affiliation || !clubName) {
        const clubSnap = await getDoc(doc(database, 'clubs', clubId));
        if (clubSnap.exists()) {
          const c = clubSnap.data() as Record<string, unknown>;
          if (!affiliation && c.fff_affiliation_number) {
            affiliation = String(c.fff_affiliation_number);
          }
          if (!clubName && c.name) clubName = String(c.name);
          if (!clubCity && c.city) clubCity = String(c.city);
        }
      }

      if (affiliation) {
        if (params.fffAffiliationNumber?.trim()) {
          try {
            await updateDoc(doc(database, 'clubs', clubId), {
              fff_affiliation_number: affiliation,
              updated_at: serverTimestamp(),
            });
          } catch {
            // best-effort
          }
        }
        const { fffClubRosterService } = await import('../../../services/fffClubRoster.service');
        await fffClubRosterService.publishRoster({
          affiliationNumber: affiliation,
          clubName: clubName || 'Club FFF',
          prodayClubId: clubId,
          city: clubCity,
          members: publishedMembers,
          source: 'footclubs_import',
        });
      } else {
        summary.errors.push(
          'Effectif importé, mais n° d’affiliation FFF manquant sur le club : les joueurs ne seront pas proposés à l’inscription tant que le n° FFF n’est pas renseigné.'
        );
      }
    } catch (err) {
      summary.errors.push(
        `Cache inscription FFF : ${err instanceof Error ? err.message : 'erreur de publication'}`
      );
    }

    return summary;
  },
};
