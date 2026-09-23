import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Encouragement {
  id: string;
  uid: string;
  authorName: string;
  authorRole?: string;
  clubId?: string;
  clubOrTeam: string;
  text: string;
  claps: number;
  clappedByUids: string[];
  createdAt: string; // ISO
}

const STORAGE_KEY = '@supporter:encouragements';

export const encouragementsService = {
  async list(clubId?: string): Promise<Encouragement[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const items: Encouragement[] = JSON.parse(raw);
      if (!Array.isArray(items)) return [];
      const sorted = items.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      if (clubId) {
        return sorted.filter((item) => item.clubId === clubId);
      }
      return sorted;
    } catch {
      return [];
    }
  },

  async post(
    data: Omit<Encouragement, 'id' | 'claps' | 'clappedByUids' | 'createdAt'>,
  ): Promise<Encouragement> {
    const newEncouragement: Encouragement = {
      ...data,
      id: `enc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      claps: 0,
      clappedByUids: [],
      createdAt: new Date().toISOString(),
    };

    try {
      const current = await this.list();
      const next = [newEncouragement, ...current];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignorer
    }

    return newEncouragement;
  },

  async clap(encouragementId: string, uid: string): Promise<void> {
    if (!encouragementId || !uid) return;
    try {
      const current = await this.list();
      const index = current.findIndex((item) => item.id === encouragementId);
      if (index === -1) return;

      const item = current[index];
      const hasClapped = item.clappedByUids.includes(uid);
      let updatedClappedByUids: string[];
      let updatedClaps: number;

      if (hasClapped) {
        updatedClappedByUids = item.clappedByUids.filter((u) => u !== uid);
        updatedClaps = Math.max(0, item.claps - 1);
      } else {
        updatedClappedByUids = [...item.clappedByUids, uid];
        updatedClaps = item.claps + 1;
      }

      current[index] = {
        ...item,
        claps: updatedClaps,
        clappedByUids: updatedClappedByUids,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // Ignorer
    }
  },

  async hasClapped(encouragementId: string, uid: string): Promise<boolean> {
    if (!encouragementId || !uid) return false;
    const current = await this.list();
    const item = current.find((i) => i.id === encouragementId);
    return item ? item.clappedByUids.includes(uid) : false;
  },
};
