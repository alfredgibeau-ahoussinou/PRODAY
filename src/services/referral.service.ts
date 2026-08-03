import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { callFunction } from '../lib/firebaseFunctions';
import {
  buildReferralLink,
  extractReferralCodeFromUrl,
  isReferralEligibleRole,
  isValidReferralCodeFormat,
  normalizeReferralCode,
  type ReferralInviteStatus,
} from '../utils/referralLogic';
import type { UserRole } from '../models/User';

const PENDING_REF_KEY = '@proday/pending_referral_code';

export type ReferralInvitee = {
  id: string;
  invitee_uid: string;
  invitee_display_name?: string | null;
  invitee_role?: UserRole | null;
  status: ReferralInviteStatus;
  created_at?: Date;
  subscribed_at?: Date | null;
};

export type ReferralReward = {
  id: string;
  months_granted: number;
  invitee_uid?: string;
  period_end_before?: string | null;
  period_end_after?: string;
  created_at?: Date;
};

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  if (typeof value === 'object' && value && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export const referralService = {
  isEligibleRole(role: UserRole | null | undefined): boolean {
    return isReferralEligibleRole(role);
  },

  async savePendingCode(raw: string): Promise<string | null> {
    const code = normalizeReferralCode(raw);
    if (!isValidReferralCodeFormat(code)) return null;
    await AsyncStorage.setItem(PENDING_REF_KEY, code);
    return code;
  },

  async savePendingCodeFromUrl(url: string): Promise<string | null> {
    const code = extractReferralCodeFromUrl(url);
    if (!code) return null;
    await AsyncStorage.setItem(PENDING_REF_KEY, code);
    return code;
  },

  async getPendingCode(): Promise<string | null> {
    const raw = await AsyncStorage.getItem(PENDING_REF_KEY);
    if (!raw) return null;
    const code = normalizeReferralCode(raw);
    return isValidReferralCodeFormat(code) ? code : null;
  },

  async clearPendingCode(): Promise<void> {
    await AsyncStorage.removeItem(PENDING_REF_KEY);
  },

  async ensureCode(): Promise<{ referral_code: string; referral_link: string }> {
    const result = await callFunction<
      Record<string, never>,
      { ok: boolean; referral_code: string; referral_link: string }
    >('ensureReferralCode', {});
    return {
      referral_code: result.referral_code,
      referral_link: result.referral_link || buildReferralLink(result.referral_code),
    };
  },

  async claimCode(raw: string): Promise<void> {
    const code = normalizeReferralCode(raw);
    if (!isValidReferralCodeFormat(code)) {
      throw new Error('Code de parrainage invalide');
    }
    await callFunction<{ code: string }, { ok: boolean }>('claimReferralCode', { code });
    await this.clearPendingCode();
  },

  /**
   * Après création de profil : assure le code + claim éventuel (formulaire ou deep link).
   */
  async bootstrapAfterSignup(options?: {
    codeFromForm?: string | null;
    role?: UserRole | null;
  }): Promise<void> {
    if (options?.role && !isReferralEligibleRole(options.role)) {
      await this.clearPendingCode();
      return;
    }
    try {
      await this.ensureCode();
    } catch (e) {
      if (__DEV__) console.warn('[referral] ensureCode:', e);
    }
    const fromForm = options?.codeFromForm
      ? normalizeReferralCode(options.codeFromForm)
      : null;
    const pending = fromForm && isValidReferralCodeFormat(fromForm)
      ? fromForm
      : await this.getPendingCode();
    if (!pending) return;
    try {
      await this.claimCode(pending);
    } catch (e) {
      if (__DEV__) console.warn('[referral] claimCode:', e);
    }
  },

  async listInvitees(referrerUid: string): Promise<ReferralInvitee[]> {
    const database = getDb();
    if (!database) return [];
    const q = query(
      collection(database, 'referrals'),
      where('referrer_uid', '==', referrerUid),
      orderBy('created_at', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        invitee_uid: String(data.invitee_uid ?? ''),
        invitee_display_name: (data.invitee_display_name as string | null) ?? null,
        invitee_role: (data.invitee_role as UserRole | null) ?? null,
        status: data.status === 'subscribed' ? 'subscribed' : 'signed_up',
        created_at: toDate(data.created_at),
        subscribed_at: toDate(data.subscribed_at) ?? null,
      };
    });
  },

  async listRewards(uid: string): Promise<ReferralReward[]> {
    const database = getDb();
    if (!database) return [];
    const q = query(
      collection(database, 'users', uid, 'referral_rewards'),
      orderBy('created_at', 'desc'),
      limit(30)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        months_granted: Number(data.months_granted ?? 1),
        invitee_uid: data.invitee_uid as string | undefined,
        period_end_before: (data.period_end_before as string | null) ?? null,
        period_end_after: data.period_end_after as string | undefined,
        created_at: toDate(data.created_at),
      };
    });
  },
};
