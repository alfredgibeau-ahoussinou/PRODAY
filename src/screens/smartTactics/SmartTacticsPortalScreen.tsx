import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import {
  SmartTacticsChapterRail,
  SmartTacticsCoachSkinProvider,
  SmartTacticsFlowHint,
} from '../../components/smartTactics/smartTacticsUi';
import {
  SmartBoardChapter,
  SmartCardsChapter,
  SmartDashboardChapter,
  SmartDevelopmentChapter,
  SmartHistoryChapter,
  SmartLiveChapter,
  SmartPrepChapter,
  SmartTrainingChapter,
  SmartVideoChapter,
} from '../../components/smartTactics/SmartTacticsChapters';
import { SmartTacticsPlayerHome, SmartTacticsPlayerHomeLoading } from '../../components/smartTactics/SmartTacticsPlayerHome';
import {
  resolveSmartTacticsDefaultChapter,
  type SmartTacticsChapterId,
} from '../../content/smartTacticsChapters';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useTranslation } from '../../context/LocaleContext';
import { useAppTheme } from '../../context/ProductLineContext';
import { useWearableHealth } from '../../hooks/useWearableHealth';
import { teamEventsService } from '../../services/teamEvents.service';
import { usersService } from '../../services/users.service';
import { wellnessCheckinsService } from '../../services/wellnessCheckins.service';
import { applyWearableToHealthInput } from '../../services/wearableHealth/mergeHealthInput';
import { computeHealthSnapshot } from '../../core/health/healthState.engine';
import { buildWellnessByUid } from '../../utils/wearableToWellness';
import type { TeamEvent } from '../../models/TeamEvent';
import type { User } from '../../models/User';
import type { TacticalPlan, WellnessSignals } from '../../models/SmartTactics';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { ProDayText } from '../../components/ui/ProDayText';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import { spacing } from '../../theme/designTokens';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { CoachPane } from '../../components/coach/CoachScreenHeader';
import { COACH_SITE, getCoachPageIdentity } from '../../content/coachPageIdentity';

interface SmartTacticsPortalScreenProps {
  onBack?: () => void;
  initialChapter?: SmartTacticsChapterId;
}

