import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminDataProvider, useAdminData } from '../context/AdminDataContext';
import { AdminGlobalSearch } from '../components/admin/AdminGlobalSearch';
import { AdminPendingDecisionsModal } from '../components/admin/AdminPendingDecisionsModal';
import { AdminGateScreen } from '../screens/admin/AdminGateScreen';
import { AdminFocSidebar } from '../components/admin/foc/AdminFocSidebar';
import { AdminFocTopBar } from '../components/admin/foc/AdminFocTopBar';
import { AdminFocSectionHub } from '../components/admin/foc/AdminFocSectionHub';
import { AdminIntelligenceHome } from '../screens/admin/foc/AdminIntelligenceHome';
import { AdminFocMatchsScreen } from '../screens/admin/foc/AdminFocMatchsScreen';
import { AdminFocVideoScreen } from '../screens/admin/foc/AdminFocVideoScreen';
import { AdminFocRecrutementScreen } from '../screens/admin/foc/AdminFocRecrutementScreen';
import { AdminFocAdherentsScreen } from '../screens/admin/foc/AdminFocAdherentsScreen';
import { AdminFocClubsScreen } from '../screens/admin/foc/AdminFocClubsScreen';
import { AdminFocCompetitionsScreen } from '../screens/admin/foc/AdminFocCompetitionsScreen';
import { AdminFocCommunicationScreen } from '../screens/admin/foc/AdminFocCommunicationScreen';
import { AdminFocFinancesScreen } from '../screens/admin/foc/AdminFocFinancesScreen';
import { AdminFocParametresScreen } from '../screens/admin/foc/AdminFocParametresScreen';
import { AdminFocIaScreen } from '../screens/admin/foc/AdminFocIaScreen';
import { AdminFocSecuriteScreen } from '../screens/admin/foc/AdminFocSecuriteScreen';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useAuth } from '../context/AuthContext';
import {
  ADMIN_NAV_DESKTOP_BREAKPOINT,
  ADMIN_NAV_ITEMS,
  ADMIN_NAV_TABLET_BREAKPOINT,
  isAdminNavSectionId,
  resolveAdminNav,
  type AdminNavSectionId,
} from './adminNavConfig';
import { type AdminHqRoute } from './adminTabConfig';
import {
  loadAdminFocPreferences,
  saveAdminFocPreferences,
  DEFAULT_ADMIN_FOC_PREFS,
  type AdminFocPreferences,
} from '../services/adminPreferences.service';
import { adminChrome } from '../theme/adminTheme';
import { spacing } from '../theme/designTokens';
import { AdminAiCopilotProvider, AdminAiCopilotFab } from '../components/admin/AdminAiCopilot';

interface AdminAppShellProps {
  onPreviewUserApp: () => void;
}

function hqRouteToNav(route: AdminHqRoute): AdminNavSectionId {
  if (route.mode === 'pilotage') return 'dashboard';
  if (route.mode === 'decisions') return 'contenus';
  if (route.mode === 'abonnements') return 'business';
  if (route.mode === 'systeme') return 'parametres';
  if (route.mode === 'gestion') {
    switch (route.atelier) {
      case 'comptes':
        return 'users';
      case 'clubs':
        return 'clubs';
      case 'matchs':
      case 'evenements':
      case 'tournois':
        return 'activite';
      case 'recrutement':
      case 'candidatures':
      case 'stages':
        return 'clubs';
      case 'paiements':
      case 'devis':
      case 'partenaires':
        return 'business';
      case 'publications':
      case 'signalements':
      case 'annonces':
      case 'fil':
      case 'messages':
        return 'contenus';
      default:
        return 'users';
    }
  }
  return 'dashboard';
}

function sectionTitle(section: AdminNavSectionId): string {
  return ADMIN_NAV_ITEMS.find((n) => n.id === section)?.label ?? 'Console';
}

