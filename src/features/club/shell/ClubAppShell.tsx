import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { ClubSidebar } from './ClubSidebar';
import { ClubTabBar } from './ClubTabBar';
import { ClubShellNavProvider } from './ClubShellNavContext';
import { ClubThemeProvider, useClubTheme } from './ClubThemeContext';
import { ClubMenuPane } from './ClubMenuPane';
import { ClubCreateSheet } from './ClubCreateSheet';
import { ClubCreateFormModal } from '../create/ClubCreateFormModal';
import { ClubLockedPane } from './ClubLockedPane';
import { openClubHelpChatbot, registerClubCopilotOpener } from './clubHelpOpen';
import { ClubCopilotSheet } from '../ai/ClubCopilotSheet';
import {
  canonicalizeClubNav,
  clubNavFromDashboard,
  clubNavFromTab,
  CLUB_CREATE_ACTIONS,
  CLUB_MENU_DEST_IDS,
  CLUB_PRIMARY_NAV_IDS,
  resolveClubNavOnTabSync,
  tabFromClubNav,
  type ClubCreateActionId,
  type ClubNavItemId,
} from '../navigation/clubNavConfig';
import { useTabNavigation } from '../../../context/TabNavigationContext';
import { PaneTransition, useShellNavDirection } from '../../../motion';
import {
  findInClubNavCatalog,
  resolveClubMenuItems,
  resolveClubNavCatalog,
  resolveClubNavFolders,
  resolveClubPrimaryNav,
} from '../navigation/resolveClubNavAccess';
import { ClubAiAssistant } from '../ai/ClubAiAssistant';
import { ClubHomeScreen } from '../../../screens/club/ClubHomeScreen';
import { ClubTeamsScreen } from '../../../screens/club/ClubTeamsScreen';
import { ClubPlayersScreen } from '../../../screens/club/ClubPlayersScreen';
import { ClubCoachesScreen } from '../../../screens/club/ClubCoachesScreen';
import { ClubCalendarScreen } from '../../../screens/club/ClubCalendarScreen';
import { ClubMatchesScreen } from '../../../screens/club/ClubMatchesScreen';
import { ClubTrainingsScreen } from '../../../screens/club/ClubTrainingsScreen';
import { ClubCommunicationScreen } from '../../../screens/club/ClubCommunicationScreen';
import { ClubHubScreen, ClubPackScreen } from '../../../screens/club/ClubHubScreen';
import { renderClubSecondaryStub } from '../../../screens/club/ClubSecondaryScreens';
import { useAuth } from '../../../context/AuthContext';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { usePlatformFeatureFlags } from '../../../hooks/usePlatformFeatureFlags';
import { CLUB_OFFERS } from '../../../content/clubOffers';
import { resolveClubOfferId } from '../../../utils/clubFeatureAccess';
import type { MainTabId } from '../../../navigation/mainTabConfig';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { clubChrome } from '../theme/clubDesignSystem';
import { ClubPageChrome } from '../ui/ClubPageChrome';
import { usePresidentShellBridge } from '../../president/bridge/PresidentShellBridge';
import {
  canAccessPresidentPole,
  PRESIDENT_POLE_DENIED_BODY,
  PRESIDENT_POLE_DENIED_TITLE,
} from '../../president/navigation/canAccessPresidentPole';
import { useClubWorkspace } from '../hooks/useClubWorkspace';

const CLUB_MOTION_ORDER: ClubNavItemId[] = [
  ...CLUB_PRIMARY_NAV_IDS,
  ...CLUB_MENU_DEST_IDS,
];

type Props = {
  activeTab: MainTabId;
  onTabChange: (tab: MainTabId) => void;
};

/**
 * Shell Pôle Club — mobile dock 5 + FAB CRÉER · desktop sidebar collapsible + header chrome.
 * Visuel uniquement : routes, actions et permissions inchangées.
 */
export function ClubAppShell({ activeTab, onTabChange }: Props) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  return (
    <ClubThemeProvider activeTeamId={selectedTeamId}>
      <ClubAppShellInner
        activeTab={activeTab}
        onTabChange={onTabChange}
        selectedTeamId={selectedTeamId}
        setSelectedTeamId={setSelectedTeamId}
      />
    </ClubThemeProvider>
  );
}

