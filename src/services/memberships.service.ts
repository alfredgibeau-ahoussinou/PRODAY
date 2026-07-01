import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  limit,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { Membership, RequestMembershipInput, InvitePlayerMembershipInput } from '../models/Membership';
import { canRequestClubMembership } from '../utils/membershipValidation';
import { profileService } from './profile.service';
import { clubsService } from './clubs.service';
import { teamsService } from './teams.service';
import { membershipFromFirestore } from '../lib/firestoreMappers';

const COL = 'memberships';

export const membershipsService = {
  async listByPlayer(playerUid: string): Promise<Membership[]> {
    if (!isFirebaseConfigured() || !playerUid) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(collection(database, COL), where('player_uid', '==', playerUid), limit(30)),
      );
      return snap.docs.map((d) => membershipFromFirestore(d.id, d.data() as Record<string, unknown>));
    } catch {
      return [];
    }
  },

  async listByClub(clubId: string, status?: Membership['status']): Promise<Membership[]> {
    if (!isFirebaseConfigured() || !clubId) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(collection(database, COL), where('club_id', '==', clubId), limit(80)),
      );
      const all = snap.docs.map((d) => membershipFromFirestore(d.id, d.data() as Record<string, unknown>));
      return status ? all.filter((m) => m.status === status) : all;
    } catch {
      return [];
    }
  },

  async getActiveForPlayer(playerUid: string): Promise<Membership | null> {
    const list = await this.listByPlayer(playerUid);
    return list.find((m) => m.status === 'active') ?? null;
  },

  async getById(membershipId: string): Promise<Membership | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, COL, membershipId));
    if (!snap.exists()) return null;
    return membershipFromFirestore(snap.id, snap.data() as Record<string, unknown>);
  },

  /** Joueur demande à rejoindre un club — statut pending jusqu'à validation staff. */
  async requestJoin(input: RequestMembershipInput): Promise<Membership> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const existing = await this.listByPlayer(input.player_uid);
    const gate = canRequestClubMembership(existing, input.club_id);
    if (!gate.allowed) {
      throw new Error(gate.reason ?? 'Demande impossible.');
    }

    const club = await clubsService.getById(input.club_id);
    if (!club) throw new Error('Club introuvable.');

    let teamId = input.team_id ?? null;
    if (teamId) {
      const team = await teamsService.getById(teamId);
      if (!team || team.club_id !== input.club_id) {
        throw new Error('Équipe invalide pour ce club.');
      }
    } else {
      const defaultTeam = await teamsService.getDefaultTeam(input.club_id);
      teamId = defaultTeam?.id ?? 'unassigned';
    }

    const ref = doc(collection(database, COL));
    const payload = {
      club_id: input.club_id,
      team_id: teamId,
      player_uid: input.player_uid,
      player_name: input.player_name.trim(),
      status: 'pending',
      license_number: input.license_number?.trim() || null,
      requested_at: serverTimestamp(),
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
    await setDoc(ref, payload);
    const snap = await getDoc(ref);
    return membershipFromFirestore(snap.id, snap.data() as Record<string, unknown>);
  },

  /** Staff club invite un joueur — membership pending jusqu'à acceptation joueur ou validation staff. */
  async invitePlayer(input: InvitePlayerMembershipInput): Promise<Membership> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    if (input.player_uid === input.invited_by_uid) {
      throw new Error('Un staff ne peut pas s’inviter lui-même.');
    }

    const existing = await this.listByPlayer(input.player_uid);
    const gate = canRequestClubMembership(existing, input.club_id);
    if (!gate.allowed) {
      throw new Error(gate.reason ?? 'Invitation impossible.');
    }

    const club = await clubsService.getById(input.club_id);
    if (!club) throw new Error('Club introuvable.');

    let teamId = input.team_id ?? null;
    if (teamId) {
      const team = await teamsService.getById(teamId);
      if (!team || team.club_id !== input.club_id) {
        throw new Error('Équipe invalide pour ce club.');
      }
    } else {
      const defaultTeam = await teamsService.getDefaultTeam(input.club_id);
      teamId = defaultTeam?.id ?? 'unassigned';
    }

    const ref = doc(collection(database, COL));
    const payload = {
      club_id: input.club_id,
      team_id: teamId,
      player_uid: input.player_uid,
      player_name: input.player_name.trim(),
      status: 'pending',
      invited_by_uid: input.invited_by_uid,
      requested_at: serverTimestamp(),
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
    await setDoc(ref, payload);
    const snap = await getDoc(ref);
    return membershipFromFirestore(snap.id, snap.data() as Record<string, unknown>);
  },

  /** Staff club valide l'affiliation — active le membership et lie le profil joueur. */
  async approve(membershipId: string, approverUid: string): Promise<void> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const membership = await this.getById(membershipId);
    if (!membership) throw new Error('Demande introuvable.');
    if (membership.status !== 'pending') {
      throw new Error('Cette demande n’est plus en attente.');
    }

    let teamId = membership.team_id;
    if (!teamId || teamId === 'unassigned') {
      const club = await clubsService.getById(membership.club_id);
      const team = await teamsService.ensureDefaultTeam(
        membership.club_id,
        club?.name,
      );
      teamId = team.id;
    }

    await updateDoc(doc(database, COL, membershipId), {
      status: 'active',
      team_id: teamId,
      validated_at: serverTimestamp(),
      validated_by_uid: approverUid,
      updated_at: serverTimestamp(),
    });

    await profileService.updateProfile(membership.player_uid, {
      profile: { club_id: membership.club_id },
    });
  },

  async reject(membershipId: string, approverUid: string): Promise<void> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const membership = await this.getById(membershipId);
    if (!membership) throw new Error('Demande introuvable.');
    if (membership.status !== 'pending') {
      throw new Error('Cette demande n’est plus en attente.');
    }

    await updateDoc(doc(database, COL, membershipId), {
      status: 'rejected',
      validated_at: serverTimestamp(),
      validated_by_uid: approverUid,
      updated_at: serverTimestamp(),
    });
  },
};
