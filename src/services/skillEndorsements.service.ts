import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  deleteDoc,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import {
  emptySkillCounts,
  SKILL_ENDORSEMENT_KEYS,
  type CreateSkillEndorsementInput,
  type SkillEndorsement,
  type SkillEndorsementCounts,
  type SkillEndorsementKey,
} from '../models/SkillEndorsement';

const COL = 'skill_endorsements';

function endorsementId(endorserUid: string, endorsedUid: string, skill: string): string {
  return `${endorserUid}_${endorsedUid}_${skill}`;
}

function mapDoc(id: string, data: Record<string, unknown>): SkillEndorsement {
  const skill = String(data.skill ?? '') as SkillEndorsementKey;
  return {
    id,
    endorser_uid: String(data.endorser_uid ?? ''),
    endorser_name: String(data.endorser_name ?? ''),
    endorsed_uid: String(data.endorsed_uid ?? ''),
    skill: SKILL_ENDORSEMENT_KEYS.includes(skill) ? skill : 'passing',
    club_id: data.club_id != null ? String(data.club_id) : undefined,
    created_at:
      data.created_at && typeof data.created_at === 'object' && 'toDate' in (data.created_at as object)
        ? (data.created_at as { toDate: () => Date }).toDate()
        : new Date(),
  };
}

export const skillEndorsementsService = {
  async listForPlayer(endorsedUid: string, max = 200): Promise<SkillEndorsement[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, COL),
        where('endorsed_uid', '==', endorsedUid),
        orderBy('created_at', 'desc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
    } catch (error) {
      // Composite index missing → fallback without orderBy, sort client-side
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('requires an index') || message.includes('FAILED_PRECONDITION')) {
        try {
          const q = query(
            collection(database, COL),
            where('endorsed_uid', '==', endorsedUid),
            limit(max)
          );
          const snap = await getDocs(q);
          return snap.docs
            .map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
            .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        } catch (fallbackError) {
          console.error('[skillEndorsementsService] listForPlayer fallback:', fallbackError);
          return [];
        }
      }
      console.error('[skillEndorsementsService] listForPlayer:', error);
      return [];
    }
  },

  async countsForPlayer(endorsedUid: string): Promise<SkillEndorsementCounts> {
    const list = await this.listForPlayer(endorsedUid);
    const counts = emptySkillCounts();
    for (const item of list) {
      counts[item.skill] += 1;
    }
    return counts;
  },

  async hasEndorsed(
    endorserUid: string,
    endorsedUid: string,
    skill: SkillEndorsementKey
  ): Promise<boolean> {
    if (!isFirebaseConfigured()) return false;
    const database = getDb();
    if (!database) return false;
    const snap = await getDocs(
      query(
        collection(database, COL),
        where('endorser_uid', '==', endorserUid),
        where('endorsed_uid', '==', endorsedUid),
        where('skill', '==', skill),
        limit(1)
      )
    );
    return !snap.empty;
  },

  async endorse(input: CreateSkillEndorsementInput): Promise<string> {
    if (input.endorser_uid === input.endorsed_uid) {
      throw new Error('Impossible de s’auto-endosser');
    }
    if (!SKILL_ENDORSEMENT_KEYS.includes(input.skill)) {
      throw new Error('Compétence invalide');
    }
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const id = endorsementId(input.endorser_uid, input.endorsed_uid, input.skill);
    await setDoc(doc(database, COL, id), {
      endorser_uid: input.endorser_uid,
      endorser_name: input.endorser_name.trim(),
      endorsed_uid: input.endorsed_uid,
      skill: input.skill,
      club_id: input.club_id ?? null,
      created_at: serverTimestamp(),
    });
    return id;
  },

  async revoke(
    endorserUid: string,
    endorsedUid: string,
    skill: SkillEndorsementKey
  ): Promise<void> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, COL, endorsementId(endorserUid, endorsedUid, skill)));
  },
};