function ClubAppShellInner({
  activeTab,
  onTabChange,
  selectedTeamId,
  setSelectedTeamId,
}: Props & {
  selectedTeamId: string | null;
  setSelectedTeamId: (id: string | null) => void;
}) {
  const { tokens } = useClubTheme();
  const profile = useSessionProfile();
  const { signOut } = useAuth();
  const { isEnabled } = usePlatformFeatureFlags();
  const ws = useClubWorkspace();
  const { width } = useWindowDimensions();
  const wide = width >= clubChrome.wideBreakpoint;
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const presidentBridge = usePresidentShellBridge();
  const { pendingDashboardView, clearPendingDashboard } = useTabNavigation();
  const { direction, noteNav } = useShellNavDirection(CLUB_MOTION_ORDER);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [navId, setNavId] = useState<ClubNavItemId>(() =>
    canonicalizeClubNav(clubNavFromTab(activeTab)),
  );
  const intendedNavRef = useRef<ClubNavItemId | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createFormAction, setCreateFormAction] = useState<ClubCreateActionId | null>(null);
  const [selectedPlayerUid, setSelectedPlayerUid] = useState<string | null>(null);
  const [playersPendingFocus, setPlayersPendingFocus] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  const applyNav = useCallback((id: ClubNavItemId) => {
    const next = canonicalizeClubNav(id);
    noteNav(next);
    intendedNavRef.current = next;
    setNavId(next);
    if (next !== 'teams') setSelectedTeamId(null);
    if (next !== 'players') setSelectedPlayerUid(null);
    const nextTab = tabFromClubNav(next);
    if (nextTab !== activeTab) {
      onTabChange(nextTab);
    } else {
      intendedNavRef.current = null;
    }
  }, [activeTab, noteNav, onTabChange, setSelectedTeamId]);

  const offerId = resolveClubOfferId(profile);
  const formulaLabel = offerId ? CLUB_OFFERS[offerId].label : 'Sans formule';

  const canOpenPresident = canAccessPresidentPole({
    role: profile?.role,
    uid: profile?.uid,
    clubId: ws.clubId ?? profile?.profile?.club_id,
    clubOwnerUid: ws.club?.owner_uid,
  });

  const access = useMemo(
    () => ({ offerId, isFeatureEnabled: isEnabled }),
    [offerId, isEnabled],
  );
  const folders = useMemo(() => resolveClubNavFolders(access), [access]);
  const catalog = useMemo(() => resolveClubNavCatalog(access), [access]);
  const primaryItems = useMemo(() => resolveClubPrimaryNav(access), [access]);
  const toolItems = useMemo(() => resolveClubMenuItems(access), [access]);

  useEffect(() => {
    const intended = intendedNavRef.current;
    intendedNavRef.current = null;
    setNavId((prev) => {
      const next = resolveClubNavOnTabSync(prev, activeTab, intended);
      if (next !== prev) noteNav(next);
      return next;
    });
  }, [activeTab, noteNav]);

  useEffect(() => {
    registerClubCopilotOpener(() => setCopilotOpen(true));
    return () => registerClubCopilotOpener(null);
  }, []);

  useEffect(() => {
    if (!presidentBridge?.pendingClubNav) return;
    const pending = presidentBridge.consumePendingClubNav();
    if (!pending) return;
    applyNav(pending);
  }, [presidentBridge, presidentBridge?.pendingClubNav, applyNav]);

  const clubName = profile?.display_name ?? 'Club';
  const resolved = findInClubNavCatalog(catalog, navId);
  const pageTitle = resolved?.label ?? 'Club';

  useEffect(() => {
    if (!pendingDashboardView) return;
    const dest = clubNavFromDashboard(pendingDashboardView);
    clearPendingDashboard();
    if (dest) applyNav(dest);
  }, [pendingDashboardView, clearPendingDashboard, applyNav]);

  const onSelect = (id: ClubNavItemId) => {
    applyNav(id);
  };

  const onOpenHelp = () => {
    if (!openClubHelpChatbot()) setCopilotOpen(true);
  };

  const onOpenPresident = () => {
    if (ws.loading) return;
    if (!canOpenPresident) {
      Alert.alert(PRESIDENT_POLE_DENIED_TITLE, PRESIDENT_POLE_DENIED_BODY);
      return;
    }
    presidentBridge?.openPresident();
  };

  const onSignOut = () => {
    Alert.alert('Se déconnecter', 'Voulez-vous quitter votre session club ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ]);
  };

  const openCreate = (action?: ClubCreateActionId) => {
    if (action) {
      const meta = CLUB_CREATE_ACTIONS.find((a) => a.id === action);
      if (meta?.nav) onSelect(meta.nav);
      setCreateFormAction(action);
      return;
    }
    setCreateOpen(true);
  };

  const onCreateSelect = (action: ClubCreateActionId, nav?: ClubNavItemId) => {
    if (nav) onSelect(nav);
    setCreateFormAction(action);
  };

  const sidebarWidth = sidebarCollapsed
    ? clubChrome.sidebarCollapsed
    : clubChrome.sidebarExpanded;

  const sidebarProps = {
    activeId: navId,
    clubName,
    formulaLabel,
    folders,
    onSelect,
    onOpenHelp,
    onSignOut,
    width: sidebarWidth,
    collapsed: sidebarCollapsed,
    onToggleCollapse: () => setSidebarCollapsed((v) => !v),
  } as const;

  const content =
    resolved?.locked ? (
      <ClubLockedPane item={resolved} />
    ) : (
      renderClubPane(navId, toolItems)
    );


  return (
    <ClubShellNavProvider
      requestNav={onSelect}
      openCreate={openCreate}
      openHelp={onOpenHelp}
      openPresident={profile?.role === 'club' ? onOpenPresident : undefined}
      signOut={onSignOut}
      selectedTeamId={selectedTeamId}
      setSelectedTeamId={setSelectedTeamId}
      selectedPlayerUid={selectedPlayerUid}
      setSelectedPlayerUid={setSelectedPlayerUid}
      openPlayersPending={() => {
        setPlayersPendingFocus(true);
        onSelect('players');
      }}
      playersPendingFocus={playersPendingFocus}
      clearPlayersPendingFocus={() => setPlayersPendingFocus(false)}
    >
      <StatusBar style="light" />
      <View style={[styles.root, !wide && styles.rootColumn]}>
        <LinearGradient
          colors={[tokens.bgWash, tokens.bgWashMid, 'transparent']}
          locations={[0, 0.2, 0.52]}
          start={{ x: 0.12, y: 0 }}
          end={{ x: 0.88, y: 0.72 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {wide ? <ClubSidebar {...sidebarProps} /> : null}

        <View style={styles.pane}>
          <ClubPageChrome
            title={pageTitle}
            visible={wide}
            clubName={clubName}
            onNotifications={() => onSelect('notifications')}
            onSearch={() => onSelect('plus')}
            onProfile={() => onSelect('club')}
            onOpenCopilot={onOpenHelp}
          />
          <View style={[styles.paneBody, wide ? styles.paneBodyWide : null]}>
            <PaneTransition sectionKey={navId} direction={direction} context="tab">
              {React.isValidElement(content) ? content : null}
            </PaneTransition>
          </View>
        </View>

        {!wide ? (
          <ClubTabBar items={primaryItems} activeId={navId} onSelect={onSelect} />
        ) : null}
      </View>

      <ClubCreateSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onSelect={onCreateSelect}
      />
      <ClubCreateFormModal
        visible={createFormAction != null}
        action={createFormAction}
        onClose={() => setCreateFormAction(null)}
      />
      <ClubCopilotSheet visible={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </ClubShellNavProvider>
  );
}

function renderClubPane(navId: ClubNavItemId, toolItems: ReturnType<typeof resolveClubMenuItems>) {
  const secondary = renderClubSecondaryStub(navId);
  if (secondary) return secondary;

  switch (navId) {
    case 'today':
      return <ClubHomeScreen />;
    case 'teams':
      return <ClubTeamsScreen />;
    case 'players':
      return <ClubPlayersScreen />;
    case 'coaches':
      return <ClubCoachesScreen />;
    case 'calendar':
      return <ClubCalendarScreen />;
    case 'matches':
      return <ClubMatchesScreen />;
    case 'trainings':
      return <ClubTrainingsScreen />;
    case 'communication':
      return <ClubCommunicationScreen />;
    case 'club':
      return <ClubHubScreen />;
    case 'pack':
      return <ClubPackScreen />;
    case 'plus':
      return <ClubMenuPane items={toolItems} />;
    case 'assistant':
      return <ClubAiAssistant />;
    default:
      return <ClubHomeScreen />;
  }
}

function createStyles(tokens: ClubThemeTokens) {
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
      backgroundColor: 'transparent',
    },
    paneBody: {
      flex: 1,
      minWidth: 0,
      minHeight: 0,
    },
    paneBodyWide: {
      width: '100%',
      maxWidth: clubChrome.contentMaxWidth,
      alignSelf: 'center',
    },
  });
}
