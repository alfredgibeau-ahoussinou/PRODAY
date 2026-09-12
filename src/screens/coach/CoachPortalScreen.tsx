import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TabScreenShell } from '../../components/app/TabScreenShell';
import { CoachChapterRail } from '../../components/coach/coachPortalUi';
import type { CoachPortalChapterId } from '../../content/coachPortalChapters';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useTranslation } from '../../context/LocaleContext';
import { usersService } from '../../services/users.service';
import type { User } from '../../models/User';
import { AnimatedRouteContent } from '../../components/motion';
import { resolveClubCoversCoachFromMembers } from '../../utils/clubFeatureAccess';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import type { CoachNavItemId } from '../../features/coach/navigation/coachNavConfig';
import { useCoachTheme, useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';

// Import the Brand New 9 Master Screens
import { CoachHomeScreen } from './CoachHomeScreen';
import { CoachTrainingPlannerScreen } from './CoachTrainingPlannerScreen';
import { CoachSquadScreen } from './CoachSquadScreen';
import { CoachLiveMatchCenterScreen } from './CoachLiveMatchCenterScreen';
import { CoachWorkloadHealthScreen } from './CoachWorkloadHealthScreen';
import { CoachScoutingGrowthScreen } from './CoachScoutingGrowthScreen';

const COACH_CHAPTER_ORDER: CoachPortalChapterId[] = [
  'cockpit',
  'planning',
  'effectif',
  'matchs',
  'performance',
  'communication',
];

export type CoachPortalScreenProps = {
  chapter?: CoachPortalChapterId;
  hideRail?: boolean;
  embedded?: boolean;
  effectifFocus?: 'all' | 'joueurs' | 'staff' | 'recrutement';
};

/** Portail coach master — architecture unifiée Apple Obsidian Glass. */
export const CoachPortalScreen: React.FC<CoachPortalScreenProps> = ({
  chapter: chapterProp,
  hideRail = false,
  embedded = false,
}) => {
  const profile = useSessionProfile();
  const { t } = useTranslation();
  const { tokens } = useCoachTheme();
  const shellNav = useCoachShellNav();
  const styles = useCoachThemedStyles(createStyles);
  const [chapterState, setChapterState] = useState<CoachPortalChapterId>(
    chapterProp ?? 'cockpit',
  );
  const chapter = chapterProp ?? chapterState;
  const setChapter = (id: CoachPortalChapterId) => {
    if (chapterProp) return;
    setChapterState(id);
  };
  const [members, setMembers] = useState<User[]>([]);

  useEffect(() => {
    if (chapterProp) setChapterState(chapterProp);
  }, [chapterProp]);

  const clubId = profile?.profile.club_id;
  useEffect(() => {
    if (!clubId) {
      setMembers([]);
      return;
    }
    void usersService
      .listMembersByClubId(clubId)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [clubId]);

  const handleNavigate = useCallback(
    (navId: string) => {
      if (shellNav) {
        shellNav.requestNav(navId as CoachNavItemId);
      }
    },
    [shellNav],
  );

  const body = (
    <View style={styles.stack}>
      {!hideRail ? <CoachChapterRail active={chapter} onChange={setChapter} /> : null}
      <View style={styles.body}>
        <AnimatedRouteContent
          routeKey={chapter}
          routeOrder={COACH_CHAPTER_ORDER}
          context="tab"
        >
          {chapter === 'cockpit' ? (
            <CoachHomeScreen onNavigate={handleNavigate} />
          ) : null}
          {chapter === 'planning' ? <CoachTrainingPlannerScreen /> : null}
          {chapter === 'effectif' ? <CoachSquadScreen /> : null}
          {chapter === 'matchs' ? <CoachLiveMatchCenterScreen /> : null}
          {chapter === 'performance' ? <CoachWorkloadHealthScreen /> : null}
          {chapter === 'communication' ? <CoachScoutingGrowthScreen /> : null}
        </AnimatedRouteContent>
      </View>
    </View>
  );

  if (embedded) {
    return <View style={styles.embed}>{body}</View>;
  }

  return (
    <TabScreenShell
      caption={t('coach.portal.eyebrow')}
      title={t('coach.portal.title')}
      subtitle={t('coach.portal.subtitle')}
      atmosphere="coach"
      stats={[
        { label: t('coach.portal.stat.upcoming'), value: '1' },
        { label: t('coach.portal.stat.roster'), value: String(members.length || 18) },
      ]}
    >
      {body}
    </TabScreenShell>
  );
};

const createStyles = (tokens: CoachThemeTokens) =>
  StyleSheet.create({
    stack: { flex: 1, minHeight: 0 },
    body: { flex: 1, minHeight: 0 },
    embed: { flex: 1, minHeight: 0, backgroundColor: tokens.bg },
  });
