import { useCallback, useEffect, useRef } from 'react';
import type { MainTabId } from '../navigation/MainTabs';
import type { User } from '../models/User';
import { isMinorUser } from '../utils/minor';
import { parentalActivityJournalService } from '../services/parentalActivityJournal.service';

const SECTION_TICK_MS = 60_000;

export function useParentalActivityJournal(profile: User | null, activeTab: MainTabId) {
  const prevTab = useRef<MainTabId | null>(null);
  const sectionMinutes = useRef(0);

  const logLogin = useCallback(async () => {
    if (!profile || !isMinorUser(profile)) return;
    await parentalActivityJournalService.log(
      profile.uid,
      'login',
      'Connexion à ProDay',
      undefined,
      profile.parental_settings?.activity_journal,
    );
  }, [profile]);

  useEffect(() => {
    if (!profile || !isMinorUser(profile)) return;
    void logLogin();
  }, [profile?.uid, logLogin, profile]);

  useEffect(() => {
    if (!profile || !isMinorUser(profile)) return;

    const interval = setInterval(() => {
      sectionMinutes.current += 1;
    }, SECTION_TICK_MS);

    return () => clearInterval(interval);
  }, [profile, activeTab]);

  useEffect(() => {
    if (!profile || !isMinorUser(profile)) return;

    const previous = prevTab.current;
    if (previous && previous !== activeTab && sectionMinutes.current > 0) {
      void parentalActivityJournalService.log(
        profile.uid,
        'section_time',
        parentalActivityJournalService.sectionLabel(previous),
        { section: previous, minutes: sectionMinutes.current },
        profile.parental_settings?.activity_journal,
      );
      sectionMinutes.current = 0;
    }
    prevTab.current = activeTab;
  }, [activeTab, profile]);
}

export async function logParentalMessageSent(profile: User | null): Promise<void> {
  if (!profile || !isMinorUser(profile)) return;
  await parentalActivityJournalService.log(
    profile.uid,
    'message_sent',
    'Message envoyé',
    undefined,
    profile.parental_settings?.activity_journal,
  );
}
