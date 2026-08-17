import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { TabScreenShell } from '../../components/app/TabScreenShell';
import { CoachChapterRail } from '../../components/coach/coachPortalUi';
import { CoachCockpitChapter } from '../../components/coach/CoachCockpitChapter';
import { CoachPlanningChapter } from '../../components/coach/CoachPlanningChapter';
import {
  CoachEffectifChapter,
  type CoachEffectifFocus,
} from '../../components/coach/CoachEffectifChapter';
import { CoachMatchsChapter } from '../../components/coach/CoachMatchsChapter';
import { CoachPerformanceChapter } from '../../components/coach/CoachPerformanceChapter';
import { CoachCommunicationChapter } from '../../components/coach/CoachCommunicationChapter';
import type { CoachPortalChapterId } from '../../content/coachPortalChapters';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useTranslation } from '../../context/LocaleContext';
import { useAppTheme } from '../../context/ProductLineContext';
import { teamEventsService } from '../../services/teamEvents.service';
import { usersService } from '../../services/users.service';
import type { TeamEvent } from '../../models/TeamEvent';
import type { User } from '../../models/User';
import { TeamManagementScreen } from '../TeamManagementScreen';
import { SmartTacticsPortalScreen } from '../smartTactics/SmartTacticsPortalScreen';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { PushScreenTransition } from '../../components/motion';
import {
  resolveClubCoversCoachFromMembers,
  userCanAccessSmartTactics,
} from '../../utils/clubFeatureAccess';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import type { CoachNavItemId } from '../../features/coach/navigation/coachNavConfig';
import { COACH_SITE } from '../../content/coachPageIdentity';

export type CoachPortalScreenProps = {
  chapter?: CoachPortalChapterId;
  hideRail?: boolean;
  embedded?: boolean;
  effectifFocus?: CoachEffectifFocus;
};

/** Portail coach — standalone (onglet) ou embarqué dans CoachAppShell. */
export const CoachPortalScreen: React.FC<CoachPortalScreenProps> = ({
  chapter: chapterProp,
  hideRail = false,
  embedded = false,
  effectifFocus,
}) => {
  const profile = useSessionProfile();
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { pendingDashboardView, clearPendingDashboard } = useTabNavigation();
  const shellNav = useCoachShellNav();
  const [chapterState, setChapterState] = useState<CoachPortalChapterId>(
    chapterProp ?? 'cockpit',
  );
  const chapter = chapterProp ?? chapterState;
  const setChapter = (id: CoachPortalChapterId) => {
    if (chapterProp) return;
    setChapterState(id);
  };
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showGestion, setShowGestion] = useState(false);
  const [showSmartTactics, setShowSmartTactics] = useState(false);

  useEffect(() => {
    if (chapterProp) setChapterState(chapterProp);
  }, [chapterProp]);

  const clubId = profile?.profile.club_id;
  const clubCoversCoach = useMemo(
    () => resolveClubCoversCoachFromMembers(members),
    [members],
  );
  const canSmartTactics = userCanAccessSmartTactics(profile, { clubCoversCoach });

  const openSmartTactics = useCallback(() => {
    if (!canSmartTactics) {
      Alert.alert(
        'Tactique IA',
        'Inclus avec Coach Pro, ou si ton club a l’offre Tout inclus. Demande un devis club ou souscris Coach Pro.',
      );
      return;
    }
    if (shellNav) {
      shellNav.requestNav('smart_tactics');
      return;
    }
    setShowSmartTactics(true);
  }, [canSmartTactics, shellNav]);

  const openChapter = useCallback(
    (id: CoachPortalChapterId) => {
      if (shellNav) {
        const map: Record<CoachPortalChapterId, CoachNavItemId> = {
          cockpit: 'today',
          planning: 'entrainements',
          effectif: 'equipe',
          matchs: 'match_center',
          performance: 'forme',
          communication: 'com_staff',
        };
        shellNav.requestNav(map[id]);
        return;
      }
      if (chapterProp) return;
      setChapterState(id);
    },
    [shellNav, chapterProp],
  );

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const [ev, mem] = await Promise.all([
        teamEventsService.listForUser(profile.uid, clubId),
        clubId ? usersService.listMembersByClubId(clubId) : Promise.resolve([] as User[]),
      ]);
      setEvents(ev);
      setMembers(mem);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile, clubId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (embedded) return;
    if (pendingDashboardView === 'gestion') {
      setShowGestion(true);
      clearPendingDashboard();
    } else if (pendingDashboardView === 'smart_tactics') {
      if (canSmartTactics) setShowSmartTactics(true);
      else {
        Alert.alert(
          'Tactique IA',
          'Inclus avec Coach Pro, ou si ton club a l’offre Tout inclus.',
        );
      }
      clearPendingDashboard();
    }
  }, [pendingDashboardView, clearPendingDashboard, canSmartTactics, embedded]);

  if (!profile) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!embedded && showSmartTactics) {
    return (
      <PushScreenTransition active={showSmartTactics}>
        <SmartTacticsPortalScreen
          onBack={() => {
            setShowSmartTactics(false);
            void load();
          }}
        />
      </PushScreenTransition>
    );
  }

  if (!embedded && showGestion) {
    return (
      <PushScreenTransition active={showGestion}>
        <TeamManagementScreen
          profile={profile}
          onBack={() => {
            setShowGestion(false);
            void load();
          }}
        />
      </PushScreenTransition>
    );
  }

  const chapterProps = {
    profile,
    events,
    members,
    refreshing,
    onRefresh: () => void load(),
    onOpenChapter: openChapter,
    onOpenSmartTactics: openSmartTactics,
  };

  const upcomingCount = events.filter((e) => e.starts_at.getTime() > Date.now()).length;
  const showStats = upcomingCount > 0 || members.length > 0;

  const body = (
    <View style={styles.stack}>
      {!hideRail ? <CoachChapterRail active={chapter} onChange={setChapter} /> : null}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <View style={styles.body}>
          {chapter === 'cockpit' ? <CoachCockpitChapter {...chapterProps} /> : null}
          {chapter === 'planning' ? <CoachPlanningChapter {...chapterProps} /> : null}
          {chapter === 'effectif' ? (
            <CoachEffectifChapter {...chapterProps} focus={effectifFocus} />
          ) : null}
          {chapter === 'matchs' ? <CoachMatchsChapter {...chapterProps} /> : null}
          {chapter === 'performance' ? <CoachPerformanceChapter {...chapterProps} /> : null}
          {chapter === 'communication' ? (
            <CoachCommunicationChapter {...chapterProps} />
          ) : null}
        </View>
      )}
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
      stats={
        showStats
          ? [
              {
                label: t('coach.portal.stat.upcoming'),
                value: String(upcomingCount),
              },
              { label: t('coach.portal.stat.roster'), value: String(members.length) },
            ]
          : undefined
      }
    >
      {body}
    </TabScreenShell>
  );
};

const styles = StyleSheet.create({
  stack: { flex: 1, minHeight: 0 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minHeight: 0 },
  embed: { flex: 1, minHeight: 0, backgroundColor: COACH_SITE.bg },
});
