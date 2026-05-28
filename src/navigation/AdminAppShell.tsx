import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminDataProvider, useAdminData } from '../context/AdminDataContext';
import { AdminTabBar } from '../components/navigation/AdminTabBar';
import { AdminOverviewPage } from '../screens/admin/pages/AdminOverviewPage';
import { AdminUsersPage } from '../screens/admin/pages/AdminUsersPage';
import { AdminContentPage } from '../screens/admin/pages/AdminContentPage';
import { AdminClubsPage } from '../screens/admin/pages/AdminClubsPage';
import { AdminSystemPage } from '../screens/admin/pages/AdminSystemPage';
import { AdminGateScreen } from '../screens/admin/AdminGateScreen';
import { useIsAdmin } from '../hooks/useIsAdmin';
import type { AdminMainTabId } from './adminTabConfig';
import { colors, spacing } from '../theme/designTokens';

interface AdminAppShellProps {
  onPreviewUserApp: () => void;
}

export const AdminAppShell: React.FC<AdminAppShellProps> = ({ onPreviewUserApp }) => {
  const { isAdmin, claimLoading } = useIsAdmin();

  if (claimLoading) {
    return (
      <SafeAreaView style={styles.loaderRoot} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loaderText}>Chargement espace admin…</Text>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
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
  const { stats } = useAdminData();

  const renderPage = () => {
    switch (activeTab) {
      case 'pilotage':
        return <AdminOverviewPage onNavigate={setActiveTab} />;
      case 'users':
        return <AdminUsersPage />;
      case 'contenu':
        return <AdminContentPage />;
      case 'clubs':
        return <AdminClubsPage />;
      case 'system':
        return <AdminSystemPage onPreviewUserApp={onPreviewUserApp} />;
      default:
        return <AdminOverviewPage onNavigate={setActiveTab} />;
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.screen}>{renderPage()}</View>
      <AdminTabBar
        activeTab={activeTab}
        onTabPress={setActiveTab}
        pendingVerifications={stats?.pendingVerifications ?? 0}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundAlt },
  loaderRoot: {
    flex: 1,
    backgroundColor: colors.surfaceInverse,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loaderText: { color: colors.heroMuted, fontSize: 14 },
  screen: { flex: 1 },
});
