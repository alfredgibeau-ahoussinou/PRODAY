import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { prodayAlert } from '../../../utils/prodayAlert';
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
  resolveClubFallbackNav,
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
import { ClubStandingsScreen } from '../../../screens/club/ClubStandingsScreen';
import { ClubMembershipRequestsScreen } from '../../../screens/club/ClubMembershipRequestsScreen';
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
import { GlobalSearchBar } from '../../../components/search/GlobalSearchBar';
import { GlobalSearchModal } from '../../../components/search/GlobalSearchModal';
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
  const [history, setHistory] = useState<ClubNavItemId[]>([]);
  const intendedNavRef = useRef<ClubNavItemId | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createFormAction, setCreateFormAction] = useState<ClubCreateActionId | null>(null);
  const [selectedPlayerUid, setSelectedPlayerUid] = useState<string | null>(null);
  /** Événement ciblé par la recherche, transmis au calendrier pour ouverture directe. */
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [playersPendingFocus, setPlayersPendingFocus] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const applyNav = useCallback(
    (id: ClubNavItemId, options?: { replace?: boolean; clearHistory?: boolean }) => {
      const next = canonicalizeClubNav(id);
      const current = canonicalizeClubNav(navId);

      if (options?.clearHistory) {
        setHistory([]);
      } else if (options?.replace) {
        // do not append to history
      } else if (next !== current) {
        setHistory((prev) => [...prev.slice(-29), current]);
      }

      noteNav(next);
      intendedNavRef.current = next;
      setNavId(next);
      if (next !== 'teams') setSelectedTeamId(null);
      if (next !== 'players') setSelectedPlayerUid(null);
      // On oublie l'événement ciblé dès qu'on quitte le calendrier, pour ne pas le rouvrir
      // à chaque retour sur l'onglet.
      if (next !== 'calendar') setSelectedEventId(null);
      const nextTab = tabFromClubNav(next);
      if (nextTab !== activeTab) {
        onTabChange(nextTab);
      } else {
        intendedNavRef.current = null;
      }
    },
    [activeTab, navId, noteNav, onTabChange, setSelectedTeamId],
  );

  const fallback = resolveClubFallbackNav(navId);
  const hasFallback =
    canonicalizeClubNav(fallback) !== canonicalizeClubNav(navId);
  const canGoBack =
    Boolean(selectedPlayerUid) ||
    Boolean(selectedTeamId) ||
    history.length > 0 ||
    hasFallback;

  const goBack = useCallback(() => {
    if (selectedPlayerUid) {
      setSelectedPlayerUid(null);
      return;
    }
    if (selectedTeamId) {
      setSelectedTeamId(null);
      return;
    }
    if (history.length > 0) {
      const previous = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      const next = canonicalizeClubNav(previous);
      noteNav(next);
      intendedNavRef.current = next;
      setNavId(next);
      if (next !== 'teams') setSelectedTeamId(null);
      if (next !== 'players') setSelectedPlayerUid(null);
      if (next !== 'calendar') setSelectedEventId(null);
      const nextTab = tabFromClubNav(next);
      if (nextTab !== activeTab) {
        onTabChange(nextTab);
      } else {
        intendedNavRef.current = null;
      }
      return;
    }

    const fb = resolveClubFallbackNav(navId);
    if (fb && canonicalizeClubNav(fb) !== canonicalizeClubNav(navId)) {
      const next = canonicalizeClubNav(fb);
      noteNav(next);
      intendedNavRef.current = next;
      setNavId(next);
      if (next !== 'teams') setSelectedTeamId(null);
      if (next !== 'players') setSelectedPlayerUid(null);
      if (next !== 'calendar') setSelectedEventId(null);
      const nextTab = tabFromClubNav(next);
      if (nextTab !== activeTab) {
        onTabChange(nextTab);
      } else {
        intendedNavRef.current = null;
      }
    }
  }, [selectedPlayerUid, selectedTeamId, history, navId, noteNav, activeTab, onTabChange, setSelectedTeamId]);

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

  const onSelect = (
    id: ClubNavItemId,
    options?: { replace?: boolean; clearHistory?: boolean },
  ) => {
    applyNav(id, options);
  };

  const onOpenHelp = () => {
    if (!openClubHelpChatbot()) setCopilotOpen(true);
  };

  const onOpenPresident = () => {
    if (ws.loading) return;
    if (!canOpenPresident) {
      prodayAlert.alert(PRESIDENT_POLE_DENIED_TITLE, PRESIDENT_POLE_DENIED_BODY);
      return;
    }
    presidentBridge?.openPresident();
  };

  const onSignOut = () => {
    // prodayAlert : fenêtre modale native sur iOS/Android, window.confirm sur
    // web (R-03 — Alert.alert y est silencieux et bloquait la déconnexion).
    prodayAlert.alert('Se déconnecter', 'Voulez-vous quitter votre session club ?', [
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
      renderClubPane(navId, toolItems, selectedEventId)
    );


  return (
    <ClubShellNavProvider
      history={history}
      canGoBack={canGoBack}
      goBack={goBack}
      requestNav={onSelect}
      openCreate={openCreate}
      openHelp={onOpenHelp}
      openPresident={profile?.role === 'club' ? onOpenPresident : undefined}
      openSearch={() => setSearchOpen(true)}
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
            showBack={canGoBack}
            onBack={goBack}
            fallbackNavId={fallback}
            onNotifications={() => onSelect('notifications')}
            onSearch={() => setSearchOpen(true)}
            onProfile={() => onSelect('club')}
            onOpenCopilot={onOpenHelp}
          />
          {/* Barre de recherche visible sur l'Accueil (mobile compris) — CA-07. */}
          {navId === 'today' ? (
            <View style={styles.homeSearchWrap}>
              <GlobalSearchBar
                onPress={() => setSearchOpen(true)}
                accent={tokens.accent}
                placeholder="Rechercher un membre, une équipe, un événement..."
              />
            </View>
          ) : null}
          <View style={[styles.paneBody, wide ? styles.paneBodyWide : null]}>
            <PaneTransition sectionKey={navId} direction={direction} context="tab">
              {React.isValidElement(content) ? content : null}
            </PaneTransition>
          </View>
        </View>

        {!wide ? (
          <ClubTabBar
            items={primaryItems}
            activeId={navId}
            onSelect={onSelect}
            onCreate={() => openCreate()}
          />
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
      {/* Recherche club — équipes et événements limités au club autorisé. */}
      <GlobalSearchModal
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        accent={tokens.accent}
        clubId={ws.clubId}
        onOpenTeam={(item) => {
          setSelectedTeamId(item.team.id);
          onSelect('teams');
        }}
        onOpenEvent={(item) => {
          // On transmet l'événement trouvé : le calendrier l'ouvre directement.
          setSelectedEventId(item.event.id);
          onSelect('calendar');
        }}
      />
    </ClubShellNavProvider>
  );
}

function renderClubPane(
  navId: ClubNavItemId,
  toolItems: ReturnType<typeof resolveClubMenuItems>,
  selectedEventId: string | null,
) {
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
    case 'memberships':
      return <ClubMembershipRequestsScreen />;
    case 'calendar':
      // Arrivée depuis la recherche : l'événement trouvé s'ouvre directement.
      return <ClubCalendarScreen initialEventId={selectedEventId} />;
    case 'matches':
      return <ClubMatchesScreen />;
    case 'trainings':
      return <ClubTrainingsScreen />;
    case 'standings':
      return <ClubStandingsScreen />;
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
    homeSearchWrap: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
      width: '100%',
      maxWidth: clubChrome.contentMaxWidth,
      alignSelf: 'center',
    },
  });
}
