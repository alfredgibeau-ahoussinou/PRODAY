import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useUnreadMessageCount } from '../../hooks/useUnreadMessages';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useAppTheme } from '../../context/ProductLineContext';
import { SupporterHomeDashboard } from '../../features/home/roles/SupporterHomeDashboard';
import { useCallback, useState } from 'react';

/** Onglet Tribune — dashboard supporter dédié. */
export const SupporterHomeScreen: React.FC = () => {
  const profile = useSessionProfile();
  const { colors } = useAppTheme();
  const { count: unreadMessages } = useUnreadMessageCount();
  const { refresh } = useDashboardData(profile);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  if (!profile) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SupporterHomeDashboard
      profile={profile}
      unreadMessages={unreadMessages}
      onRefresh={handleRefresh}
      refreshing={refreshing}
    />
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
