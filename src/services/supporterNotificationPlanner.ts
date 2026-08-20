import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { SupporterMatchViewItem } from '../utils/supporterMatchFilters';
import type { SupporterNotificationPreferences } from './supporterPreferences.service';
import {
  shouldDeliverSupporterNotification,
  type SupporterNotifKind,
} from '../utils/supporterNotificationFilter';

const SCHEDULED_KEY = 'proday:supporter-notif-scheduled';
const DAILY_COUNT_KEY = 'proday:supporter-notif-daily';
const MAX_PER_TEAM_PER_DAY = 3;

export type SupporterPlannedNotif = {
  id: string;
  kind: SupporterNotifKind;
  teamKey: string;
  fireAt: Date;
  title: string;
  body: string;
  matchId?: string;
};

async function notificationsModule() {
  if (Platform.OS === 'web' || Constants.appOwnership === 'expo') return null;
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

async function loadScheduledIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SCHEDULED_KEY);
    if (!raw) return [];
    const ids = JSON.parse(raw) as string[];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

async function saveScheduledIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(SCHEDULED_KEY, JSON.stringify(ids.slice(-60)));
}

async function getDailyTeamCounts(): Promise<Record<string, number>> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_COUNT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { day: string; counts: Record<string, number> };
    const today = new Date().toISOString().slice(0, 10);
    if (parsed.day !== today) return {};
    return parsed.counts ?? {};
  } catch {
    return {};
  }
}

async function bumpDailyTeamCount(teamKey: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const counts = await getDailyTeamCounts();
  const next = (counts[teamKey] ?? 0) + 1;
  if (next > MAX_PER_TEAM_PER_DAY) return false;
  await AsyncStorage.setItem(DAILY_COUNT_KEY, JSON.stringify({ day: today, counts: { ...counts, [teamKey]: next } }));
  return true;
}

/** Filtre les notifications planifiables selon prefs + quota journalier. */
export function filterPlannableNotifications(
  prefs: SupporterNotificationPreferences,
  candidates: SupporterPlannedNotif[],
): SupporterPlannedNotif[] {
  return candidates.filter((c) => shouldDeliverSupporterNotification(prefs, c.kind));
}

/** Construit rappels « ton équipe joue dans 1h » depuis fixtures à venir. */
export function buildKickoffReminders(
  fixtures: SupporterMatchViewItem[],
  followedTeamIds: Set<string>,
  now = new Date(),
): SupporterPlannedNotif[] {
  const out: SupporterPlannedNotif[] = [];
  for (const fx of fixtures) {
    if (fx.status !== 'upcoming') continue;
    const starts = fx.startsAt instanceof Date ? fx.startsAt : new Date(fx.startsAt);
    const diffMs = starts.getTime() - now.getTime();
    if (diffMs < 55 * 60_000 || diffMs > 65 * 60_000) continue;

    const homeFollowed = fx.homeFollowTarget && followedTeamIds.has(fx.homeFollowTarget.id);
    const awayFollowed = fx.awayFollowTarget && followedTeamIds.has(fx.awayFollowTarget.id);
    if (!homeFollowed && !awayFollowed) continue;

    const teamKey = homeFollowed ? fx.homeFollowTarget!.id : fx.awayFollowTarget!.id;
    out.push({
      id: `kickoff:${fx.id}`,
      kind: 'kickoff_favorite',
      teamKey,
      fireAt: new Date(starts.getTime() - 60 * 60_000),
      title: 'Ton équipe joue dans 1h',
      body: `${fx.homeLabel} vs ${fx.awayLabel}`,
      matchId: fx.id,
    });
  }
  return out;
}

/** Détecte changement de score pour notif BUT (poll léger). */
export function detectGoalNotification(
  prev: { home?: number; away?: number } | null,
  next: { home?: number; away?: number },
  matchLabel: string,
  matchId: string,
  teamKey: string,
): SupporterPlannedNotif | null {
  if (!prev) return null;
  const prevTotal = (prev.home ?? 0) + (prev.away ?? 0);
  const nextTotal = (next.home ?? 0) + (next.away ?? 0);
  if (nextTotal <= prevTotal) return null;
  return {
    id: `goal:${matchId}:${nextTotal}`,
    kind: 'goal_live',
    teamKey,
    fireAt: new Date(),
    title: 'BUT !',
    body: matchLabel,
    matchId,
  };
}

export function buildSummaryAvailableNotif(
  matchId: string,
  matchLabel: string,
  teamKey: string,
): SupporterPlannedNotif {
  return {
    id: `summary:${matchId}`,
    kind: 'summary_available',
    teamKey,
    fireAt: new Date(),
    title: 'Résumé disponible',
    body: matchLabel,
    matchId,
  };
}

export const supporterNotificationPlanner = {
  filterPlannableNotifications,
  buildKickoffReminders,
  detectGoalNotification,
  buildSummaryAvailableNotif,

  async scheduleNotifications(
    prefs: SupporterNotificationPreferences,
    candidates: SupporterPlannedNotif[],
  ): Promise<number> {
    const Notifications = await notificationsModule();
    if (!Notifications) return 0;

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return 0;

    const allowed = filterPlannableNotifications(prefs, candidates);
    const existing = await loadScheduledIds();
    let scheduled = 0;

    for (const notif of allowed) {
      if (existing.includes(notif.id)) continue;
      const ok = await bumpDailyTeamCount(notif.teamKey);
      if (!ok) continue;

      try {
        const content = {
          title: notif.title,
          body: notif.body,
          data: { matchId: notif.matchId, kind: notif.kind },
        };
        let id: string;
        if (notif.fireAt.getTime() <= Date.now()) {
          id = await Notifications.scheduleNotificationAsync({ content, trigger: null });
        } else {
          id = await Notifications.scheduleNotificationAsync({
            identifier: notif.id,
            content,
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: notif.fireAt,
            },
          });
        }
        existing.push(id);
        scheduled += 1;
      } catch (e) {
        console.warn('[supporterNotificationPlanner] schedule:', e);
      }
    }

    await saveScheduledIds(existing);
    return scheduled;
  },

  async fireImmediate(title: string, body: string, data?: Record<string, unknown>): Promise<void> {
    const Notifications = await notificationsModule();
    if (!Notifications) return;
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: null,
    });
  },
};
