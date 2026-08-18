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
import { AdminFocDashboard } from '../screens/admin/foc/AdminFocDashboard';
import { AdminFocRecrutementScreen } from '../screens/admin/foc/AdminFocRecrutementScreen';
import { AdminFocAdherentsScreen } from '../screens/admin/foc/AdminFocAdherentsScreen';
import { AdminFocClubsScreen } from '../screens/admin/foc/AdminFocClubsScreen';
import { AdminFocCommunicationScreen } from '../screens/admin/foc/AdminFocCommunicationScreen';
import { AdminFocFinancesScreen } from '../screens/admin/foc/AdminFocFinancesScreen';
import { AdminFocPerformanceScreen } from '../screens/admin/foc/AdminFocPerformanceScreen';
import { AdminFocParametresScreen } from '../screens/admin/foc/AdminFocParametresScreen';
import { AdminFocVideoScreen } from '../screens/admin/foc/AdminFocVideoScreen';
import { AdminMatchsEventsScreen } from '../screens/admin/foc/AdminMatchsEventsScreen';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useAuth } from '../context/AuthContext';
import {
  ADMIN_DESKTOP_BREAKPOINT,
  ADMIN_WORK_KIND_LABELS,
  ADMIN_PRIORITY_LABELS,
  getAdminNavItem,
  sectionTitle,
  type AdminScreenKey,
  type AdminSectionId,
} from './adminNavConfig';
import {
  loadAdminFocPreferences,
  saveAdminFocPreferences,
  DEFAULT_ADMIN_FOC_PREFS,
  type AdminFocPreferences,
} from '../services/adminPreferences.service';
import { buildAdminChrome, adminChrome as defaultChrome } from '../theme/adminTheme';
import { spacing } from '../theme/designTokens';
import {
  canAccessSection,
  filterSectionsForRole,
  resolveAdminRole,
} from '../utils/adminPermissions';
import { PressableSpring } from '../components/motion';
import type { AdminWorkItem } from '../utils/adminInsights';

interface AdminAppShellProps {
  onPreviewUserApp: () => void;
}

type ScreenRoute = {
  screen: AdminScreenKey;
  tab?: string;
};

function routeForSection(section: AdminSectionId): ScreenRoute {
  return getAdminNavItem(section)?.route ?? { screen: 'dashboard' };
}

