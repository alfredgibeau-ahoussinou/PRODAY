import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminDataProvider, useAdminData } from '../context/AdminDataContext';
import { AdminGlobalSearch } from '../components/admin/AdminGlobalSearch';
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
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useAuth } from '../context/AuthContext';
import {
  ADMIN_FOC_NAV,
  ADMIN_FOC_TABS,
  resolveAdminFocNavigation,
  type AdminFocSectionId,
} from './adminFocConfig';
import { type AdminHqRoute } from './adminTabConfig';
import {
  loadAdminFocPreferences,
  saveAdminFocPreferences,
  DEFAULT_ADMIN_FOC_PREFS,
  type AdminFocPreferences,
} from '../services/adminPreferences.service';
import { adminChrome } from '../theme/adminTheme';
import { spacing } from '../theme/designTokens';

const DESKTOP_BREAKPOINT = 768;

interface AdminAppShellProps {
  onPreviewUserApp: () => void;
}

/* ─── Helper: AdminHqRoute → FOC section ───────────────────────────── */

function hqRouteToFocSection(route: AdminHqRoute): AdminFocSectionId {
  if (route.mode === 'pilotage') return 'dashboard';
  if (route.mode === 'decisions') return 'operations';
  if (route.mode === 'abonnements') return 'finances';
  if (route.mode === 'systeme') return 'plateforme';
  if (route.mode === 'gestion') {
    switch (route.atelier) {
      case 'comptes': return 'personnes';
      case 'clubs': return 'clubs';
      case 'matchs': return 'competition';
      case 'evenements':
      case 'tournois': return 'competition';
      case 'recrutement':
      case 'candidatures':
      case 'stages': return 'operations';
      case 'paiements':
      case 'devis':
      case 'partenaires': return 'finances';
      case 'publications':
      case 'signalements':
      case 'annonces':
      case 'messages':
      case 'fil': return 'operations';
      default: return 'personnes';
    }
  }
  return 'dashboard';
}

function hqRouteHubTab(route: AdminHqRoute): string | undefined {
  if (route.mode === 'decisions') return 'communication';
  if (route.mode === 'systeme') return 'parametres';
  if (route.mode === 'gestion') {
    switch (route.atelier) {
      case 'matchs': return 'matchs';
      case 'evenements':
      case 'tournois': return 'competitions';
      case 'recrutement':
      case 'candidatures':
      case 'stages': return 'recrutement';
      case 'publications':
      case 'signalements':
      case 'fil':
      case 'annonces':
      case 'messages': return 'communication';
      default: return undefined;
    }
  }
  return undefined;
}

function sectionTitle(section: AdminFocSectionId): string {
  return ADMIN_FOC_NAV.find((n) => n.id === section)?.label ?? 'Centre d\'ops';
}

/* ─── Gate / loader ─────────────────────────────────────────────────── */

