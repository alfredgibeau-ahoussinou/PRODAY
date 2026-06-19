import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminDataProvider, useAdminData } from '../context/AdminDataContext';
import { AdminTopBar } from '../components/admin/AdminTopBar';
import { AdminDrawerMenu } from '../components/admin/AdminDrawerMenu';
import { AdminGlobalSearch } from '../components/admin/AdminGlobalSearch';
import { AdminOverviewPage } from '../screens/admin/pages/AdminOverviewPage';
import { AdminInboxPage } from '../screens/admin/pages/AdminInboxPage';
import { AdminUsersPage } from '../screens/admin/pages/AdminUsersPage';
import { AdminModerationPage } from '../screens/admin/pages/AdminModerationPage';
import { AdminPlatformPage } from '../screens/admin/pages/AdminPlatformPage';
import { AdminAnalyticsPage } from '../screens/admin/pages/AdminAnalyticsPage';
import { AdminClubsPage } from '../screens/admin/pages/AdminClubsPage';
import { AdminSystemPage } from '../screens/admin/pages/AdminSystemPage';
import { AdminGateScreen } from '../screens/admin/AdminGateScreen';
import { useIsAdmin } from '../hooks/useIsAdmin';
import {
  resolveAdminPageMeta,
  type AdminContentSegment,
  type AdminMainTabId,
  type AdminRoute,
} from './adminTabConfig';
import type { AdminWorkItem } from '../utils/adminInsights';
import { useAdminStyles, adminChrome } from '../components/admin/adminStyles';
import { spacing } from '../theme/designTokens';

interface AdminAppShellProps {
  onPreviewUserApp: () => void;
}

export const AdminAppShell: React.FC<AdminAppShellProps> = ({ onPreviewUserApp }) => {
  const { isAdmin, claimLoading } = useIsAdmin();
  const { colors: c } = useAdminStyles();
  const localStyles = useMemo(() => createShellStyles(), []);

  if (claimLoading) {
    return (
      <SafeAreaView style={localStyles.loaderRoot} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={c.brand} />
        <Text style={localStyles.loaderText}>Chargement espace admin…</Text>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={localStyles.gateRoot} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="light" />
        <AdminGateScreen />
      </SafeAreaView>
    );
  }

  return (
    <AdminDataProvider>
      <AdminAppShellInner onPreviewUserApp={onPreviewUserApp} />
    </AdminDataProvider>
  );
};

const AdminAppShellInner: React.FC<AdminAppShellProps> = ({ onPreviewUserApp }) => {
  const [activeTab, setActiveTab] = useState<AdminMainTabId>('pilotage');
  const [activeSegment, setActiveSegment] = useState<AdminContentSegment | undefined>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { stats, workQueue } = useAdminData();
  const { styles } = useAdminStyles();

  const pageMeta = resolveAdminPageMeta(activeTab, activeSegment);

  const navigate = (route: AdminRoute) => {
    setActiveTab(route.tab);
    setActiveSegment(route.segment);
  };

  const handleNavigate = (tab: AdminMainTabId, item?: AdminWorkItem) => {
    setActiveTab(tab);
    setActiveSegment(item?.contentSegment);
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'pilotage':
        return <AdminOverviewPage onNavigate={handleNavigate} />;
      case 'inbox':
        return <AdminInboxPage onNavigate={handleNavigate} />;
      case 'users':
        return <AdminUsersPage />;
      case 'clubs':
        return <AdminClubsPage />;
      case 'moderation':
        return (
          <AdminModerationPage
            activeSegment={
              activeSegment && ['reels', 'reports', 'weekly', 'messages'].includes(activeSegment)
                ? activeSegment
                : undefined
            }
            onSegmentChange={setActiveSegment}
          />
        );
      case 'plateforme':
        return (
          <AdminPlatformPage
            activeSegment={
              activeSegment &&
              ['events', 'mercato', 'matches', 'applications', 'payments', 'sponsors'].includes(
                activeSegment,
              )
                ? activeSegment
                : undefined
            }
            onSegmentChange={setActiveSegment}
          />
        );
      case 'analytics':
        return <AdminAnalyticsPage />;
      case 'system':
        return <AdminSystemPage onPreviewUserApp={onPreviewUserApp} />;
      default:
        return <AdminOverviewPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <AdminTopBar
        title={pageMeta.title}
        subtitle={pageMeta.subtitle}
        onMenu={() => setMenuOpen(true)}
        onSearch={() => setSearchOpen(true)}
      />
      <View style={shellStyles.screen}>{renderPage()}</View>
      <AdminDrawerMenu
        visible={menuOpen}
        activeTab={activeTab}
        activeSegment={activeSegment}
        badges={{
          inbox: workQueue.length,
          verifications: stats?.pendingVerifications ?? 0,
          moderation:
            (stats?.pendingCommunityReels ?? 0) + (stats?.reelReports ?? 0),
          reels: stats?.pendingCommunityReels ?? 0,
          reports: stats?.reelReports ?? 0,
        }}
        onClose={() => setMenuOpen(false)}
        onNavigate={navigate}
      />
      <AdminGlobalSearch
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(tab) => navigate({ tab })}
      />
    </SafeAreaView>
  );
};

function createShellStyles() {
  return StyleSheet.create({
    loaderRoot: {
      flex: 1,
      backgroundColor: adminChrome.shell,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
    },
    gateRoot: {
      flex: 1,
      backgroundColor: adminChrome.shell,
    },
    loaderText: { color: adminChrome.textMuted, fontSize: 14 },
  });
}

const shellStyles = StyleSheet.create({
  screen: { flex: 1 },
});
