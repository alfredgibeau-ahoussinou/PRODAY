import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { ADMIN_NAV_INSET } from '../../navigation/adminTabConfig';
import { useAdminData } from '../../context/AdminDataContext';
import { useAdminStyles } from './adminStyles';
import { spacing } from '../../theme/designTokens';

interface AdminPageScaffoldProps {
  children: React.ReactNode;
  loading?: boolean;
}

export const AdminPageScaffold: React.FC<AdminPageScaffoldProps> = ({ children, loading }) => {
  const { refreshing, refresh } = useAdminData();
  const { styles, colors: c } = useAdminStyles();
  const localStyles = useMemo(() => createScaffoldStyles(), []);

  return (
    <View style={styles.root}>
      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={c.brand} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={localStyles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.brand} />
          }
        >
          {children}
        </ScrollView>
      )}
    </View>
  );
};

function createScaffoldStyles() {
  return StyleSheet.create({
    content: {
      padding: spacing.lg,
      paddingBottom: ADMIN_NAV_INSET + spacing.xl,
      gap: spacing.md,
    },
  });
}
