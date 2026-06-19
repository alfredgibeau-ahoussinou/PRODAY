import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useSeasonCalendar } from '../hooks/useAppData';
import { useProdayNotificationRouter } from '../hooks/useProdayNotificationRouter';
import { useProdayNotificationSync } from '../hooks/useProdayNotificationSync';
import { useWeeklyQuestion } from '../hooks/useWeeklyQuestion';
import { getMercatoVisibilityChecklist } from '../utils/mercatoVisibilityChecklist';
import { canParticipateWeeklyQuestion } from '../utils/weeklyQuestionAccess';

/** Sync notifications locales + routage deep link au tap. */
export const ProdayNotificationBridge: React.FC = () => {
  const { profile } = useAuth();
  const nav = useTabNavigation();
  const clubId = profile?.profile.club_id;
  const { events, matches } = useSeasonCalendar(profile?.uid, clubId);
  const { myResponse, question } = useWeeklyQuestion(profile);

  const engagement = useMemo(() => {
    if (!profile) return undefined;
    const mercato =
      profile.role === 'player'
        ? !getMercatoVisibilityChecklist(profile).isVisibleReady
        : false;
    const weeklyQuestionOpen =
      canParticipateWeeklyQuestion(profile.role) && Boolean(question) && !myResponse;
    return { mercatoIncomplete: mercato, weeklyQuestionOpen };
  }, [profile, question, myResponse]);

  const routerActions = useMemo(
    () => ({
      openMatchs: nav.openMatchs,
      openCarpool: nav.openCarpool,
      openMercato: nav.openMercato,
      openProfile: () => nav.openProfile(),
      setActiveTab: nav.setActiveTab,
    }),
    [nav.openMatchs, nav.openCarpool, nav.openMercato, nav.openProfile, nav.setActiveTab],
  );

  useProdayNotificationSync(profile ?? undefined, events, matches, engagement);
  useProdayNotificationRouter(routerActions);

  return null;
};
