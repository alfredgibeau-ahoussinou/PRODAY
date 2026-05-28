import React from 'react';
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
import { colors, spacing, radius } from '../../theme/designTokens';

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

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />
          }
        >
          {children}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundAlt },
  header: {
    backgroundColor: colors.surfaceInverse,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 3,
    borderBottomColor: colors.accent,
  },
  title: {
    color: colors.brandInverse,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.heroMuted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  loaderBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: spacing.lg,
    paddingBottom: ADMIN_TAB_BAR_INSET + spacing.xxl,
    gap: spacing.sm,
  },
});
