import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { TeamEvent, RsvpStatus } from '../models/TeamEvent';
import type { MatchHubChapterId } from '../content/matchHubChapters';
import { MATCH_HUB_CHAPTERS } from '../content/matchHubChapters';
import { teamEventsService } from '../services/teamEvents.service';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { resolveLiveState } from '../utils/matchLive';
import { canViewTeamEvent, type SupporterFollowContext } from '../utils/teamEventAccess';
import { followsService } from '../services/follows.service';
import { EventLineupScreen } from './EventLineupScreen';
import { MatchLiveScoreboard } from '../components/matchs/hub/MatchLiveScoreboard';
import { MatchHubOverviewTab } from '../components/matchs/hub/MatchHubOverviewTab';
import { MatchHubLineupTab } from '../components/matchs/hub/MatchHubLineupTab';
import { MatchHubLiveTab } from '../components/matchs/hub/MatchHubLiveTab';
import { MatchHubStatsTab } from '../components/matchs/hub/MatchHubStatsTab';
import { MatchHubSquadTab } from '../components/matchs/hub/MatchHubSquadTab';
import { PressableSpring, PushScreenTransition } from '../components/motion';
import { prodayHaptics } from '../utils/prodayHaptics';
import { ProDayTabPager } from '../components/ui/ProDayTabPager';
import { ProDayText } from '../components/ui/ProDayText';
import { ProDaySurface } from '../components/ui/ProDaySurface';
import { ProDayGradient } from '../components/ui/ProDayGradient';
import { Icon } from '../components/ui/Icon';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { TAB_BAR_CONTENT_INSET } from '../navigation/tabBarLayout';
import { spacing } from '../theme/designTokens';
import { useJoueurSession } from '../context/JoueurSessionContext';
import { useJoueurTheme } from '../hooks/useJoueurTheme';
import {
  JoueurMatchSkinProvider,
} from '../components/matchs/matchCenterUi';
import { JoueurScreenChrome } from '../components/joueur/JoueurScreenChrome';
import { VeoMatchAssociateModal } from '../components/video/VeoMatchAssociateModal';

interface MatchEventHubScreenProps {
  eventId: string;
  onBack: () => void;
  initialChapter?: MatchHubChapterId;
  onOpenCarpool?: () => void;
}

type SubView = 'hub' | 'lineup_edit';

