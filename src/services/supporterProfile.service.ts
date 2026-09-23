import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SupporterFollowedClub {
  clubId: string;
  clubName: string;
  followedAt: string; // Date ISO
}

const STORAGE_KEY_PREFIX = '@supporter:followed_clubs:';

function getStorageKey(uid: string): string {
  return `${STORAGE_KEY_PREFIX}${uid}`;
}

export const supporterProfileService = {
  async getFollowedClubs(uid: string): Promise<SupporterFollowedClub[]> {
    if (!uid) return [];
    try {
      const raw = await AsyncStorage.getItem(getStorageKey(uid));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  },

  async followClub(
    uid: string,
    club: { clubId: string; clubName: string },
  ): Promise<void> {
    if (!uid || !club.clubId) return;
    try {
      const current = await this.getFollowedClubs(uid);
      const exists = current.some((c) => c.clubId === club.clubId);
      if (!exists) {
        const next: SupporterFollowedClub[] = [
          ...current,
          {
            clubId: club.clubId,
            clubName: club.clubName,
            followedAt: new Date().toISOString(),
          },
        ];
        await AsyncStorage.setItem(getStorageKey(uid), JSON.stringify(next));
      }
    } catch {
      // Ignorer ou loguer
    }
  },

  async unfollowClub(uid: string, clubId: string): Promise<void> {
    if (!uid || !clubId) return;
    try {
      const current = await this.getFollowedClubs(uid);
      const filtered = current.filter((c) => c.clubId !== clubId);
      await AsyncStorage.setItem(getStorageKey(uid), JSON.stringify(filtered));
    } catch {
      // Ignorer
    }
  },

  async isFollowing(uid: string, clubId: string): Promise<boolean> {
    if (!uid || !clubId) return false;
    const current = await this.getFollowedClubs(uid);
    return current.some((c) => c.clubId === clubId);
  },

  async countFollowing(uid: string): Promise<number> {
    if (!uid) return 0;
    const current = await this.getFollowedClubs(uid);
    return current.length;
  },
};
