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
import { AdminFocDashboard } from '../screens/admin/foc/AdminFocDashboard';
import { AdminFocMatchsScreen } from '../screens/admin/foc/AdminFocMatchsScreen';
import { AdminFocVideoScreen } from '../screens/admin/foc/AdminFocVideoScreen';
import { AdminFocRecrutementScreen } from '../screens/admin/foc/AdminFocRecrutementScreen';
import { AdminFocAdherentsScreen } from '../screens/admin/foc/AdminFocAdherentsScreen';
import { AdminFocClubsScreen } from '../screens/admin/foc/AdminFocClubsScreen';
import { AdminFocCompetitionsScreen } from '../screens/admin/foc/AdminFocCompetitionsScreen';
import { AdminFocCommunicationScreen } from '../screens/admin/foc/AdminFocCommunicationScreen';
import { AdminFocFinancesScreen } from '../screens/admin/foc/AdminFocFinancesScreen';
import { AdminFocPerformanceScreen } from '../screens/admin/foc/AdminFocPerformanceScreen';
import { AdminFocParametresScreen } from '../screens/admin/foc/AdminFocParametresScreen';
import { AdminFocIaScreen } from '../screens/admin/foc/AdminFocIaScreen';
import { AdminFocSecuriteScreen } from '../screens/admin/foc/AdminFocSecuriteScreen';
import { AdminFocMessagerieScreen } from '../screens/admin/foc/AdminFocMessagerieScreen';
import { AdminAuditLogPanel } from '../components/admin/AdminAuditLogPanel';
import { AdminFocConfigScreen } from '../screens/admin/foc/AdminFocConfigScreen';
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
import { AdminFocPageHeader } from '../components/admin/foc/AdminFocTabs';

interface AdminAppShellProps {
  onPreviewUserApp: () => void;
}

function hqRouteToNav(route: AdminHqRoute): AdminNavSectionId {
  if (route.mode === 'pilotage') return 'dashboard';
  if (route.mode === 'decisions') return 'signalements';
  if (route.mode === 'abonnements') return 'abonnements';
  if (route.mode === 'systeme') return 'config';
  if (route.mode === 'gestion') {
    switch (route.atelier) {
      case 'comptes':
        return 'users';
      case 'clubs':
        return 'clubs';
      case 'matchs':
        return 'matchs';
      case 'evenements':
      case 'tournois':
        return 'matchs';
      case 'recrutement':
      case 'candidatures':
      case 'stages':
        return 'recrutement';
      case 'paiements':
        return 'abonnements';
      case 'devis':
      case 'partenaires':
        return 'sponsors';
      case 'publications':
        return 'contenus';
      case 'signalements':
        return 'signalements';
      case 'annonces':
      case 'fil':
        return 'contenus';
      case 'messages':
        return 'messagerie';
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
  const { isAdmin, claimLoading } = useIsAdmin();

  if (claimLoading) {
    return (
      <SafeAreaView style={shellStyles.loaderRoot} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={adminChrome.accent} />
        <Text style={shellStyles.loaderText}>Chargement de la console…</Text>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={shellStyles.gateRoot} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="dark" />
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
      clubs: workQueue.filter((w) => w.kind === 'membership').length,
      recrutement: workQueue.filter((w) => ['application', 'post'].includes(w.kind)).length,
      abonnements: workQueue.filter((w) =>
        ['payment', 'quote', 'subscription_request'].includes(w.kind),
      ).length,
      signalements: workQueue.filter((w) => ['reel', 'report'].includes(w.kind)).length,
      contenus: workQueue.filter((w) => w.kind === 'reel').length,
    }),
    [workQueue],
  );

  const renderContent = useCallback(() => {
    switch (section) {
      case 'dashboard':
        return (
          <AdminFocDashboard
            onNavigateSection={handleNavigateSection}
            onNavigateTarget={handleNavigateTarget}
            onOpenDecisions={() => setNotifOpen(true)}
          />
        );
      case 'users':
        return <AdminFocAdherentsScreen initialTab={screenTab ?? 'all'} initialUserId={focusId} />;
      case 'coaches':
        return <AdminFocAdherentsScreen initialTab="coach" initialUserId={focusId} />;
      case 'players':
        return <AdminFocAdherentsScreen initialTab="player" initialUserId={focusId} />;
      case 'parents':
        return <AdminFocAdherentsScreen initialTab="parent" initialUserId={focusId} />;
      case 'clubs':
        return <AdminFocClubsScreen initialTab={screenTab ?? 'clubs'} />;
      case 'teams':
        return <AdminFocClubsScreen initialTab="teams" />;
      case 'matchs':
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
                id: 'competitions',
                label: 'Événements',
                render: () => <AdminFocCompetitionsScreen initialTab={screenTab} />,
              },
            ]}
          />
        );
      case 'recrutement':
        return <AdminFocRecrutementScreen initialTab={screenTab} />;
      case 'ia':
        return <AdminFocIaScreen />;
      case 'video':
        return <AdminFocVideoScreen />;
      case 'abonnements':
        return (
          <AdminFocFinancesScreen
            initialTab={screenTab ?? 'vue'}
            onOpenUser={handleOpenUser}
          />
        );
      case 'marketplace':
        return <AdminFocFinancesScreen initialTab="boutique" onOpenUser={handleOpenUser} />;
      case 'sponsors':
        return <AdminFocFinancesScreen initialTab="sponsors" onOpenUser={handleOpenUser} />;
      case 'contenus':
        return (
          <AdminFocCommunicationScreen
            initialTab={screenTab ?? 'annonces'}
            title="Contenus"
            allowedTabs={['annonces', 'fil', 'questions']}
          />
        );
      case 'messagerie':
        return <AdminFocMessagerieScreen />;
      case 'signalements':
        return (
          <AdminFocCommunicationScreen
            initialTab="decisions"
            title="Signalements"
            allowedTabs={['decisions']}
          />
        );
      case 'statistiques':
        return <AdminFocPerformanceScreen />;
      case 'parametres':
        return (
          <AdminFocParametresScreen
            initialTab="personnaliser"
            prefs={prefs}
            onChangePrefs={setPrefs}
            onSavePrefs={handleSavePrefs}
            onPreviewUserApp={onPreviewUserApp}
          />
        );
      case 'audit':
        return (
          <View style={shellStyles.panelPage}>
            <AdminFocPageHeader
              title="Journal d’activité"
              subtitle="Actions admin enregistrées (abonnements, comptes, contenus)."
            />
            <AdminAuditLogPanel />
          </View>
        );
      case 'securite':
        return <AdminFocSecuriteScreen onPreviewUserApp={onPreviewUserApp} />;
      case 'config':
        return <AdminFocConfigScreen />;
      default:
        return (
          <AdminFocDashboard
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
      notificationCount={workQueue.length}
      onMenu={() => setMobileMenu(true)}
      showMenu={!isDesktop && !isTablet}
    />
  );

  if (!prefsLoaded) {
    return (
      <SafeAreaView style={shellStyles.loaderRoot} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="dark" />
        <ActivityIndicator size="small" color={adminChrome.accent} />
      </SafeAreaView>
    );
  }

  return (
    <View style={shellStyles.root}>
      <StatusBar style="dark" />

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
    </View>
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
