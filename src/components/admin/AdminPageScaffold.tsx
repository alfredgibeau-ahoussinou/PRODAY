import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { ADMIN_TAB_BAR_INSET } from '../../navigation/adminTabConfig';
import { useAdminData } from '../../context/AdminDataContext';
import { useAdminStyles } from './adminStyles';
import { spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface AdminPageScaffoldProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  loading?: boolean;
}

export const AdminPageScaffold: React.FC<AdminPageScaffoldProps> = ({
  title,
  subtitle,
  children,
  loading,
}) => {
  const { refreshing, refresh } = useAdminData();
  const { styles, colors: c } = useAdminStyles();
  const localStyles = useMemo(() => createScaffoldStyles(c), [c]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={localStyles.subtitle}>{subtitle}</Text> : null}
      </View>
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

function createScaffoldStyles(c: AppColors) {
  return StyleSheet.create({
    subtitle: {
      color: c.heroMuted,
      fontSize: 13,
      marginTop: 4,
      lineHeight: 18,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: ADMIN_TAB_BAR_INSET + spacing.xxl,
      gap: spacing.sm,
    },
  });
}
