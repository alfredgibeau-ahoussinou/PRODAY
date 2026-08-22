import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { PushScreenTransition } from '../../../components/motion';
import {
  PaneTransition,
  useShellNavDirection,
} from '../../../motion';
import { StatusBar } from 'expo-status-bar';
import { CoachSidebar } from './CoachSidebar';
import { CoachTabBar } from './CoachTabBar';
import { CoachShellNavProvider } from './CoachShellNavContext';
import { CoachLockedPane } from './CoachLockedPane';
import { openCoachHelpChatbot } from './coachHelpOpen';
import {
  canonicalizeCoachNav,
  coachNavFromTab,
  COACH_PRIMARY_NAV_IDS,
  COACH_SECONDARY_NAV_IDS,
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
import { CoachEmptyState } from '../../../components/coach/coachPortalUi';
import {
  COACH_LOCKED_IDENTITY,
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
import { CoachEventHubRouter } from '../../../screens/coach/CoachEventHubRouter';
import type { MatchHubChapterId } from '../../../content/matchHubChapters';
import {
  resolveCoachEventHubOverlay,
  resolveCoachNavFromMatchsLink,
  shouldKeepCoachEventHubOverlay,
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
import { CoachThemeProvider, useCoachTheme } from './CoachThemeContext';

const COACH_MOTION_ORDER: CoachNavItemId[] = [
  ...COACH_PRIMARY_NAV_IDS,
  ...COACH_SECONDARY_NAV_IDS,
];

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
  return (
    <CoachThemeProvider>
      <CoachAppShellInner activeTab={activeTab} onTabChange={onTabChange} />
    </CoachThemeProvider>
  );
}

function CoachAppShellInner({ activeTab, onTabChange }: Props) {
  const { tokens } = useCoachTheme();
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
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const { direction, noteNav } = useShellNavDirection(COACH_MOTION_ORDER);

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
  const [eventHubOverlay, setEventHubOverlay] = useState<{
    eventId: string;
    hubChapter?: MatchHubChapterId;
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
    setNavId((prev) => {
      const next = resolveCoachNavOnTabSync(prev, activeTab);
      if (next !== prev) noteNav(next);
      return next;
    });
  }, [activeTab, noteNav]);

  useEffect(() => {
    if (!shouldKeepCoachEventHubOverlay(activeTab, navId)) {
      setEventHubOverlay(null);
    }
  }, [activeTab, navId]);

  useEffect(() => {
    if (!pendingMatchsLink) return;
    const hubOverlay = resolveCoachEventHubOverlay(pendingMatchsLink);
    if (hubOverlay) {
      setEventHubOverlay(hubOverlay);
      if (pendingMatchsLink.hubChapter) {
        syncMatchCenterNav();
      }
      clearPendingMatchs();
      return;
    }
    const coachNav = resolveCoachNavFromMatchsLink(pendingMatchsLink);
    if (coachNav) {
      setEventHubOverlay(null);
      const next = canonicalizeCoachNav(coachNav);
      noteNav(next);
      setNavId(next);
      const nextTab = tabFromCoachNav(next);
      if (nextTab !== activeTab) {
        onTabChange(nextTab);
      }
      clearPendingMatchs();
      return;
    }
    clearPendingMatchs();
  }, [pendingMatchsLink, clearPendingMatchs, syncMatchCenterNav, activeTab, onTabChange, noteNav]);

  useEffect(() => {
    if (pendingDashboardView === 'smart_tactics') {
      noteNav('smart_tactics');
      setNavId('smart_tactics');
      onTabChange(tabFromCoachNav('smart_tactics'));
      clearPendingDashboard();
    } else if (pendingDashboardView === 'gestion') {
      noteNav('gestion');
      setNavId('gestion');
      onTabChange(tabFromCoachNav('gestion'));
      clearPendingDashboard();
    }
  }, [pendingDashboardView, clearPendingDashboard, onTabChange, noteNav]);

  const coachName = profile?.display_name ?? 'Coach';
  const resolved = findInCoachNavCatalog(catalog, navId);

  const onSelect = (id: CoachNavItemId) => {
    setEventHubOverlay(null);
    const next = canonicalizeCoachNav(id);
    noteNav(next);
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
      <StatusBar style={tokens.isLight ? 'dark' : 'light'} />
      <View style={[styles.root, !wide && styles.rootColumn]}>
        {wide ? <CoachSidebar {...sidebarProps} /> : null}

        <View style={styles.pane}>
          <PaneTransition sectionKey={navId} direction={direction}>
            {React.isValidElement(content) ? content : null}
          </PaneTransition>
          <PushScreenTransition
            active={Boolean(eventHubOverlay)}
            backgroundColor={tokens.bg}
          >
            {eventHubOverlay ? (
              <CoachEventHubRouter
                eventId={eventHubOverlay.eventId}
                initialChapter={eventHubOverlay.hubChapter ?? 'apercu'}
                onBack={() => setEventHubOverlay(null)}
                onOpenCarpool={() => {
                  setEventHubOverlay(null);
                  openCarpool({
                    chapter: 'reserver',
                    eventId: eventHubOverlay.eventId,
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
      return profile ? (
        <CoachMesVideosScreen profile={profile} />
      ) : (
        <CoachEmptyState
          title="Mes vidéos"
          body="Connectez-vous pour ouvrir vos captations match."
        />
      );
    case 'gestion':
      return profile ? (
        <CoachGestionPane profile={profile} />
      ) : (
        <CoachEmptyState
          title="Gestion"
          body="Connectez-vous pour accéder à la gestion d’équipe."
        />
      );
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

function createStyles(tokens: { bg: string }) {
  return StyleSheet.create({
    root: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: tokens.bg,
      minHeight: 0,
    },
    rootColumn: { flexDirection: 'column' },
    pane: {
      flex: 1,
      minWidth: 0,
      minHeight: 0,
      backgroundColor: tokens.bg,
      overflow: 'hidden',
    },
  });
}