export const MatchEventHubScreen: React.FC<MatchEventHubScreenProps> = ({
  eventId,
  onBack,
  initialChapter = 'apercu',
  onOpenCarpool,
}) => {
  const { profile, isAdmin } = useAuth();
  const { openAuth } = useTabNavigation();
  const joueurSession = useJoueurSession();
  const joueurTheme = useJoueurTheme();
  const joueurLive =
    Boolean(joueurSession?.isJoueurPlayer && joueurSession.ready && !joueurSession.needsGate);
  const { colors: c, rootStyle } = useThemedScreen();
  const [subView, setSubView] = useState<SubView>('hub');
  const [event, setEvent] = useState<TeamEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState<MatchHubChapterId>(initialChapter);
  const [rsvpBusy, setRsvpBusy] = useState(false);
  const [supporterFollow, setSupporterFollow] = useState<SupporterFollowContext | null>(null);
  const [associateVeoOpen, setAssociateVeoOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setEvent(await teamEventsService.getById(eventId));
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setChapter(initialChapter);
  }, [initialChapter]);

  useEffect(() => {
    if (!profile?.uid || profile.role !== 'supporter') {
      setSupporterFollow(null);
      return;
    }
    void followsService.listByFollower(profile.uid).then((rows) => {
      setSupporterFollow({
        clubIds: new Set(rows.filter((f) => f.target_type === 'club').map((f) => f.target_id)),
        tournamentIds: new Set(
          rows.filter((f) => f.target_type === 'tournament').map((f) => f.target_id),
        ),
      });
    });
  }, [profile?.uid, profile?.role]);

  const isStaff =
    Boolean(isAdmin) ||
    profile?.role === 'coach' ||
    profile?.role === 'organizer' ||
    profile?.role === 'agent' ||
    profile?.role === 'club';

  const hasAccess = Boolean(
    event &&
      canViewTeamEvent(event, profile, {
        isAdmin,
        supporterFollow: supporterFollow ?? undefined,
      }),
  );
  const canManageLive = Boolean(isStaff || profile?.uid === event?.organizer_uid);
  const reportLocked = Boolean(event?.match_report_finalized_at) && !canManageLive;
  const live = useMemo(() => (event ? resolveLiveState(event) : null), [event]);

  const badges = useMemo(
    () => ({
      live:
        live?.status === 'live' || live?.status === 'halftime' ? 1 : undefined,
      composition: event?.lineup ? event.lineup.slots.length : undefined,
    }),
    [live?.status, event?.lineup],
  );

  const handleRsvp = async (status: RsvpStatus) => {
    if (!profile) return;
    setRsvpBusy(true);
    try {
      await teamEventsService.updateRsvp(eventId, profile.uid, status);
      prodayHaptics.rsvpConfirm();
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Réponse impossible.');
    } finally {
      setRsvpBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, rootStyle]}>
        <ActivityIndicator color={c.accent} size="large" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.centered, rootStyle]}>
        <PressableSpring style={styles.backRow} onPress={onBack} scaleTo={0.97} haptic>
          <Icon name="arrow-back" size={22} color={c.text} />
          <ProDayText variant="body" accent>
            Matchs
          </ProDayText>
        </PressableSpring>
        <ProDayText variant="body" muted>
          Événement introuvable.
        </ProDayText>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.root, rootStyle]}>
        <PressableSpring style={styles.backRow} onPress={onBack} scaleTo={0.97} haptic>
          <Icon name="arrow-back" size={22} color={c.text} />
          <ProDayText variant="body" accent>
            Matchs
          </ProDayText>
        </PressableSpring>
        <ProDaySurface variant="module" style={styles.guestBlock}>
          <Icon name="shield" size={32} color={c.textMuted} />
          <ProDayText variant="section">Hub match</ProDayText>
          <ProDayText variant="body" muted style={styles.guestBody}>
            Connectez-vous pour accéder à la composition, au live et aux stats de cet événement.
          </ProDayText>
          <PressableSpring onPress={() => openAuth('login')} scaleTo={0.97} haptic>
            <ProDayGradient kind="cta" style={styles.guestCta}>
              <ProDayText variant="caption" inverse style={styles.guestCtaText}>
                Se connecter
              </ProDayText>
            </ProDayGradient>
          </PressableSpring>
          <PressableSpring onPress={() => openAuth('signup')} scaleTo={0.98} haptic>
            <ProDayText variant="caption" accent style={styles.guestLink}>
              Créer un compte
            </ProDayText>
          </PressableSpring>
        </ProDaySurface>
      </View>
    );
  }

  if (!hasAccess) {
    return (
      <View style={[styles.root, rootStyle]}>
        <PressableSpring style={styles.backRow} onPress={onBack} scaleTo={0.97} haptic>
          <Icon name="arrow-back" size={22} color={c.text} />
          <ProDayText variant="body" accent>
            Matchs
          </ProDayText>
        </PressableSpring>
        <ProDaySurface variant="module" style={styles.guestBlock}>
          <Icon name="lock" size={32} color={c.textMuted} />
          <ProDayText variant="section">Accès restreint</ProDayText>
          <ProDayText variant="body" muted style={styles.guestBody}>
            Cet événement est réservé aux personnes convoquées ou au staff du club organisateur.
          </ProDayText>
        </ProDaySurface>
      </View>
    );
  }

  const pagePad = {
    paddingHorizontal: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.sm,
  };

  const pages = [
    {
      id: 'apercu' as const,
      render: () => (
        <ScrollView contentContainerStyle={pagePad} showsVerticalScrollIndicator={false}>
          <MatchHubOverviewTab
            event={event}
            profile={profile}
            isStaff={Boolean(isStaff)}
            onUpdated={load}
            onOpenCarpool={onOpenCarpool}
            onRsvp={handleRsvp}
            rsvpBusy={rsvpBusy}
            onOpenLineup={() => setChapter('composition')}
            onOpenLive={() => setChapter('live')}
            onAssociateVeo={event.club_id ? () => setAssociateVeoOpen(true) : undefined}
          />
        </ScrollView>
      ),
    },
    {
      id: 'live' as const,
      render: () => (
        <ScrollView contentContainerStyle={pagePad} showsVerticalScrollIndicator={false}>
          <MatchHubLiveTab
            event={event}
            profile={profile}
            canManage={canManageLive}
            reportLocked={reportLocked}
            onUpdated={load}
          />
        </ScrollView>
      ),
    },
    {
      id: 'composition' as const,
      render: () => (
        <ScrollView contentContainerStyle={pagePad} showsVerticalScrollIndicator={false}>
          <MatchHubLineupTab
            event={event}
            canEdit={canManageLive && !reportLocked}
            onEditLineup={() => setSubView('lineup_edit')}
          />
        </ScrollView>
      ),
    },
    {
      id: 'stats' as const,
      render: () => (
        <ScrollView contentContainerStyle={pagePad} showsVerticalScrollIndicator={false}>
          <MatchHubStatsTab event={event} profile={profile} onUpdated={load} />
        </ScrollView>
      ),
    },
    {
      id: 'effectif' as const,
      render: () => (
        <ScrollView contentContainerStyle={pagePad} showsVerticalScrollIndicator={false}>
          <MatchHubSquadTab
            event={event}
            profile={profile}
            isStaff={Boolean(isStaff)}
            onUpdated={load}
          />
        </ScrollView>
      ),
    },
  ];

  const hubShell = (
    <View style={[styles.root, joueurLive ? { backgroundColor: joueurTheme.shellBg } : rootStyle]}>
      <PressableSpring style={styles.backRow} onPress={onBack} scaleTo={0.98} haptic>
        <Icon
          name="arrow-back"
          size={22}
          color={joueurLive ? joueurTheme.ink : c.text}
        />
        <ProDayText variant="body" accent style={joueurLive ? { color: joueurTheme.accent } : undefined}>
          Matchs
        </ProDayText>
      </PressableSpring>

      <View style={styles.heroWrap}>
        <MatchLiveScoreboard state={live!} compact />
      </View>

      <View style={styles.pager}>
        <ProDayTabPager
          chapters={MATCH_HUB_CHAPTERS}
          pages={pages}
          activeChapter={chapter}
          onChapterChange={setChapter}
          showFooter={false}
          compact
          badges={badges}
        />
      </View>
    </View>
  );

  return (
    <>
      {joueurLive && joueurSession ? (
        <JoueurScreenChrome identity={joueurSession.identity} variant="minimal" hideHero>
          <JoueurMatchSkinProvider enabled>{hubShell}</JoueurMatchSkinProvider>
        </JoueurScreenChrome>
      ) : (
        hubShell
      )}
    <PushScreenTransition active={subView === 'lineup_edit' && Boolean(profile && event && hasAccess)}>
      {subView === 'lineup_edit' && profile && event && hasAccess ? (
        <EventLineupScreen
          eventId={eventId}
          onBack={() => {
            setSubView('hub');
            void load();
          }}
        />
      ) : null}
    </PushScreenTransition>
    {associateVeoOpen && event?.club_id ? (
      <VeoMatchAssociateModal
        visible
        clubId={event.club_id}
        createdByUid={profile?.uid ?? ''}
        eventId={event.id}
        eventTitle={event.title}
        scheduledAt={event.starts_at}
        onClose={() => setAssociateVeoOpen(false)}
        onSuccess={() => void load()}
      />
    ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  heroWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  pager: { flex: 1, minHeight: 0 },
  guestBlock: {
    margin: spacing.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  guestBody: { textAlign: 'center', lineHeight: 22 },
  guestCta: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  guestCtaText: { fontWeight: '800' },
  guestLink: { marginTop: spacing.xs, fontWeight: '700' },
});
