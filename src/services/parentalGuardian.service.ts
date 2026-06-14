import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { userFromFirestore } from '../lib/firestoreMappers';
import type { ParentalRuntime, ParentalSettings } from '../models/ParentalSettings';
import { DEFAULT_PARENTAL_SETTINGS } from '../models/ParentalSettings';
import type { User } from '../models/User';
import { guardianEmailsMatch, normalizeGuardianEmail } from '../utils/guardianEmail';
import {
  buildGuardianScreenTimeSettings,
  type GuardianScreenTimePatch,
} from '../utils/guardianParentalPatch';
import { getScreenTimeDayKey, resolveRuntimeMinutesUsed } from '../utils/parentalScreenTime';

export interface LinkedMinorProfile {
  uid: string;
  display_name: string;
  settings: ParentalSettings;
  runtime?: ParentalRuntime;
  minutesUsedToday: number;
}

function mapLinkedMinor(user: User): LinkedMinorProfile {
  const settings: ParentalSettings = {
    ...DEFAULT_PARENTAL_SETTINGS,
    ...user.parental_settings,
    is_minor: true,
  };
  return {
    uid: user.uid,
    display_name: user.display_name,
    settings,
    runtime: user.parental_runtime,
    minutesUsedToday: resolveRuntimeMinutesUsed(user.parental_runtime),
  };
}

export const parentalGuardianService = {
  async listLinkedMinors(guardianEmail: string): Promise<LinkedMinorProfile[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    const normalized = normalizeGuardianEmail(guardianEmail);
    if (!normalized) return [];

    try {
      const q = query(
        collection(database, 'users'),
        where('parental_settings.guardian_email', '==', normalized),
        where('parental_settings.is_minor', '==', true),
        limit(20),
      );
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => userFromFirestore(d.id, d.data() as Record<string, unknown>))
        .filter((user) =>
          guardianEmailsMatch(user.parental_settings?.guardian_email, normalized),
        )
        .map(mapLinkedMinor);
    } catch (error) {
      console.error('[parentalGuardianService] listLinkedMinors:', error);
      return [];
    }
  },

  async updateChildScreenTime(
    childUid: string,
    guardianEmail: string,
    patch: GuardianScreenTimePatch,
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const normalized = normalizeGuardianEmail(guardianEmail);
    if (!normalized) throw new Error('Email tuteur invalide.');

    const snap = await getDoc(doc(database, 'users', childUid));
    if (!snap.exists()) throw new Error('Compte mineur introuvable.');

    const child = userFromFirestore(snap.id, snap.data() as Record<string, unknown>);
    if (!child.parental_settings?.is_minor) {
      throw new Error('Ce compte n’est pas supervisé.');
    }
    if (!guardianEmailsMatch(child.parental_settings.guardian_email, normalized)) {
      throw new Error('Vous n’êtes pas le tuteur enregistré pour ce compte.');
    }

    const parental_settings = buildGuardianScreenTimeSettings(
      child.parental_settings,
      patch,
    );

    await updateDoc(doc(database, 'users', childUid), {
      parental_settings,
      updated_at: serverTimestamp(),
    });
  },
};
