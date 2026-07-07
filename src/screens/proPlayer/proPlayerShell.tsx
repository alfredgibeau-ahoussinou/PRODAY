import React from 'react';
import { ScrollView, RefreshControl, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import { TabScreenShell } from '../../components/app/TabScreenShell';
import { ProDayText } from '../../components/ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing } from '../../theme/designTokens';

interface ProPlayerShellProps {
  caption: string;
  title: string;
  subtitle: string;
  profile: User;
  refreshing?: boolean;
  onRefresh?: () => void | Promise<void>;
  children: React.ReactNode;
}

export const ProPlayerShell: React.FC<ProPlayerShellProps> = ({
  caption,
  title,
  subtitle,
  profile,
  refreshing = false,
  onRefresh,
  children,
}) => {
  const { colors } = useAppTheme();

  return (
    <TabScreenShell caption={caption} title={title} subtitle={subtitle} flat>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: TAB_BAR_CONTENT_INSET }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          ) : undefined
        }
      >
        <ProDayText variant="caption" muted>
          {profile.display_name}
        </ProDayText>
        {children}
      </ScrollView>
    </TabScreenShell>
  );
};

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    gap: spacing.md,
  },
});
