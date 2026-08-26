import React, { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/iconNames';
import { ProDayText } from '../ui/ProDayText';
import { spacing } from '../../theme/designTokens';

export type ShellAccountLink = {
  key: string;
  label: string;
  hint?: string;
  icon: IconName;
  onPress: () => void;
};

type Tone = {
  foreground: string;
  muted: string;
  faint?: string;
  surface: string;
  border: string;
  destructive: string;
  iconBg?: string;
};

type Props = {
  title?: string;
  links?: ShellAccountLink[];
  onSignOut?: () => void;
  signOutLabel?: string;
  /** Extra bottom pad so logout clears home indicator / dock. */
  safeBottom?: boolean;
  tone: Tone;
  style?: StyleProp<ViewStyle>;
};

/**
 * Bloc Compte partagé — profil / paramètres / déconnexion.
 * Visible mobile (menus) et desktop (si monté hors sidebar).
 */
export function ShellAccountSection({
  title = 'Compte',
  links = [],
  onSignOut,
  signOutLabel = 'Se déconnecter',
  safeBottom = true,
  tone,
  style,
}: Props) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(tone), [tone]);
  const bottomPad = safeBottom ? Math.max(insets.bottom, 12) + spacing.md : 0;

  if (links.length === 0 && !onSignOut) return null;

  return (
    <View style={[styles.root, { paddingBottom: bottomPad }, style]}>
      <ProDayText variant="caption" style={styles.title}>
        {title}
      </ProDayText>
      <View style={styles.list}>
        {links.map((link, index) => {
          const last = !onSignOut && index === links.length - 1;
          return (
            <View key={link.key}>
              <PressableSpring
                onPress={link.onPress}
                scaleTo={0.98}
                haptic
                style={styles.row}
                accessibilityRole="button"
                accessibilityLabel={link.label}
              >
                <View style={[styles.iconWrap, tone.iconBg ? { backgroundColor: tone.iconBg } : null]}>
                  <Icon name={link.icon} size={17} color={tone.foreground} />
                </View>
                <View style={styles.copy}>
                  <ProDayText variant="body" style={styles.label}>
                    {link.label}
                  </ProDayText>
                  {link.hint ? (
                    <ProDayText variant="caption" style={styles.hint} numberOfLines={1}>
                      {link.hint}
                    </ProDayText>
                  ) : null}
                </View>
                <Icon name="chevron-forward" size={14} color={tone.faint ?? tone.muted} />
              </PressableSpring>
              {!last ? <View style={styles.divider} /> : null}
            </View>
          );
        })}
        {onSignOut ? (
          <PressableSpring
            onPress={onSignOut}
            scaleTo={0.98}
            haptic
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel={signOutLabel}
          >
            <View style={[styles.iconWrap, styles.logoutIcon]}>
              <Icon name="log-out" size={17} color={tone.destructive} />
            </View>
            <View style={styles.copy}>
              <ProDayText variant="body" style={styles.logoutLabel}>
                {signOutLabel}
              </ProDayText>
            </View>
          </PressableSpring>
        ) : null}
      </View>
    </View>
  );
}

/** Bouton déconnexion isolé (sidebars / footers). */
export function ShellLogoutAction({
  onPress,
  label = 'Se déconnecter',
  tone,
  compact,
  style,
}: {
  onPress: () => void;
  label?: string;
  tone: Pick<Tone, 'destructive' | 'muted'>;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <PressableSpring
      onPress={onPress}
      scaleTo={0.97}
      haptic
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon name="log-out" size={compact ? 16 : 18} color={tone.destructive} />
      {!compact ? (
        <ProDayText variant="caption" style={{ color: tone.destructive, fontWeight: '700' }}>
          {label}
        </ProDayText>
      ) : null}
    </PressableSpring>
  );
}

function createStyles(tone: Tone) {
  return StyleSheet.create({
    root: { gap: spacing.sm },
    title: {
      color: tone.muted,
      letterSpacing: 1.05,
      textTransform: 'uppercase',
      fontWeight: '700',
      fontSize: 11,
      paddingHorizontal: 2,
    },
    list: {
      borderRadius: 16,
      backgroundColor: tone.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tone.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: 13,
      paddingHorizontal: spacing.md,
      minHeight: 52,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tone.iconBg ?? 'rgba(255,255,255,0.06)',
      flexShrink: 0,
    },
    logoutIcon: {
      backgroundColor: 'rgba(239,68,68,0.12)',
    },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    label: {
      color: tone.foreground,
      fontWeight: '600',
      letterSpacing: -0.15,
    },
    hint: { color: tone.muted },
    logoutLabel: {
      color: tone.destructive,
      fontWeight: '700',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: tone.border,
      marginLeft: spacing.md + 34 + spacing.md,
    },
  });
}
