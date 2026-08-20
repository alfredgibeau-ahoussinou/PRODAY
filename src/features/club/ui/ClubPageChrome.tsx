import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../../components/ui/Icon';
import { ClubAvatar, ClubText } from './clubUi';
import { useClubTheme } from '../shell/ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { clubChrome, clubRadius, clubShadow, clubSpace } from '../theme/clubDesignSystem';

type Props = {
  title: string;
  /** Affiche la barre chrome (desktop / tablet). Sur mobile étroit, optionnel. */
  visible?: boolean;
  clubName?: string;
  onNotifications?: () => void;
  onSearch?: () => void;
  onProfile?: () => void;
};

/**
 * Header léger premium — titre page | notifications, recherche, profil.
 * Chrome uniquement : callbacks branchés sur la nav existante.
 */
export function ClubPageChrome({
  title,
  visible = true,
  clubName = 'Club',
  onNotifications,
  onSearch,
  onProfile,
}: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (!visible) return null;

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, clubSpace.sm) }]}>
      <ClubText variant="h3" numberOfLines={1} style={styles.title}>
        {title}
      </ClubText>
      <View style={styles.actions}>
        <Pressable
          onPress={onSearch}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Rechercher"
        >
          <Icon name="search" size={18} color={tokens.muted} />
        </Pressable>
        <Pressable
          onPress={onNotifications}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Icon name="notifications" size={18} color={tokens.muted} />
        </Pressable>
        <Pressable
          onPress={onProfile}
          style={styles.profileBtn}
          accessibilityRole="button"
          accessibilityLabel="Profil club"
        >
          <ClubAvatar label={clubName} size={32} />
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: {
      minHeight: clubChrome.headerHeight,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: clubSpace.lg,
      paddingBottom: clubSpace.sm,
      backgroundColor: tokens.elevated,
      borderBottomWidth: 1,
      borderBottomColor: tokens.borderStrong,
      ...clubShadow.soft,
      zIndex: 10,
    },
    title: { flex: 1, minWidth: 0, marginRight: clubSpace.md },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    profileBtn: { marginLeft: 2 },
  });
