import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../../components/ui/Icon';
import { PressableSpring } from '../../../components/motion';
import { ClubAvatar, ClubText } from './clubUi';
import { useClubTheme } from '../shell/ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { clubChrome, clubRadius, clubShadow, clubSpace } from '../theme/clubDesignSystem';
import { AppBackButton } from '../../../components/ui/AppBackButton';
import { useAppearance } from '../../../context/AppearanceContext';
import type { ClubNavItemId } from '../navigation/clubNavConfig';

type Props = {
  title: string;
  /** Affiche la barre chrome (desktop / tablet). Sur mobile étroit, optionnel. */
  visible?: boolean;
  clubName?: string;
  showBack?: boolean;
  onBack?: () => void;
  fallbackNavId?: ClubNavItemId;
  onNotifications?: () => void;
  onSearch?: () => void;
  onProfile?: () => void;
  /** Ouvre le sheet Copilote Club (accès rapide header). */
  onOpenCopilot?: () => void;
};

/**
 * Header léger premium — titre page | copilote chip, notifications, recherche, profil.
 * Chrome uniquement : callbacks branchés sur la nav existante.
 */
export function ClubPageChrome({
  title,
  visible = true,
  clubName = 'Club',
  showBack = false,
  onBack,
  fallbackNavId,
  onNotifications,
  onSearch,
  onProfile,
  onOpenCopilot,
}: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useClubTheme();
  const { tokens: glassTokens, isEffectiveGlass } = useAppearance();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  if (!visible) return null;

  return (
    <View
      style={[
        styles.root,
        { paddingTop: Math.max(insets.top, clubSpace.sm) },
        isEffectiveGlass && glassTokens.blurStyle,
        isEffectiveGlass && {
          borderBottomWidth: 1,
          borderBottomColor: glassTokens.border,
        },
      ]}
    >
      <View style={styles.titleWrap}>
        {showBack ? (
          <AppBackButton
            onPress={onBack}
            fallbackNavId={fallbackNavId}
            style={styles.backBtn}
          />
        ) : null}
        <ClubText variant="h3" numberOfLines={1} style={styles.title}>
          {title}
        </ClubText>
      </View>
      <View style={styles.actions}>
        {onOpenCopilot ? (
          <PressableSpring
            onPress={onOpenCopilot}
            scaleTo={0.96}
            haptic
            style={styles.copilotChip}
            accessibilityRole="button"
            accessibilityLabel="Demander au copilote"
          >
            <Icon name="chat" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.copilotLabel}>
              Copilote
            </ClubText>
          </PressableSpring>
        ) : null}
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
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.borderStrong,
      ...clubShadow.soft,
      zIndex: 10,
    },
    titleWrap: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      marginRight: clubSpace.md,
    },
    backBtn: {
      marginRight: 2,
    },
    title: {
      flex: 1,
      minWidth: 0,
      fontSize: 18,
      lineHeight: 22,
      letterSpacing: -0.3,
    },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    copilotChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 36,
      paddingHorizontal: 12,
      borderRadius: clubRadius.sm,
      backgroundColor: tokens.accentSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.accent,
    },
    copilotLabel: {
      color: tokens.accent,
      fontWeight: '800',
      fontSize: 12,
      letterSpacing: 0.2,
    },
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
