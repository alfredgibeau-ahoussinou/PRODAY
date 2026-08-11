import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
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
import { resolveRuntimeMinutesUsed } from '../utils/parentalScreenTime';
import { buildParentalAlerts } from '../utils/parentalAlerts';
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

export interface GuardianNotification {
  id: string;
  guardian_email: string;
  child_uid: string;
  event_id: string;
  event_title: string;
  event_city?: string | null;
  event_starts_at?: Date | null;
  type: 'minor_invite';
  source: 'team_events';
  read_at?: Date | null;
  created_at: Date;
}

/** @deprecated Préférer `utils/parentalAlerts` */
export { buildParentalAlerts };

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
  return { ...base, alerts: buildParentalAlerts(base) };
}

function toDateValue(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    return ((value as { toDate: () => Date }).toDate());
  }
  return null;
}

function mapGuardianNotification(id: string, raw: Record<string, unknown>): GuardianNotification {
  return {
    id,
    guardian_email: String(raw.guardian_email ?? ''),
    child_uid: String(raw.child_uid ?? ''),
    event_id: String(raw.event_id ?? ''),
    event_title: String(raw.event_title ?? 'Invitation équipe'),
    event_city: typeof raw.event_city === 'string' ? raw.event_city : null,
    event_starts_at: toDateValue(raw.event_starts_at),
    type: 'minor_invite',
    source: 'team_events',
    read_at: toDateValue(raw.read_at),
    created_at: toDateValue(raw.created_at) ?? new Date(0),
  };
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
  async getGuardianEmailForMinor(minorUid: string): Promise<string | null> {
    if (!isFirebaseConfigured() || !minorUid) return null;
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, 'users', minorUid));
    if (!snap.exists()) return null;
    const user = userFromFirestore(snap.id, snap.data() as Record<string, unknown>);
    if (!user.parental_settings?.is_minor) return null;
    return (
      normalizeGuardianEmail(user.parental_settings.guardian_email)
      || normalizeGuardianEmail(user.parental_settings.guardian_email_secondary)
      || null
    );
  },

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

  async listGuardianNotifications(guardianEmail: string): Promise<GuardianNotification[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    const normalized = normalizeGuardianEmail(guardianEmail);
    if (!normalized) return [];

    try {
      const q = query(
        collection(database, 'guardian_notifications'),
        where('guardian_email', '==', normalized),
        orderBy('created_at', 'desc'),
        limit(30),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapGuardianNotification(d.id, d.data() as Record<string, unknown>));
    } catch (error) {
      console.error('[parentalGuardianService] listGuardianNotifications:', error);
      return [];
    }
  },

  subscribeGuardianNotifications(
    guardianEmail: string,
    onChange: (items: GuardianNotification[]) => void,
  ): () => void {
    if (!isFirebaseConfigured()) {
      onChange([]);
      return () => {};
    }
    const database = getDb();
    if (!database) {
      onChange([]);
      return () => {};
    }
    const normalized = normalizeGuardianEmail(guardianEmail);
    if (!normalized) {
      onChange([]);
      return () => {};
    }

    const q = query(
      collection(database, 'guardian_notifications'),
      where('guardian_email', '==', normalized),
      orderBy('created_at', 'desc'),
      limit(30),
    );
    return onSnapshot(
      q,
      (snap) => {
        onChange(
          snap.docs.map((d) => mapGuardianNotification(d.id, d.data() as Record<string, unknown>))
        );
      },
      () => onChange([]),
    );
  },

  async markGuardianNotificationsRead(guardianEmail: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const normalized = normalizeGuardianEmail(guardianEmail);
    if (!normalized) throw new Error('Email tuteur invalide.');

    const q = query(
      collection(database, 'guardian_notifications'),
      where('guardian_email', '==', normalized),
      where('read_at', '==', null),
      limit(30),
    );
    const snap = await getDocs(q);
    await Promise.all(
      snap.docs.map((d) =>
        updateDoc(doc(database, 'guardian_notifications', d.id), {
          read_at: serverTimestamp(),
        }),
      ),
    );
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

  async removeSecondaryGuardian(
    childUid: string,
    guardianEmail: string,
  ): Promise<void> {
    const normalized = normalizeGuardianEmail(guardianEmail);
    if (!normalized) throw new Error('Email tuteur invalide.');

    await this.updateChildParental(childUid, normalized, async (child) => {
      if (!guardianEmailsMatch(child.parental_settings?.guardian_email_secondary, normalized)) {
        throw new Error('Vous n’êtes pas le co-tuteur de ce compte.');
      }
      return {
        ...DEFAULT_PARENTAL_SETTINGS,
        ...child.parental_settings,
        is_minor: true,
        guardian_email_secondary: undefined,
      };
    });
  },
};

