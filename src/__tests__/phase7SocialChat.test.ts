jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
}));

import { buildChatQuickReplies } from '../core/social/chatQuickReply.engine';
import { isCalendarSyncEnabled, setCalendarSyncEnabled } from '../services/v3Preferences.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Phase 7 — Chat IA + préférences V3', () => {
  it('propose des réponses rapides pour un RDV kiné', () => {
    const replies = buildChatQuickReplies({
      otherRole: 'physio',
      otherName: 'Dr Martin',
      lastIncoming: 'Avez-vous un créneau pour un RDV cette semaine ?',
    });
    expect(replies.some((r) => r.text.toLowerCase().includes('dispo'))).toBe(true);
    expect(replies.length).toBeLessThanOrEqual(4);
  });

  it('propose des réponses pour un coach', () => {
    const replies = buildChatQuickReplies({
      otherRole: 'coach',
      otherName: 'Coach Dupont',
      lastIncoming: 'Convocation match samedi',
    });
    expect(
      replies.some(
        (r) => r.text.toLowerCase().includes('présence') || r.text.toLowerCase().includes('coach')
      )
    ).toBe(true);
  });

  it('persiste la préférence sync calendrier', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('0');
    expect(await isCalendarSyncEnabled('uid-test')).toBe(false);
    await setCalendarSyncEnabled('uid-test', true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('proday_v3_calendar_sync_v1:uid-test', '1');
  });
});
