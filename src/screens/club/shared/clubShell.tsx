import React from 'react';
import { ScrollView, RefreshControl, StyleSheet, View } from 'react-native';
import type { User } from '../../../models/User';
import { getClubPageIdentity } from '../../../content/clubPageIdentity';
import type { ClubNavItemId } from '../../../features/club/navigation/clubNavConfig';
import { TAB_BAR_CONTENT_INSET } from '../../../navigation/tabBarLayout';
import { spacing } from '../../../theme/designTokens';

interface ClubShellProps {
  pageId: ClubNavItemId;
  caption?: string;
  title?: string;
  subtitle?: string;
  profile: User;
  refreshing?: boolean;
  onRefresh?: () => void | Promise<void>;
  scroll?: boolean;
  children: React.ReactNode;
}

/**
 * Contenu scroll Club — l’identité visuelle est fournie par ClubPageFrame (shell).
 */
export const ClubShell: React.FC<ClubShellProps> = ({
  pageId,
  profile: _profile,
  refreshing = false,
  onRefresh,
  scroll = true,
  children,
}) => {
  const bottomPad = Math.max(spacing.xl, TAB_BAR_CONTENT_INSET * 0.35);
  const tint = getClubPageIdentity(pageId).accent;

  return scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tint} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.fill}>{children}</View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  fill: { flex: 1, minHeight: 0 },
});
