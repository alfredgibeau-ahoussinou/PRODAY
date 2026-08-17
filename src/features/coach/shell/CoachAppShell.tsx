import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { PushScreenTransition } from '../../../components/motion';
import { StatusBar } from 'expo-status-bar';
import { CoachSidebar } from './CoachSidebar';
import { CoachTabBar } from './CoachTabBar';
import { CoachShellNavProvider } from './CoachShellNavContext';
import { CoachLockedPane } from './CoachLockedPane';
import { openCoachHelpChatbot } from './coachHelpOpen';
import {
  canonicalizeCoachNav,
  coachNavFromTab,
  resolveCoachNavOnTabSync,
  tabFromCoachNav,
  type CoachNavItemId,
} from '../navigation/coachNavConfig';
import {
  findInCoachNavCatalog,
  resolveCoachMenuItems,
  resolveCoachNavCatalog,
  resolveCoachNavFolders,
} from '../navigation/resolveCoachNavAccess';
import { CoachPageFrame } from '../../../components/coach/CoachPageFrame';
import {
  COACH_LOCKED_IDENTITY,
  COACH_SITE,
  getCoachPageIdentity,
} from '../../../content/coachPageIdentity';
import { CoachPortalScreen } from '../../../screens/coach/CoachPortalScreen';
import { CoachMesVideosScreen } from '../../../screens/coach/CoachMesVideosScreen';
import { CoachAiHubScreen } from '../../../screens/coach/CoachAiHubScreen';
import { SmartTacticsPortalScreen } from '../../../screens/smartTactics/SmartTacticsPortalScreen';
import { TeamManagementScreen } from '../../../screens/TeamManagementScreen';
import { MessagesScreen } from '../../../screens/MessagesScreen';
import { CoachMenuPane } from './CoachMenuPane';
import { CarpoolScreen } from '../../../screens/CarpoolScreen';
import { ProfilTabScreen } from '../../../screens/ProfilTabScreen';
import { useAuth } from '../../../context/AuthContext';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { useTabNavigation } from '../../../context/TabNavigationContext';
import { CoachMatchEventHub } from '../../../screens/coach/CoachMatchEventHub';
import type { MatchHubChapterId } from '../../../content/matchHubChapters';
import {
  resolveCoachMatchHubOverlay,
  shouldKeepCoachMatchHubOverlay,
} from '../navigation/coachMatchDeepLink';
import { usersService } from '../../../services/users.service';
import {
  resolveClubCoversCoachFromMembers,
  userCanAccessSmartTactics,
} from '../../../utils/clubFeatureAccess';
import { isSubscriptionAccessActive } from '../../../utils/subscriptionLogic';
import { usePlatformFeatureFlags } from '../../../hooks/usePlatformFeatureFlags';
import type { MainTabId } from '../../../navigation/mainTabConfig';
import type { User } from '../../../models/User';
import { useCoachShellNav } from './CoachShellNavContext';

const SIDEBAR_WIDTH = 248;
const WIDE_BREAKPOINT = 900;

function CoachGestionPane({ profile }: { profile: User }) {
  const shellNav = useCoachShellNav();
  return (
    <TeamManagementScreen
      profile={profile}
      onBack={() => shellNav?.requestNav('equipe')}
    />
  );
}

type Props = {
  activeTab: MainTabId;
  onTabChange: (tab: MainTabId) => void;
};

/**
 * Shell Pôle Coach — 5 onglets (Accueil, Équipe, IA, Menu, Profil).
 */
