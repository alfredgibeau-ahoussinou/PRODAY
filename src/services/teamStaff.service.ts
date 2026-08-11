import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type {
  CreateTeamStaffInput,
  TeamStaffMember,
  TeamStaffRole,
} from '../models/TeamStaffMember';

const COL = 'team_staff';

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (v && typeof v === 'object' && 'toDate' in v) {
    return (v as { toDate: () => Date }).toDate();
  }
  return new Date(0);
}

function mapRow(id: string, data: Record<string, unknown>): TeamStaffMember {
  const role = data.staff_role as TeamStaffRole;
  return {
    id,
    club_id: String(data.club_id ?? ''),
    team_id: data.team_id ? String(data.team_id) : undefined,
    uid: String(data.uid ?? ''),
    display_name: String(data.display_name ?? ''),
    staff_role:
      role === 'assistant' || role === 'analyst' || role === 'physio' || role === 'coach'
        ? role
        : 'assistant',
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

export const teamStaffService = {
  async listForClub(clubId: string, max = 40): Promise<TeamStaffMember[]> {
    if (!isFirebaseConfigured() || !clubId) return [];
    const database = getDb();
    if (!database) return [];
    const snap = await getDocs(
      query(collection(database, COL), where('club_id', '==', clubId), limit(max)),
    );
    return snap.docs.map((d) => mapRow(d.id, d.data() as Record<string, unknown>));
  },

  async add(input: CreateTeamStaffInput): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const ref = await addDoc(collection(database, COL), {
      club_id: input.club_id,
      team_id: input.team_id ?? null,
      uid: input.uid,
      display_name: input.display_name,
      staff_role: input.staff_role,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return ref.id;
  },

  async remove(id: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, COL, id));
  },
};
