import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';
import type { CalendarEntity } from '../core/calendar/calendarSync.engine';
import { buildDeviceCalendarDrafts } from '../core/calendar/deviceCalendar.mapper';
import { setLastCalendarSyncAt } from './v3Preferences.service';

export type DeviceCalendarSyncResult = 'synced' | 'denied' | 'empty' | 'error';

const STORAGE_KEY = 'proday_device_cal_map_v1';

type DeviceCalMap = Record<string, string>;

async function loadMap(uid: string): Promise<DeviceCalMap> {
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_KEY}:${uid}`);
    if (!raw) return {};
    return JSON.parse(raw) as DeviceCalMap;
  } catch {
    return {};
  }
}

async function saveMap(uid: string, map: DeviceCalMap): Promise<void> {
  await AsyncStorage.setItem(`${STORAGE_KEY}:${uid}`, JSON.stringify(map));
}

/** Exporte les prochains événements Brain vers le calendrier de l'appareil (V3+). */
export async function syncEntitiesToDeviceCalendar(
  uid: string,
  entities: CalendarEntity[]
): Promise<boolean> {
  const drafts = buildDeviceCalendarDrafts(entities);
  if (drafts.length === 0) return false;

  let status: string;
  try {
    ({ status } = await Calendar.requestCalendarPermissionsAsync());
  } catch {
    return false;
  }
  if (status !== 'granted') return false;

  let defaultCalendar: Calendar.Calendar;
  try {
    defaultCalendar = await Calendar.getDefaultCalendarAsync();
  } catch {
    return false;
  }
  const map = await loadMap(uid);

  for (const draft of drafts) {
    const payload = {
      title: draft.title,
      notes: draft.notes,
      location: draft.location,
      startDate: draft.startDate,
      endDate: draft.endDate,
    };

    const existingId = map[draft.entityId];
    try {
      if (existingId) {
        await Calendar.updateEventAsync(existingId, payload);
      } else {
        const createdId = await Calendar.createEventAsync(defaultCalendar.id, payload);
        map[draft.entityId] = createdId;
      }
    } catch {
      try {
        const createdId = await Calendar.createEventAsync(defaultCalendar.id, payload);
        map[draft.entityId] = createdId;
      } catch {
        // Permission ou calendrier indisponible — on ignore l'entrée.
      }
    }
  }

  await saveMap(uid, map);
  return true;
}

/** Sync manuelle ou auto — retour explicite pour l’UI. */
export async function requestAndSyncDeviceCalendar(
  uid: string,
  entities: CalendarEntity[]
): Promise<DeviceCalendarSyncResult> {
  const drafts = buildDeviceCalendarDrafts(entities);
  if (drafts.length === 0) return 'empty';

  let status: string;
  try {
    ({ status } = await Calendar.requestCalendarPermissionsAsync());
  } catch {
    return 'error';
  }
  if (status !== 'granted') return 'denied';

  try {
    const ok = await syncEntitiesToDeviceCalendar(uid, entities);
    if (ok) {
      await setLastCalendarSyncAt(uid, Date.now());
      return 'synced';
    }
    return 'error';
  } catch {
    return 'error';
  }
}

export async function clearDeviceCalendarMap(uid: string): Promise<void> {
  await AsyncStorage.removeItem(`${STORAGE_KEY}:${uid}`);
}
