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
import {
  buildGuardianScreenTimeSettings,
  type GuardianScreenTimePatch,
} from '../utils/guardianParentalPatch';
import { getScreenTimeDayKey, resolveRuntimeMinutesUsed } from '../utils/parentalScreenTime';
import {
  generateGuardianInviteCode,
  guardianEmailsMatch,
  isGuardianForMinorSettings,
  normalizeGuardianEmail,
} from '../utils/guardianEmail';

export interface LinkedMinorProfile {
  uid: string;
  display_name: string;
  settings: ParentalSettings;
  runtime?: ParentalRuntime;
  minutesUsedToday: number;
  alerts: string[];
}

function buildAlerts(child: LinkedMinorProfile): string[] {
  const alerts: string[] = [];
  const { settings, minutesUsedToday } = child;
  const limit = settings.daily_limit_minutes ?? 90;
  const bonus =
    settings.screen_time_bonus_day === getScreenTimeDayKey()
      ? settings.screen_time_bonus_minutes ?? 0
      : 0;
  const effectiveLimit = limit + bonus;

  if (settings.unlock_request?.status === 'pending') {
    alerts.push(`Demande de +${settings.unlock_request.minutes} min en attente`);
  }
  if (settings.screen_time_enabled && minutesUsedToday >= effectiveLimit) {
    alerts.push('Limite de temps d’écran atteinte');
  } else if (settings.screen_time_enabled && minutesUsedToday >= effectiveLimit * 0.9) {
    alerts.push('Temps d’écran bientôt épuisé');
  }
  const pendingContacts = (settings.approved_contacts ?? []).filter((c) => !c.approved);
  if (pendingContacts.length > 0) {
    alerts.push(`${pendingContacts.length} contact(s) en attente d’approbation`);
  }
  return alerts;
}

function mapLinkedMinor(user: User): LinkedMinorProfile {
  const settings: ParentalSettings = {
    ...DEFAULT_PARENTAL_SETTINGS,
    ...user.parental_settings,
    is_minor: true,
  };
  const base = {
    uid: user.uid,
    display_name: user.display_name,
    settings,
    runtime: user.parental_runtime,
    minutesUsedToday: resolveRuntimeMinutesUsed(user.parental_runtime),
    alerts: [] as string[],
  };
  return { ...base, alerts: buildAlerts(base) };
}

async function queryMinorsByGuardianField(
  field: 'parental_settings.guardian_email' | 'parental_settings.guardian_email_secondary',
  normalized: string,
): Promise<User[]> {
  const database = getDb();
  if (!database) return [];
  const q = query(
    collection(database, 'users'),
    where(field, '==', normalized),
    where('parental_settings.is_minor', '==', true),
    limit(20),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => userFromFirestore(d.id, d.data() as Record<string, unknown>));
}

export const parentalGuardianService = {
  async listLinkedMinors(guardianEmail: string): Promise<LinkedMinorProfile[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    const normalized = normalizeGuardianEmail(guardianEmail);
    if (!normalized) return [];

    try {
      const [primary, secondary] = await Promise.all([
        queryMinorsByGuardianField('parental_settings.guardian_email', normalized),
        queryMinorsByGuardianField('parental_settings.guardian_email_secondary', normalized),
      ]);
      const byUid = new Map<string, User>();
      for (const user of [...primary, ...secondary]) {
        if (isGuardianForMinorSettings(user.parental_settings, normalized)) {
          byUid.set(user.uid, user);
        }
      }
      return Array.from(byUid.values()).map(mapLinkedMinor);
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
    if (!isGuardianForMinorSettings(child.parental_settings, normalized)) {
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

  async updateChildParental(
    childUid: string,
    guardianEmail: string,
    buildNext: (child: User) => Promise<ParentalSettings>,
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const normalized = normalizeGuardianEmail(guardianEmail);
    if (!normalized) throw new Error('Email tuteur invalide.');

    const snap = await getDoc(doc(database, 'users', childUid));
    if (!snap.exists()) throw new Error('Compte mineur introuvable.');
    const child = userFromFirestore(snap.id, snap.data() as Record<string, unknown>);
    if (!child.parental_settings?.is_minor) throw new Error('Ce compte n’est pas supervisé.');
    if (!isGuardianForMinorSettings(child.parental_settings, normalized)) {
      throw new Error('Vous n’êtes pas le tuteur enregistré pour ce compte.');
    }

    const parental_settings = await buildNext(child);
    await updateDoc(doc(database, 'users', childUid), {
      parental_settings,
      updated_at: serverTimestamp(),
    });
  },

  async approveUnlock(childUid: string, guardianEmail: string): Promise<void> {
    const { parentalUnlockService } = await import('./parentalUnlock.service');
    await this.updateChildParental(childUid, guardianEmail, async (child) =>
      parentalUnlockService.buildClearUnlockRequest(
        { ...DEFAULT_PARENTAL_SETTINGS, ...child.parental_settings, is_minor: true },
        'approved',
        true,
      ),
    );
  },

  async denyUnlock(childUid: string, guardianEmail: string): Promise<void> {
    const { parentalUnlockService } = await import('./parentalUnlock.service');
    await this.updateChildParental(childUid, guardianEmail, async (child) =>
      parentalUnlockService.buildClearUnlockRequest(
        { ...DEFAULT_PARENTAL_SETTINGS, ...child.parental_settings, is_minor: true },
        'denied',
        false,
      ),
    );
  },

  async linkWithInviteCode(guardianEmail: string, code: string): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const normalized = normalizeGuardianEmail(guardianEmail);
    if (!normalized) throw new Error('Email tuteur invalide.');
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) throw new Error('Code invalide (6 chiffres).');

    const snap = await getDocs(
      query(
        collection(database, 'users'),
        where('parental_settings.guardian_invite_code', '==', trimmed),
        where('parental_settings.is_minor', '==', true),
        limit(1),
      ),
    );
    if (snap.empty) throw new Error('Aucun compte mineur ne correspond à ce code.');

    const child = userFromFirestore(snap.docs[0].id, snap.docs[0].data() as Record<string, unknown>);
    if (guardianEmailsMatch(child.parental_settings?.guardian_email, normalized)) {
      throw new Error('Vous êtes déjà le tuteur principal de ce compte.');
    }
    if (guardianEmailsMatch(child.parental_settings?.guardian_email_secondary, normalized)) {
      return child.display_name;
    }

    const parental_settings: ParentalSettings = {
      ...DEFAULT_PARENTAL_SETTINGS,
      ...child.parental_settings,
      is_minor: true,
      guardian_email_secondary: normalized,
    };
    await updateDoc(doc(database, 'users', child.uid), {
      parental_settings,
      updated_at: serverTimestamp(),
    });
    return child.display_name;
  },

  async ensureInviteCode(childUid: string, settings: ParentalSettings): Promise<string> {
    if (settings.guardian_invite_code) return settings.guardian_invite_code;
    const code = generateGuardianInviteCode();
    const database = getDb();
    if (!database) return code;
    await updateDoc(doc(database, 'users', childUid), {
      parental_settings: { ...settings, guardian_invite_code: code },
      updated_at: serverTimestamp(),
    });
    return code;
  },
};