export function CoachAppShell({ activeTab, onTabChange }: Props) {
  const profile = useSessionProfile();
  const { signOut } = useAuth();
  const {
    pendingDashboardView,
    clearPendingDashboard,
    pendingMatchsLink,
    clearPendingMatchs,
    openCarpool,
  } = useTabNavigation();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;
  const styles = useMemo(() => createStyles(), []);

  const [members, setMembers] = useState<User[]>([]);
  const clubId = profile?.profile.club_id;

  useEffect(() => {
    if (!clubId) {
      setMembers([]);
      return;
    }
    void usersService.listMembersByClubId(clubId).then(setMembers).catch(() => setMembers([]));
  }, [clubId]);

  const clubCoversCoach = useMemo(
    () => resolveClubCoversCoachFromMembers(members),
    [members],
  );
  const canSmartTactics = userCanAccessSmartTactics(profile, { clubCoversCoach });
  const { isEnabled } = usePlatformFeatureFlags();
  const canVideo = isEnabled('coach_video');
  const formulaLabel = clubCoversCoach
    ? 'Couvert club'
    : profile && isSubscriptionAccessActive(profile)
      ? 'Coach Pro'
      : 'Gratuit';

  const access = useMemo(
    () => ({ canSmartTactics, canVideo }),
    [canSmartTactics, canVideo],
  );
  const catalog = useMemo(() => resolveCoachNavCatalog(access), [access]);
  const folders = useMemo(() => resolveCoachNavFolders(access), [access]);
  const toolItems = useMemo(() => resolveCoachMenuItems(access), [access]);
  const primaryItems = useMemo(
    () => folders.flatMap((folder) => folder.items),
    [folders],
  );

  const [navId, setNavId] = useState<CoachNavItemId>(() =>
    canonicalizeCoachNav(coachNavFromTab(activeTab)),
  );
  const [matchHubOverlay, setMatchHubOverlay] = useState<{
    eventId: string;
    hubChapter: MatchHubChapterId;
  } | null>(null);

  const syncMatchCenterNav = useCallback(() => {
    setNavId((prev) =>
      canonicalizeCoachNav(prev) === 'match_center' ? prev : 'match_center',
    );
    const nextTab = tabFromCoachNav('match_center');
    if (nextTab !== activeTab) {
      onTabChange(nextTab);
    }
  }, [activeTab, onTabChange]);

  useEffect(() => {
    setNavId((prev) => resolveCoachNavOnTabSync(prev, activeTab));
  }, [activeTab]);

  useEffect(() => {
    if (!shouldKeepCoachMatchHubOverlay(activeTab)) {
      setMatchHubOverlay(null);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!pendingMatchsLink) return;
    const hubOverlay = resolveCoachMatchHubOverlay(pendingMatchsLink);
    if (hubOverlay) {
      setMatchHubOverlay(hubOverlay);
      syncMatchCenterNav();
    }
    clearPendingMatchs();
  }, [pendingMatchsLink, clearPendingMatchs, syncMatchCenterNav]);

  useEffect(() => {
    if (pendingDashboardView === 'smart_tactics') {
      setNavId('smart_tactics');
      onTabChange(tabFromCoachNav('smart_tactics'));
      clearPendingDashboard();
    } else if (pendingDashboardView === 'gestion') {
      setNavId('gestion');
      onTabChange(tabFromCoachNav('gestion'));
      clearPendingDashboard();
    }
  }, [pendingDashboardView, clearPendingDashboard, onTabChange]);

  const coachName = profile?.display_name ?? 'Coach';
  const resolved = findInCoachNavCatalog(catalog, navId);

  const onSelect = (id: CoachNavItemId) => {
    setMatchHubOverlay(null);
    const next = canonicalizeCoachNav(id);
    setNavId(next);
    const nextTab = tabFromCoachNav(next);
    if (nextTab !== activeTab) {
      onTabChange(nextTab);
    }
  };

  const onOpenHelp = () => {
    openCoachHelpChatbot();
  };

  const onSignOut = () => {
    Alert.alert('Se déconnecter', 'Quitter la session coach ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
  };

  const sidebarProps = {
    activeId: navId,
    coachName,
    formulaLabel,
    folders,
    onSelect,
    onOpenHelp,
    onSignOut,
    width: SIDEBAR_WIDTH,
  } as const;

  const content =
    resolved?.locked ? (
      <CoachPageFrame identity={COACH_LOCKED_IDENTITY} showHero={false}>
        <CoachLockedPane item={resolved} />
      </CoachPageFrame>
    ) : (
      wrapCoachPane(navId, renderCoachPane(navId, profile, toolItems))
    );

  return (
    <CoachShellNavProvider requestNav={onSelect} openHelp={onOpenHelp} signOut={onSignOut}>
      <StatusBar style="light" />
      <View style={[styles.root, !wide && styles.rootColumn]}>
        {wide ? <CoachSidebar {...sidebarProps} /> : null}

        <View style={styles.pane}>
          {content}
          <PushScreenTransition
            active={Boolean(matchHubOverlay)}
            backgroundColor={COACH_SITE.bg}
          >
            {matchHubOverlay ? (
              <CoachMatchEventHub
                eventId={matchHubOverlay.eventId}
                initialChapter={matchHubOverlay.hubChapter}
                onBack={() => setMatchHubOverlay(null)}
                onOpenCarpool={() => {
                  setMatchHubOverlay(null);
                  openCarpool({
                    chapter: 'reserver',
                    eventId: matchHubOverlay.eventId,
                  });
                }}
              />
            ) : null}
          </PushScreenTransition>
        </View>

        {!wide ? (
          <CoachTabBar items={primaryItems} activeId={navId} onSelect={onSelect} />
        ) : null}
      </View>
    </CoachShellNavProvider>
  );
}

function wrapCoachPane(navId: CoachNavItemId, node: React.ReactNode) {
  const identity = getCoachPageIdentity(navId);
  return (
    <CoachPageFrame identity={identity} showHero={false}>
      {node}
    </CoachPageFrame>
  );
}

function renderCoachPane(
  navId: CoachNavItemId,
  profile: User | null | undefined,
  toolItems: ReturnType<typeof resolveCoachMenuItems>,
) {
  switch (canonicalizeCoachNav(navId)) {
    case 'today':
    case 'pitch':
      return <CoachPortalScreen embedded hideRail chapter="cockpit" />;
    case 'plus':
      return <CoachMenuPane items={toolItems} />;
    case 'equipe':
    case 'effectif':
      return <CoachPortalScreen embedded hideRail chapter="effectif" effectifFocus="all" />;
    case 'joueurs':
      return <CoachPortalScreen embedded hideRail chapter="effectif" effectifFocus="joueurs" />;
    case 'entrainements':
    case 'planning':
      return <CoachPortalScreen embedded hideRail chapter="planning" />;
    case 'forme':
      return <CoachPortalScreen embedded hideRail chapter="performance" />;
    case 'com_staff':
      return <CoachPortalScreen embedded hideRail chapter="communication" />;
    case 'coach_ia':
      return <CoachAiHubScreen />;
    case 'smart_tactics':
      return <SmartTacticsPortalScreen />;
    case 'mes_videos':
      return profile ? <CoachMesVideosScreen profile={profile} /> : null;
    case 'gestion':
      return profile ? <CoachGestionPane profile={profile} /> : null;
    case 'match_center':
    case 'matchs':
      return (
        <CoachPortalScreen
          key="coach-portal-matchs"
          embedded
          hideRail
          chapter="matchs"
        />
      );
    case 'messages':
      return <MessagesScreen />;
    case 'carpool':
      return <CarpoolScreen />;
    case 'profil':
      return <ProfilTabScreen />;
    default:
      return <CoachPortalScreen embedded hideRail chapter="cockpit" />;
  }
}

function createStyles() {
  return StyleSheet.create({
    root: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: COACH_SITE.bg,
      minHeight: 0,
    },
    rootColumn: { flexDirection: 'column' },
    pane: {
      flex: 1,
      minWidth: 0,
      minHeight: 0,
      backgroundColor: COACH_SITE.bg,
      overflow: 'hidden',
    },
  });
}
