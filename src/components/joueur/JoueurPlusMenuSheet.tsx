import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedModalShell } from '../motion/AnimatedModalShell';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { formatTabBadge } from '../navigation/tabBarShared';
import type { JoueurPlusMenuItem } from '../../content/joueurPlusMenu';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { PLAYER_DARK, PLAYER_DARK_RADIUS } from '../../theme/playerDarkPremium';
import { spacing } from '../../theme/designTokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  items: JoueurPlusMenuItem[];
  onSelect: (item: JoueurPlusMenuItem) => void;
};

/** Grille dark premium mint — raccourcis secondaires joueur. */
export function JoueurPlusMenuSheet({ visible, onClose, items, onSelect }: Props) {
  const playerTheme = usePlayerThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        sheet: {
          padding: spacing.lg,
          gap: spacing.sm,
          minHeight: 280,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          overflow: 'hidden',
        },
        kicker: {
          color: playerTheme.accent,
          fontWeight: '800',
          letterSpacing: 2.4,
          fontSize: 10,
        },
        title: {
          color: PLAYER_DARK.text,
          fontWeight: '800',
          letterSpacing: -0.5,
          marginTop: -4,
        },
        sub: {
          color: PLAYER_DARK.textMuted,
          marginTop: -4,
          marginBottom: spacing.xs,
        },
        grid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
          paddingVertical: spacing.xs,
        },
        tile: {
          width: '47%',
          minHeight: 96,
          borderRadius: PLAYER_DARK_RADIUS.card,
          borderWidth: 1,
          borderColor: PLAYER_DARK.border,
          padding: spacing.md,
          gap: 6,
          backgroundColor: PLAYER_DARK.surface,
        },
        iconWrap: {
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: playerTheme.accentSoft,
          borderWidth: 1,
          borderColor: `${playerTheme.accent}44`,
        },
        tileLabel: {
          color: PLAYER_DARK.text,
          fontWeight: '800',
          fontSize: 12,
          letterSpacing: 0.3,
        },
        tileSub: {
          color: PLAYER_DARK.textMuted,
          fontSize: 10,
          lineHeight: 14,
        },
        badge: {
          position: 'absolute',
          top: -4,
          right: -4,
          minWidth: 16,
          height: 16,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 4,
          backgroundColor: playerTheme.accent,
        },
        badgeText: {
          color: PLAYER_DARK.bg,
          fontSize: 8,
          fontWeight: '900',
        },
        soonBadge: {
          position: 'absolute',
          top: -4,
          right: -4,
          paddingHorizontal: 5,
          paddingVertical: 2,
          borderRadius: 6,
          backgroundColor: PLAYER_DARK.surfaceRaised,
          borderWidth: 1,
          borderColor: PLAYER_DARK.border,
        },
        soonBadgeText: {
          color: PLAYER_DARK.textMuted,
          fontSize: 7,
          fontWeight: '800',
        },
        closeBtn: {
          marginTop: spacing.sm,
          borderRadius: PLAYER_DARK_RADIUS.pill,
          paddingVertical: 14,
          alignItems: 'center',
          backgroundColor: playerTheme.accent,
        },
        closeText: {
          color: PLAYER_DARK.bg,
          fontWeight: '800',
          letterSpacing: 0.4,
        },
      }),
    [playerTheme.accent, playerTheme.accentAlt, playerTheme.accentSoft],
  );

  return (
    <AnimatedModalShell visible={visible} onClose={onClose} variant="compact" handleOnly>
      <View style={styles.sheet}>
        <LinearGradient colors={PLAYER_DARK.cardGradient} style={StyleSheet.absoluteFill} />
        <ProDayText variant="caption" style={styles.kicker}>
          PLUS PRODAY
        </ProDayText>
        <ProDayText variant="title" style={styles.title}>
          Tout ProDay
        </ProDayText>
        <ProDayText variant="caption" style={styles.sub}>
          Messages, équipe, reels, boutique…
        </ProDayText>

        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {items.map((item) => (
            <PressableSpring
              key={item.id}
              style={styles.tile}
              onPress={() => onSelect(item)}
              scaleTo={0.97}
              haptic
            >
              <View style={styles.iconWrap}>
                <Icon name={item.icon} size={24} color={playerTheme.accentAlt} variant="outline" />
                {item.badge && item.badge > 0 ? (
                  <View style={styles.badge}>
                    <ProDayText variant="caption" style={styles.badgeText}>
                      {formatTabBadge(item.badge)}
                    </ProDayText>
                  </View>
                ) : item.unavailable ? (
                  <View style={styles.soonBadge}>
                    <ProDayText variant="caption" style={styles.soonBadgeText}>
                      Bientôt
                    </ProDayText>
                  </View>
                ) : null}
              </View>
              <ProDayText variant="caption" style={styles.tileLabel}>
                {item.label}
              </ProDayText>
              {item.subtitle ? (
                <ProDayText variant="caption" style={styles.tileSub} numberOfLines={2}>
                  {item.subtitle}
                </ProDayText>
              ) : null}
            </PressableSpring>
          ))}
        </ScrollView>

        <PressableSpring onPress={onClose} scaleTo={0.97} style={styles.closeBtn} haptic>
          <ProDayText variant="caption" style={styles.closeText}>
            Fermer
          </ProDayText>
        </PressableSpring>
      </View>
    </AnimatedModalShell>
  );
}