export const AdminAppShell: React.FC<AdminAppShellProps> = ({ onPreviewUserApp }) => {
  const { isAdmin, claimLoading, emailHint } = useIsAdmin();

  if (claimLoading) {
    return (
      <SafeAreaView style={shellStyles.loaderRoot} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={adminChrome.accent} />
        <Text style={shellStyles.loaderText}>Chargement de la console…</Text>
      </SafeAreaView>
    );
  }

  if (!isAdmin && !emailHint) {
    return (
      <SafeAreaView style={shellStyles.gateRoot} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="light" />
        <AdminGateScreen />
      </SafeAreaView>
    );
  }

  return (
    <AdminDataProvider>
      <AdminConsoleInner onPreviewUserApp={onPreviewUserApp} />
    </AdminDataProvider>
  );
};

const AdminConsoleInner: React.FC<AdminAppShellProps> = ({ onPreviewUserApp }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= ADMIN_NAV_DESKTOP_BREAKPOINT;
  const isTablet = width >= ADMIN_NAV_TABLET_BREAKPOINT && width < ADMIN_NAV_DESKTOP_BREAKPOINT;
  const { profile } = useAuth();
  const { workQueue, refresh } = useAdminData();

  const [prefs, setPrefs] = useState<AdminFocPreferences>(DEFAULT_ADMIN_FOC_PREFS);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    const uid = profile?.uid ?? '';
    if (!uid) {
      setPrefsLoaded(true);
      return;
    }
    loadAdminFocPreferences(uid)
      .then((p) => {
        setPrefs(p);
        setSidebarCollapsed(p.sidebarCollapsed || isTablet);
      })
      .catch(() => {})
      .finally(() => setPrefsLoaded(true));
  }, [profile?.uid, isTablet]);

  const savePrefs = useCallback(
    async (next: AdminFocPreferences) => {
      const uid = profile?.uid ?? '';
      if (uid) await saveAdminFocPreferences(uid, next);
    },
    [profile?.uid],
  );

  const [section, setSection] = useState<AdminNavSectionId>('dashboard');
  const [hubTab, setHubTab] = useState<string | undefined>();
  const [screenTab, setScreenTab] = useState<string | undefined>();
  const [focusId, setFocusId] = useState<string | undefined>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    DEFAULT_ADMIN_FOC_PREFS.sidebarCollapsed,
  );

  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
      return undefined;
    }
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSelectSection = useCallback(
    (newSection: AdminNavSectionId) => {
      setSection(newSection);
      setHubTab(undefined);
      setScreenTab(undefined);
      setFocusId(undefined);
      if (!isDesktop) setMobileMenu(false);
    },
    [isDesktop],
  );

  const handleNavigateSection = useCallback((target: string) => {
    const resolved = resolveAdminNav(target);
    setSection(resolved.section);
    setHubTab(resolved.hubTab);
    setScreenTab(resolved.screenTab);
    setFocusId(resolved.focusId);
  }, []);

  const handleNavigateTarget = useCallback(
    (target: { section: string; hubTab?: string; screenTab?: string; focusId?: string }) => {
      if (isAdminNavSectionId(target.section)) {
        setSection(target.section);
        setHubTab(target.hubTab);
        setScreenTab(target.screenTab);
        setFocusId(target.focusId);
        return;
      }
      const resolved = resolveAdminNav(target.section);
      setSection(resolved.section);
      setHubTab(target.hubTab ?? resolved.hubTab);
      setScreenTab(target.screenTab ?? resolved.screenTab);
      setFocusId(target.focusId ?? resolved.focusId);
    },
    [],
  );

  const handleHqNavigate = useCallback((route: AdminHqRoute) => {
    setSection(hqRouteToNav(route));
    setHubTab(undefined);
    setScreenTab(undefined);
    setFocusId(route.focusId);
    setSearchOpen(false);
  }, []);

  const handleCollapseToggle = useCallback(() => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    const nextPrefs = { ...prefs, sidebarCollapsed: next };
    setPrefs(nextPrefs);
    void savePrefs(nextPrefs);
  }, [sidebarCollapsed, prefs, savePrefs]);

  const handleSavePrefs = useCallback(() => {
    void savePrefs(prefs);
  }, [prefs, savePrefs]);

  const handleOpenUser = useCallback((uid: string) => {
    setSection('users');
    setScreenTab('all');
    setFocusId(uid);
    setHubTab(undefined);
  }, []);

  const sidebarBadges = useMemo<Partial<Record<AdminNavSectionId, number>>>(
    () => ({
      users: workQueue.filter((w) => w.kind === 'verification').length,
      clubs: workQueue.filter((w) =>
        ['membership', 'application', 'post'].includes(w.kind),
      ).length,
      business: workQueue.filter((w) =>
        ['payment', 'quote', 'subscription_request'].includes(w.kind),
      ).length,
      contenus: workQueue.filter((w) => ['reel', 'report'].includes(w.kind)).length,
      ia: workQueue.length,
    }),
    [workQueue],
  );

  const renderContent = useCallback(() => {
    const recutTab = ['apps', 'posts', 'bassin', 'players', 'recrutement'].includes(screenTab ?? '');
    switch (section) {
      case 'dashboard':
        return (
          <AdminIntelligenceHome
            onNavigateSection={handleNavigateSection}
            onNavigateTarget={handleNavigateTarget}
            onOpenDecisions={() => setNotifOpen(true)}
          />
        );
      case 'ia':
        return (
          <AdminFocIaScreen
            initialTab={screenTab}
            prefs={prefs}
            onChangePrefs={(next) => {
              setPrefs(next);
              void savePrefs(next);
            }}
            onNavigateTarget={handleNavigateTarget}
          />
        );
      case 'users':
        return <AdminFocAdherentsScreen initialTab={screenTab ?? 'all'} initialUserId={focusId} />;
      case 'clubs':
        if (recutTab) {
          return (
            <AdminFocRecrutementScreen
              initialTab={screenTab === 'recrutement' ? 'bassin' : screenTab}
            />
          );
        }
        return <AdminFocClubsScreen initialTab={screenTab ?? 'all'} />;
      case 'activite':
        return (
          <AdminFocSectionHub
            initialTab={hubTab}
            tabs={[
              {
                id: 'matchs',
                label: 'Matchs',
                render: () => <AdminFocMatchsScreen initialTab={screenTab} />,
              },
              {
                id: 'evenements',
                label: 'Entraînements',
                render: () => <AdminFocCompetitionsScreen initialTab={screenTab} />,
              },
              {
                id: 'video',
                label: 'Vidéo',
                render: () => <AdminFocVideoScreen />,
              },
            ]}
          />
        );
      case 'business':
        return (
          <AdminFocFinancesScreen
            initialTab={screenTab ?? 'vue'}
            onOpenUser={handleOpenUser}
          />
        );
      case 'contenus':
        return (
          <AdminFocCommunicationScreen
            initialTab={screenTab ?? 'decisions'}
            title="Contenu"
            allowedTabs={['decisions', 'fil', 'messages', 'signalements']}
          />
        );
      case 'securite':
        return (
          <AdminFocSecuriteScreen
            onPreviewUserApp={onPreviewUserApp}
            initialTab={screenTab}
            onNavigateTarget={handleNavigateTarget}
          />
        );
      case 'parametres':
        return (
          <AdminFocParametresScreen
            initialTab={screenTab ?? 'personnaliser'}
            prefs={prefs}
            onChangePrefs={setPrefs}
            onSavePrefs={handleSavePrefs}
            onPreviewUserApp={onPreviewUserApp}
          />
        );
      default:
        return (
          <AdminIntelligenceHome
            onNavigateSection={handleNavigateSection}
            onNavigateTarget={handleNavigateTarget}
          />
        );
    }
  }, [
    section,
    hubTab,
    screenTab,
    focusId,
    prefs,
    handleNavigateSection,
    handleNavigateTarget,
    handleSavePrefs,
    handleOpenUser,
    onPreviewUserApp,
    savePrefs,
  ]);

  const railCollapsed = isTablet ? true : sidebarCollapsed;

  const sidebar = (
    <AdminFocSidebar
      collapsed={railCollapsed}
      activeSection={section}
      sectionOrder={prefs.sectionOrder}
      hiddenSections={prefs.hiddenSections}
      primaryColor={prefs.primaryColor}
      badges={sidebarBadges}
      clubDisplayName={prefs.clubDisplayName}
      onToggleCollapse={handleCollapseToggle}
      onSelectSection={handleSelectSection}
    />
  );

  const topBar = (
    <AdminFocTopBar
      title={sectionTitle(section)}
      onSearch={() => setSearchOpen(true)}
      onNotifications={() => setNotifOpen(true)}
      onCommand={() => setSearchOpen(true)}
      notificationCount={workQueue.length}
      onMenu={() => setMobileMenu(true)}
      showMenu={!isDesktop && !isTablet}
    />
  );

  if (!prefsLoaded) {
    return (
      <SafeAreaView style={shellStyles.loaderRoot} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="light" />
        <ActivityIndicator size="small" color={adminChrome.accent} />
      </SafeAreaView>
    );
  }

  return (
    <AdminAiCopilotProvider onNavigate={handleNavigateTarget}>
    <View style={shellStyles.root}>
      <StatusBar style="light" />

      {isDesktop || isTablet ? (
        <View style={shellStyles.desktopRow}>
          {sidebar}
          <View style={shellStyles.desktopMain}>
            {topBar}
            <View style={shellStyles.content}>{renderContent()}</View>
          </View>
        </View>
      ) : (
        <SafeAreaView style={shellStyles.mobileRoot} edges={['top', 'left', 'right', 'bottom']}>
          {topBar}
          <View style={shellStyles.content}>{renderContent()}</View>

          <Modal
            visible={mobileMenu}
            animationType="slide"
            transparent
            onRequestClose={() => setMobileMenu(false)}
          >
            <View style={shellStyles.mobileOverlay}>
              <Pressable
                style={shellStyles.mobileOverlayBg}
                onPress={() => setMobileMenu(false)}
                accessibilityLabel="Fermer le menu"
              />
              <View style={shellStyles.mobileSheet}>
                <View style={shellStyles.sheetHandle} />
                <AdminFocSidebar
                  collapsed={false}
                  activeSection={section}
                  sectionOrder={prefs.sectionOrder}
                  hiddenSections={prefs.hiddenSections}
                  primaryColor={prefs.primaryColor}
                  badges={sidebarBadges}
                  clubDisplayName={prefs.clubDisplayName}
                  footerLabel="Fermer"
                  onToggleCollapse={() => setMobileMenu(false)}
                  onSelectSection={handleSelectSection}
                />
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      )}

      <AdminPendingDecisionsModal
        visible={notifOpen}
        items={workQueue}
        onClose={() => setNotifOpen(false)}
        onNavigate={handleNavigateTarget}
        onRefresh={refresh}
      />

      <AdminGlobalSearch
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleHqNavigate}
        onNavigateSection={handleSelectSection}
        onNavigateTarget={handleNavigateTarget}
      />
      <AdminAiCopilotFab />
    </View>
    </AdminAiCopilotProvider>
  );
};

const shellStyles = StyleSheet.create({
  loaderRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: adminChrome.band,
  },
  loaderText: { color: adminChrome.textMuted, fontSize: 14, fontWeight: '500' },
  gateRoot: { flex: 1, backgroundColor: adminChrome.band },
  root: { flex: 1, backgroundColor: adminChrome.band },
  desktopRow: { flex: 1, flexDirection: 'row' },
  desktopMain: { flex: 1, minWidth: 0, backgroundColor: adminChrome.band },
  mobileRoot: { flex: 1, backgroundColor: adminChrome.band },
  content: { flex: 1, backgroundColor: adminChrome.band },
  panelPage: { flex: 1, backgroundColor: adminChrome.band },
  mobileOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: adminChrome.scrim,
  },
  mobileOverlayBg: { flex: 1 },
  mobileSheet: {
    height: '88%',
    backgroundColor: adminChrome.shell,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: adminChrome.cardShadow,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 16,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: adminChrome.shellBorderStrong,
    marginTop: 8,
    marginBottom: 4,
  },
});
