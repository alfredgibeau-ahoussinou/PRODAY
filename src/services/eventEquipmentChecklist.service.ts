import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type {
  ChecklistItem,
  PlayerEventChecklistState,
} from '../models/EventEquipmentChecklist';

const COL = 'event_player_checklists';

const DEFAULT_MATCH_ITEMS: ChecklistItem[] = [
  { id: 'coach_shin_guards', label: 'Protège-tibias réglementaires', is_required_by_coach: true, added_by_player: false, category: 'gear' },
  { id: 'coach_match_kit', label: 'Tenue officielle de match du club', is_required_by_coach: true, added_by_player: false, category: 'clothes' },
  { id: 'coach_boots', label: 'Chaussures à crampons adaptées à la surface', is_required_by_coach: true, added_by_player: false, category: 'gear' },
  { id: 'coach_water', label: 'Gourde d’eau individuelle', is_required_by_coach: true, added_by_player: false, category: 'food_drink' },
  { id: 'coach_id_card', label: 'Pièce d’identité ou licence FFF', is_required_by_coach: true, added_by_player: false, category: 'documents' },
];

const DEFAULT_TRAINING_ITEMS: ChecklistItem[] = [
  { id: 'coach_shin_guards', label: 'Protège-tibias', is_required_by_coach: true, added_by_player: false, category: 'gear' },
  { id: 'coach_training_gear', label: 'Tenue d’entraînement club', is_required_by_coach: true, added_by_player: false, category: 'clothes' },
  { id: 'coach_boots', label: 'Crampons adaptés', is_required_by_coach: true, added_by_player: false, category: 'gear' },
  { id: 'coach_water', label: 'Gourde d’eau', is_required_by_coach: true, added_by_player: false, category: 'food_drink' },
];

export const eventEquipmentChecklistService = {
  /**
   * Obtient ou initialise la checklist pour un joueur et un événement donné.
   */
  async getChecklist(
    eventId: string,
    playerUid: string,
    eventType: 'match' | 'training' | string = 'training',
  ): Promise<{
    requiredItems: ChecklistItem[];
    personalItems: ChecklistItem[];
    checkedItemIds: Set<string>;
  }> {
    const defaultRequired = eventType === 'training' ? DEFAULT_TRAINING_ITEMS : DEFAULT_MATCH_ITEMS;
    const key = `${eventId}_${playerUid}`;

    const database = getDb();
    if (!database || !isFirebaseConfigured() || !playerUid || !eventId) {
      return {
        requiredItems: defaultRequired,
        personalItems: [],
        checkedItemIds: new Set<string>(),
      };
    }

    try {
      const snap = await getDoc(doc(database, COL, key));
      if (!snap.exists()) {
        return {
          requiredItems: defaultRequired,
          personalItems: [],
          checkedItemIds: new Set<string>(),
        };
      }
      const data = snap.data();
      const checkedItemIds = new Set<string>(
        Array.isArray(data.checked_item_ids) ? data.checked_item_ids.map(String) : [],
      );
      const personalItems: ChecklistItem[] = Array.isArray(data.personal_items)
        ? data.personal_items.map((it: Record<string, unknown>, idx: number) => ({
            id: String(it.id ?? `personal_${idx}`),
            label: String(it.label ?? ''),
            is_required_by_coach: false,
            added_by_player: true,
            category: (it.category as ChecklistItem['category']) ?? 'gear',
          }))
        : [];

      return {
        requiredItems: defaultRequired,
        personalItems,
        checkedItemIds,
      };
    } catch {
      return {
        requiredItems: defaultRequired,
        personalItems: [],
        checkedItemIds: new Set<string>(),
      };
    }
  },

  /**
   * Sauvegarde l'état des cases cochées et des items personnels (sans notification sonore/push intempestive).
   */
  async saveChecklistState(
    eventId: string,
    playerUid: string,
    checkedItemIds: string[],
    personalItems: ChecklistItem[],
  ): Promise<void> {
    const database = getDb();
    if (!database || !isFirebaseConfigured() || !eventId || !playerUid) return;
    const key = `${eventId}_${playerUid}`;
    await setDoc(
      doc(database, COL, key),
      {
        event_id: eventId,
        player_uid: playerUid,
        checked_item_ids: checkedItemIds,
        personal_items: personalItems,
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );
  },
};