export const AdminAppShell: React.FC<AdminAppShellProps> = ({ onPreviewUserApp }) => {
  const { isAdmin, claimLoading } = useIsAdmin();

  if (claimLoading) {
    return (
      <SafeAreaView style={shellStyles.loaderRoot} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={adminChrome.accent} />
        <Text style={shellStyles.loaderText}>Chargement du centre d'ops…</Text>
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
      <AdminFocShellInner onPreviewUserApp={onPreviewUserApp} />
    </AdminDataProvider>
  );
};

/* ─── Inner shell (inside AdminDataProvider) ────────────────────────── */

const AdminFocShellInner: React.FC<AdminAppShellProps> = ({ onPreviewUserApp }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const { profile } = useAuth();
  const { workQueue } = useAdminData();
  const insets = useSafeAreaInsets();

  /* ── Prefs ── */
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
        setSidebarCollapsed(p.sidebarCollapsed);
      })
      .catch(() => {})
      .finally(() => setPrefsLoaded(true));
  }, [profile?.uid]);

  const savePrefs = useCallback(
    async (next: AdminFocPreferences) => {
      const uid = profile?.uid ?? '';
      if (uid) await saveAdminFocPreferences(uid, next);
    },
    [profile?.uid],
  );

  /* ── Nav state ── */
  const [section, setSection] = useState<AdminFocSectionId>('dashboard');
  const [hubTab, setHubTab] = useState<string | undefined>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    DEFAULT_ADMIN_FOC_PREFS.sidebarCollapsed,
  );

  /* ── UI state ── */
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  /* ── Navigation handlers ── */
  const handleSelectSection = useCallback(
    (newSection: AdminFocSectionId) => {
      setSection(newSection);
      setHubTab(undefined);
      if (!isDesktop) setMobileMenu(false);
    },
    [isDesktop],
  );

  const handleNavigateSection = useCallback((target: string) => {
    const resolved = resolveAdminFocNavigation(target);
    setSection(resolved.section);
    setHubTab(resolved.hubTab);
  }, []);

  const handleHqNavigate = useCallback((route: AdminHqRoute) => {
    setSection(hqRouteToFocSection(route));
    setHubTab(hqRouteHubTab(route));
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

  /* ── Sidebar badges ── */
  const sidebarBadges = useMemo<Partial<Record<AdminFocSectionId, number>>>(
    () => ({
      operations: workQueue.length,
      personnes: workQueue.filter((w) => w.kind === 'verification').length,
    }),
    [workQueue],
  );

  /* ── Content renderer ── */
  const renderContent = useCallback(() => {
    switch (section) {
      case 'dashboard':
        return <AdminFocDashboard onNavigateSection={handleNavigateSection} />;
      case 'personnes':
        return <AdminFocAdherentsScreen />;
      case 'clubs':
        return <AdminFocClubsScreen />;
      case 'competition':
        return (
          <AdminFocSectionHub
            initialTab={hubTab}
            tabs={ADMIN_FOC_TABS.competition.map((tab) => ({
              id: tab.id,
              label: tab.label,
              render: () =>
                tab.id === 'matchs' ? (
                  <AdminFocMatchsScreen />
                ) : (
                  <AdminFocCompetitionsScreen />
                ),
            }))}
          />
        );
      case 'operations':
        return (
          <AdminFocSectionHub
            initialTab={hubTab}
            tabs={ADMIN_FOC_TABS.operations.map((tab) => ({
              id: tab.id,
              label: tab.label,
              render: () => {
                if (tab.id === 'recrutement') return <AdminFocRecrutementScreen />;
                if (tab.id === 'communication') return <AdminFocCommunicationScreen />;
                return <AdminFocVideoScreen />;
              },
            }))}
          />
        );
      case 'finances':
        return <AdminFocFinancesScreen />;
      case 'plateforme':
        return (
          <AdminFocSectionHub
            initialTab={hubTab}
            tabs={ADMIN_FOC_TABS.plateforme.map((tab) => ({
              id: tab.id,
              label: tab.label,
              render: () =>
                tab.id === 'performance' ? (
                  <AdminFocPerformanceScreen />
                ) : (
                  <AdminFocParametresScreen
                    prefs={prefs}
                    onChangePrefs={setPrefs}
                    onSavePrefs={handleSavePrefs}
                    onPreviewUserApp={onPreviewUserApp}
                  />
                ),
            }))}
          />
        );
      default:
        return <AdminFocDashboard onNavigateSection={handleNavigateSection} />;
    }
  }, [
    section,
    hubTab,
    prefs,
    handleNavigateSection,
    handleSavePrefs,
    onPreviewUserApp,
  ]);

  /* ── Sidebar (shared between desktop and mobile overlay) ── */
  const sidebar = (
    <AdminFocSidebar
      collapsed={sidebarCollapsed}
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
      showMenu={!isDesktop}
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

      {isDesktop ? (
        /* Desktop layout */
        <View style={shellStyles.desktopRow}>
          {sidebar}
          <View style={shellStyles.desktopMain}>
            {topBar}
            <View style={shellStyles.content}>{renderContent()}</View>
          </View>
        </View>
      ) : (
        /* Mobile layout — menu gauche plein écran, toujours déplié */
        <SafeAreaView style={shellStyles.mobileRoot} edges={['top', 'left', 'right', 'bottom']}>
          {topBar}
          <View style={shellStyles.content}>{renderContent()}</View>

          <Modal
            visible={mobileMenu}
            animationType="fade"
            transparent
            onRequestClose={() => setMobileMenu(false)}
          >
            <View style={shellStyles.mobileOverlay}>
              <View style={shellStyles.mobileSidebarWrap}>
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
              <Pressable
                style={shellStyles.mobileOverlayBg}
                onPress={() => setMobileMenu(false)}
                accessibilityLabel="Fermer le menu"
              />
            </View>
          </Modal>
        </SafeAreaView>
      )}

      {/* Notifications modal */}
      <Modal
        visible={notifOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setNotifOpen(false)}
      >
        <View style={[notifStyles.root, { paddingTop: insets.top }]}>
          <View style={notifStyles.header}>
            <Text style={notifStyles.title}>Décisions en attente</Text>
            <Pressable
              onPress={() => setNotifOpen(false)}
              style={notifStyles.closeBtn}
              accessibilityLabel="Fermer"
            >
              <Text style={notifStyles.closeText}>Fermer</Text>
            </Pressable>
          </View>
          <FlatList
            data={workQueue}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <View style={notifStyles.item}>
                <Text style={notifStyles.itemKind}>{item.kind ?? '—'}</Text>
                <Text style={notifStyles.itemId} numberOfLines={1}>
                  {item.entityId ?? item.id ?? '—'}
                </Text>
                <Text style={notifStyles.itemPriority}>{item.priority ?? ''}</Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={notifStyles.empty}>
                <Text style={notifStyles.emptyText}>Aucune décision en attente.</Text>
              </View>
            }
            contentContainerStyle={notifStyles.list}
          />
        </View>
      </Modal>

      {/* Global search */}
      <AdminGlobalSearch
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleHqNavigate}
        onNavigateSection={handleSelectSection}
      />
    </View>
  );
};

/* ─── Styles ─────────────────────────────────────────────────────────── */

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
  mobileOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(7,20,40,0.48)',
  },
  mobileOverlayBg: { flex: 1 },
  mobileSidebarWrap: {
    width: 288,
    height: '100%',
    backgroundColor: adminChrome.shell,
    shadowColor: '#071428',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
});

const notifStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminChrome.shellElevated },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminChrome.shellBorder,
    backgroundColor: adminChrome.shell,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: adminChrome.text,
    letterSpacing: -0.3,
  },
  closeBtn: { paddingHorizontal: spacing.sm, paddingVertical: 4 },
  closeText: {
    fontSize: 15,
    color: adminChrome.accent,
    fontWeight: '700',
  },
  list: { padding: spacing.md, gap: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: adminChrome.shell,
    borderRadius: adminChrome.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
  },
  itemKind: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: adminChrome.accent,
    textTransform: 'uppercase',
    minWidth: 80,
  },
  itemId: {
    flex: 1,
    fontSize: 13,
    color: adminChrome.text,
    fontWeight: '600',
  },
  itemPriority: {
    fontSize: 10,
    fontWeight: '700',
    color: adminChrome.textMuted,
    textTransform: 'uppercase',
  },
  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 14, color: adminChrome.textMuted },
});