export const AdminAppShell: React.FC<AdminAppShellProps> = ({ onPreviewUserApp }) => {
  const { isAdmin, claimLoading } = useIsAdmin();
  const chrome = defaultChrome;

  if (claimLoading) {
    return (
      <SafeAreaView style={shellStyles.loaderRoot} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={chrome.accent} />
        <Text style={shellStyles.loaderText}>Chargement du centre de contrôle…</Text>
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
      <AdminShellInner onPreviewUserApp={onPreviewUserApp} />
    </AdminDataProvider>
  );
};

const AdminShellInner: React.FC<AdminAppShellProps> = ({ onPreviewUserApp }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= ADMIN_DESKTOP_BREAKPOINT;
  const { profile, firebaseUser } = useAuth();
  const { workQueue } = useAdminData();
  const insets = useSafeAreaInsets();

  const adminRole = useMemo(
    () =>
      resolveAdminRole(
        profile?.email ?? firebaseUser?.email,
        (profile as { admin_role?: string } | null)?.admin_role,
      ),
    [profile, firebaseUser?.email],
  );

  const visibleSections = useMemo(
    () => filterSectionsForRole(adminRole, DEFAULT_ADMIN_FOC_PREFS.sectionOrder),
    [adminRole],
  );

  const [prefs, setPrefs] = useState<AdminFocPreferences>(DEFAULT_ADMIN_FOC_PREFS);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [section, setSection] = useState<AdminSectionId>('accueil');
  const [screenTab, setScreenTab] = useState<string | undefined>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    DEFAULT_ADMIN_FOC_PREFS.sidebarCollapsed,
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const chrome = useMemo(
    () =>
      buildAdminChrome({
        primaryColor: prefs.primaryColor,
        secondaryColor: prefs.secondaryColor,
        pitchAccent: prefs.pitchAccent,
        radius: prefs.cornerRadius,
      }),
    [prefs.primaryColor, prefs.secondaryColor, prefs.pitchAccent, prefs.cornerRadius],
  );

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

  const navigateSection = useCallback(
    (nextSection: AdminSectionId, tab?: string) => {
      if (!canAccessSection(adminRole, nextSection)) return;
      const route = routeForSection(nextSection);
      setSection(nextSection);
      setScreenTab(tab ?? route.tab);
      if (!isDesktop) setMobileMenu(false);
    },
    [adminRole, isDesktop],
  );

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

  const sidebarBadges = useMemo<Partial<Record<AdminSectionId, number>>>(() => {
    const verification = workQueue.filter((w) => w.kind === 'verification').length;
    const signalements = workQueue.filter((w) =>
      ['report', 'reel'].includes(w.kind),
    ).length;
    return {
      signalements: signalements || undefined,
      contenus: workQueue.filter((w) => w.kind === 'reel').length || undefined,
      utilisateurs: verification || undefined,
      abonnements:
        workQueue.filter((w) => ['payment', 'subscription_request'].includes(w.kind)).length ||
        undefined,
    };
  }, [workQueue]);

  const activeRoute = useMemo(() => routeForSection(section), [section]);
  const effectiveTab = screenTab ?? activeRoute.tab;

  const renderScreen = useCallback(() => {
    switch (activeRoute.screen) {
      case 'dashboard':
        return <AdminFocDashboard onNavigateSection={navigateSection} prefs={prefs} />;
      case 'adherents':
        return <AdminFocAdherentsScreen initialTab={effectiveTab} />;
      case 'clubs':
        return <AdminFocClubsScreen initialTab={effectiveTab} />;
      case 'matchs_events':
        return <AdminMatchsEventsScreen initialTab={effectiveTab} />;
      case 'recrutement':
        return <AdminFocRecrutementScreen initialTab={effectiveTab} />;
      case 'performance':
        return <AdminFocPerformanceScreen initialTab={effectiveTab} />;
      case 'communication':
        return <AdminFocCommunicationScreen initialTab={effectiveTab} />;
      case 'finances':
        return <AdminFocFinancesScreen initialTab={effectiveTab} />;
      case 'video':
        return <AdminFocVideoScreen initialTab={effectiveTab} />;
      case 'parametres':
        return (
          <AdminFocParametresScreen
            initialTab={effectiveTab}
            prefs={prefs}
            onChangePrefs={setPrefs}
            onSavePrefs={handleSavePrefs}
            onPreviewUserApp={onPreviewUserApp}
          />
        );
      default:
        return <AdminFocDashboard onNavigateSection={navigateSection} prefs={prefs} />;
    }
  }, [
    activeRoute.screen,
    effectiveTab,
    navigateSection,
    prefs,
    handleSavePrefs,
    onPreviewUserApp,
  ]);

  const handleWorkItemPress = useCallback(
    (item: AdminWorkItem) => {
      navigateSection(item.targetSection, item.targetTab);
      setNotifOpen(false);
    },
    [navigateSection],
  );

  const sidebar = (
    <AdminFocSidebar
      collapsed={sidebarCollapsed}
      activeSection={section}
      sectionOrder={prefs.sectionOrder}
      hiddenSections={prefs.hiddenSections}
      visibleSections={visibleSections}
      primaryColor={prefs.primaryColor}
      badges={sidebarBadges}
      clubDisplayName={prefs.clubDisplayName}
      onToggleCollapse={handleCollapseToggle}
      onSelectSection={(s) => navigateSection(s)}
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
      accentColor={prefs.primaryColor}
    />
  );

  if (!prefsLoaded) {
    return (
      <SafeAreaView style={shellStyles.loaderRoot} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="dark" />
        <ActivityIndicator size="small" color={chrome.accent} />
      </SafeAreaView>
    );
  }

  return (
    <View style={[shellStyles.root, { backgroundColor: chrome.band }]}>
      <StatusBar style="dark" />

      {isDesktop ? (
        <View style={shellStyles.desktopRow}>
          {sidebar}
          <View style={shellStyles.desktopMain}>
            {topBar}
            <View style={shellStyles.content}>{renderScreen()}</View>
          </View>
        </View>
      ) : (
        <SafeAreaView style={shellStyles.mobileRoot} edges={['top', 'left', 'right', 'bottom']}>
          {topBar}
          <View style={shellStyles.content}>{renderScreen()}</View>
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
                  visibleSections={visibleSections}
                  primaryColor={prefs.primaryColor}
                  badges={sidebarBadges}
                  clubDisplayName={prefs.clubDisplayName}
                  footerLabel="Fermer"
                  onToggleCollapse={() => setMobileMenu(false)}
                  onSelectSection={(s) => navigateSection(s)}
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

      <Modal
        visible={notifOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setNotifOpen(false)}
      >
        <View style={[notifStyles.root, { paddingTop: insets.top }]}>
          <View style={notifStyles.header}>
            <Text style={notifStyles.title}>À traiter aujourd'hui</Text>
            <Pressable onPress={() => setNotifOpen(false)} style={notifStyles.closeBtn}>
              <Text style={notifStyles.closeText}>Fermer</Text>
            </Pressable>
          </View>
          <FlatList
            data={workQueue}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PressableSpring
                onPress={() => handleWorkItemPress(item)}
                style={notifStyles.item}
                scaleTo={0.98}
              >
                <Text style={notifStyles.itemKind}>
                  {ADMIN_WORK_KIND_LABELS[item.kind] ?? item.kind}
                </Text>
                <View style={notifStyles.itemBody}>
                  <Text style={notifStyles.itemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={notifStyles.itemSub} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                </View>
                <Text style={notifStyles.itemPriority}>
                  {ADMIN_PRIORITY_LABELS[item.priority] ?? item.priority}
                </Text>
              </PressableSpring>
            )}
            ListEmptyComponent={
              <View style={notifStyles.empty}>
                <Text style={notifStyles.emptyText}>Rien à traiter pour le moment.</Text>
              </View>
            }
            contentContainerStyle={notifStyles.list}
          />
        </View>
      </Modal>

      <AdminGlobalSearch
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigateSection={navigateSection}
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
    backgroundColor: defaultChrome.band,
  },
  loaderText: { color: defaultChrome.textMuted, fontSize: 14, fontWeight: '500' },
  gateRoot: { flex: 1, backgroundColor: defaultChrome.band },
  root: { flex: 1 },
  desktopRow: { flex: 1, flexDirection: 'row' },
  desktopMain: { flex: 1, minWidth: 0 },
  mobileRoot: { flex: 1 },
  content: { flex: 1 },
  mobileOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(7,20,40,0.48)',
  },
  mobileOverlayBg: { flex: 1 },
  mobileSidebarWrap: {
    width: 300,
    height: '100%',
    backgroundColor: defaultChrome.shell,
    shadowColor: '#071428',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
});

const notifStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: defaultChrome.shellElevated },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: defaultChrome.shellBorder,
    backgroundColor: defaultChrome.shell,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: defaultChrome.text,
    letterSpacing: -0.3,
  },
  closeBtn: { paddingHorizontal: spacing.sm, paddingVertical: 4 },
  closeText: { fontSize: 15, color: defaultChrome.accent, fontWeight: '700' },
  list: { padding: spacing.md, gap: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: defaultChrome.shell,
    borderRadius: defaultChrome.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: defaultChrome.shellBorder,
  },
  itemKind: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: defaultChrome.accent,
    textTransform: 'uppercase',
    minWidth: 72,
    marginTop: 2,
  },
  itemBody: { flex: 1, gap: 2 },
  itemTitle: { fontSize: 14, color: defaultChrome.text, fontWeight: '700' },
  itemSub: { fontSize: 12, color: defaultChrome.textMuted, lineHeight: 17 },
  itemPriority: {
    fontSize: 9,
    fontWeight: '800',
    color: defaultChrome.textMuted,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 14, color: defaultChrome.textMuted },
});
