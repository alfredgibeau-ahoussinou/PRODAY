import AsyncStorage from '@react-native-async-storage/async-storage';

export type PlayerRsvpStatus = 'present' | 'absent' | 'pending' | 'uncertain';

export interface PlayerRsvpRecord {
  eventId: string;
  status: PlayerRsvpStatus;
  updatedAt: string;
  reason?: string;
}

const RSVP_STORAGE_PREFIX = 'proday_player_rsvp_';

export const playerRsvpService = {
  async getRsvp(userId: string, eventId: string): Promise<PlayerRsvpStatus> {
    try {
      const val = await AsyncStorage.getItem(`${RSVP_STORAGE_PREFIX}${userId}_${eventId}`);
      if (val === 'present' || val === 'absent' || val === 'pending' || val === 'uncertain') {
        return val as PlayerRsvpStatus;
      }
      return 'present'; // Default active
    } catch {
      return 'present';
    }
  },

  async setRsvp(
    userId: string,
    eventId: string,
    status: PlayerRsvpStatus,
    reason?: string
  ): Promise<PlayerRsvpRecord> {
    const record: PlayerRsvpRecord = {
      eventId,
      status,
      updatedAt: new Date().toISOString(),
      reason,
    };
    try {
      await AsyncStorage.setItem(`${RSVP_STORAGE_PREFIX}${userId}_${eventId}`, status);
    } catch (e) {
      console.warn('[playerRsvpService] Storage error:', e);
    }
    return record;
  },
};