/** Smart Tactics — coach (compose) ou joueur (hub jeu interactif). */
export const SmartTacticsPortalScreen: React.FC<SmartTacticsPortalScreenProps> = ({
  onBack,
  initialChapter,
}) => {
  const profile = useSessionProfile();
  const { t } = useTranslation();
  const playerMode = profile?.role === 'player';
  const mode: 'coach' | 'player' = playerMode ? 'player' : 'coach';
  const { colors } = useAppTheme();
  const inCoachShell = Boolean(useCoachShellNav());
  const { metrics: wearableMetrics } = useWearableHealth();
  const [chapter, setChapter] = useState<SmartTacticsChapterId>(
    initialChapter ?? (playerMode ? 'inbox' : 'dashboard'),
  );
  const [defaultApplied, setDefaultApplied] = useState(Boolean(initialChapter));
  const [hydratePlan, setHydratePlan] = useState<TacticalPlan | null>(null);
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [checkinsByUid, setCheckinsByUid] = useState<Record<string, WellnessSignals>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const clubId = profile?.profile.club_id;

  const selfHealth = useMemo(() => {
    if (!wearableMetrics) return null;
    const input = applyWearableToHealthInput(
      {
        globalScore: 70,
        upcomingEventsCount: events.filter((e) => e.starts_at.getTime() > Date.now()).length,
        pendingConvocations: 0,
        recentMatchCount: 1,
        streakDays: 2,
        profileCompletion: 80,
      },
      wearableMetrics,
    );
    return computeHealthSnapshot(input);
  }, [wearableMetrics, events]);

  const wellnessByUid = useMemo(
    () =>
      buildWellnessByUid({
        members,
        selfUid: profile?.uid,
        selfWearable: wearableMetrics,
        selfHealth,
        checkinsByUid,
      }),
    [members, profile?.uid, wearableMetrics, selfHealth, checkinsByUid],
  );

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const [ev, mem, checkins] = await Promise.all([
        teamEventsService.listForUser(profile.uid, clubId),
        clubId ? usersService.listMembersByClubId(clubId) : Promise.resolve([] as User[]),
        clubId
          ? wellnessCheckinsService.listLatestForClub(clubId)
          : Promise.resolve({} as Record<string, WellnessSignals>),
      ]);
      setEvents(ev);
      setMembers(mem);
      setCheckinsByUid(checkins);
      if (!defaultApplied && !initialChapter) {
        setChapter(resolveSmartTacticsDefaultChapter(ev, mode));
        setDefaultApplied(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile, clubId, defaultApplied, initialChapter, mode]);

  useEffect(() => {
    void load();
  }, [load]);

  const openChapter = useCallback((id: SmartTacticsChapterId) => {
    if (id !== 'board') setHydratePlan(null);
    setChapter(id);
  }, []);

  if (!profile) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const chapterProps = {
    profile,
    events,
    members,
    wellnessByUid,
    refreshing,
    onRefresh: () => {
      setRefreshing(true);
      void load();
    },
    onOpenChapter: openChapter,
    hydratePlan,
    onHydratePlan: setHydratePlan,
  };

  if (playerMode) {
    const body = loading ? (
      <SmartTacticsPlayerHomeLoading accent={colors.accent} />
    ) : (
      <SmartTacticsPlayerHome {...chapterProps} />
    );

    if (onBack) {
      return (
        <View style={[styles.fill, { backgroundColor: JOUEUR_SITE.bg }]}>
          <ScreenHeader title="Tactics" onBack={onBack} />
          {body}
        </View>
      );
    }
    return <View style={styles.fill}>{body}</View>;
  }

  const body = (() => {
    switch (chapter) {
      case 'board':
        return <SmartBoardChapter {...chapterProps} />;
      case 'cards':
        return <SmartCardsChapter {...chapterProps} />;
      case 'prep':
        return <SmartPrepChapter {...chapterProps} />;
      case 'training':
        return <SmartTrainingChapter {...chapterProps} />;
      case 'development':
        return <SmartDevelopmentChapter {...chapterProps} />;
      case 'video':
        return <SmartVideoChapter {...chapterProps} />;
      case 'live':
        return <SmartLiveChapter {...chapterProps} />;
      case 'history':
        return <SmartHistoryChapter {...chapterProps} />;
      case 'dashboard':
      default:
        return <SmartDashboardChapter {...chapterProps} />;
    }
  })();

  const chrome = (
    <>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <>
          <SmartTacticsChapterRail active={chapter} onChange={openChapter} mode="coach" />
          <SmartTacticsFlowHint active={chapter} mode="coach" />
          {body}
        </>
      )}
    </>
  );

  if (onBack) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background }]}>
        <ScreenHeader title={t('smartTactics.title')} onBack={onBack} />
        {chrome}
      </View>
    );
  }

  if (inCoachShell) {
    return (
      <CoachPane title={getCoachPageIdentity('smart_tactics').title}>
        <SmartTacticsCoachSkinProvider enabled>
          <View style={[styles.fill, { backgroundColor: COACH_SITE.bg }]}>
            {loading ? (
              <View style={styles.loader}>
                <ActivityIndicator color={COACH_SITE.accent} />
              </View>
            ) : (
              <>
                <SmartTacticsChapterRail
                  active={chapter}
                  onChange={openChapter}
                  mode="coach"
                  coachSkin
                />
                {body}
              </>
            )}
          </View>
        </SmartTacticsCoachSkinProvider>
      </CoachPane>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <View style={styles.shellHead}>
        <ProDayText variant="caption" muted style={styles.shellKicker}>
          {t('smartTactics.eyebrow')}
        </ProDayText>
        <ProDayText variant="section">{t('smartTactics.title')}</ProDayText>
        <ProDayText variant="caption" muted>
          {t('smartTactics.subtitle')}
        </ProDayText>
      </View>
      {chrome}
    </View>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  shellHead: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: 2,
  },
  shellKicker: {
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '800',
    fontSize: 10,
  },
});
