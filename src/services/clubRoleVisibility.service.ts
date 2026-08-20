import AsyncStorage from '@react-native-async-storage/async-storage';

/** Rôles club pour la matrice de visibilité locale (documents / ops). */
export type ClubVisibilityRoleId = 'admin' | 'dirigeant' | 'ds' | 'coach' | 'assistant';

export type ClubRoleVisibilityPrefs = Record<ClubVisibilityRoleId, boolean>;

const DEFAULT_PREFS: ClubRoleVisibilityPrefs = {
  admin: true,
  dirigeant: true,
  ds: true,
  coach: true,
  assistant: false,
};

function storageKey(clubId: string): string {
  return `club_role_visibility_v1:${clubId}`;
}

/**
 * Persistance locale de la visibilité des rôles (documents / licences).
 * Pas une ACL Firestore complète — cohérent avec le Pôle Club v1.
 */
export const clubRoleVisibilityService = {
  async load(clubId: string): Promise<ClubRoleVisibilityPrefs> {
    if (!clubId) return { ...DEFAULT_PREFS };
    try {
      const raw = await AsyncStorage.getItem(storageKey(clubId));
      if (!raw) return { ...DEFAULT_PREFS };
      const parsed = JSON.parse(raw) as Partial<ClubRoleVisibilityPrefs>;
      return { ...DEFAULT_PREFS, ...parsed };
    } catch {
      return { ...DEFAULT_PREFS };
    }
  },

  async save(clubId: string, prefs: ClubRoleVisibilityPrefs): Promise<void> {
    if (!clubId) return;
    await AsyncStorage.setItem(storageKey(clubId), JSON.stringify(prefs));
  },

  async setRole(
    clubId: string,
    role: ClubVisibilityRoleId,
    visible: boolean,
  ): Promise<ClubRoleVisibilityPrefs> {
    const current = await this.load(clubId);
    const next = { ...current, [role]: visible };
    await this.save(clubId, next);
    return next;
  },
};
