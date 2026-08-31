/**
 * Composition visuelle hub Communication Club — priorité messagerie + tuiles.
 */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring, AnimatedEntrance } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { useClubTheme } from '../shell/ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { clubRadius, clubShadow, clubSpace } from '../theme/clubDesignSystem';
import { ClubText } from './clubUi';
import type { ClubCommTile } from './clubCommunicationModel';

/** Hero — ouvrir la messagerie (écran Messages existant). */
export function ClubCommInboxHero({
  subtitle,
  onOpenInbox,
  onOpenNotifications,
  unreadNotifications,
}: {
  subtitle: string;
  onOpenInbox: () => void;
  onOpenNotifications?: () => void;
  unreadNotifications?: number;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => heroStyles(tokens), [tokens]);

  return (
    <AnimatedEntrance kind="fadeUp" index={0} delayStep={36}>
      <View style={styles.card}>
        <LinearGradient
          colors={[tokens.pitchSoft, tokens.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.rail, { backgroundColor: tokens.pitch }]} />
        <View style={[styles.iconBadge, { backgroundColor: tokens.pitchSoft, borderColor: tokens.pitch }]}>
          <Icon name="chat" size={22} color={tokens.pitch} />
        </View>
        <View style={styles.col}>
          <ClubText variant="label" style={{ color: tokens.pitch }}>
            Boîte de réception
          </ClubText>
          <ClubText variant="h2" style={styles.title}>
            Messagerie club
          </ClubText>
          <ClubText variant="caption" muted numberOfLines={2}>
            {subtitle}
          </ClubText>
          <View style={styles.ctaRow}>
            <PressableSpring onPress={onOpenInbox} scaleTo={0.97} haptic style={styles.ctaPrimary}>
              <ClubText variant="caption" style={styles.ctaPrimaryLabel}>
                Ouvrir
              </ClubText>
              <Icon name="chevron-forward" size={12} color={tokens.onAccent} />
            </PressableSpring>
            {onOpenNotifications ? (
              <PressableSpring
                onPress={onOpenNotifications}
                scaleTo={0.97}
                haptic
                style={[styles.ctaGhost, { borderColor: tokens.borderStrong }]}
              >
                <Icon name="notifications" size={13} color={tokens.foreground} />
                <ClubText variant="caption" style={{ color: tokens.foreground, fontWeight: '800' }}>
                  {unreadNotifications && unreadNotifications > 0
                    ? `Alertes (${unreadNotifications})`
                    : 'Alertes'}
                </ClubText>
              </PressableSpring>
            ) : null}
          </View>
        </View>
      </View>
    </AnimatedEntrance>
  );
}

/** Tuile canal / destination existante. */
export function ClubCommTileRow({
  tile,
  index,
  onPress,
}: {
  tile: ClubCommTile;
  index: number;
  onPress: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => tileStyles(tokens), [tokens]);

  return (
    <AnimatedEntrance kind="fadeUp" index={index + 1} delayStep={28}>
      <PressableSpring onPress={onPress} scaleTo={0.98} haptic style={styles.row}>
        <View
          style={[
            styles.icon,
            {
              backgroundColor: tile.primary ? tokens.pitchSoft : tokens.accentSoft,
            },
          ]}
        >
          <Icon
            name={tile.icon}
            size={16}
            color={tile.primary ? tokens.pitch : tokens.accent}
          />
        </View>
        <View style={styles.col}>
          <ClubText variant="body" style={{ fontWeight: '700' }}>
            {tile.label}
          </ClubText>
          <ClubText variant="caption" muted numberOfLines={2}>
            {tile.hint}
          </ClubText>
        </View>
        <Icon name="chevron-forward" size={15} color={tokens.faint} />
      </PressableSpring>
    </AnimatedEntrance>
  );
}

const heroStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: clubSpace.md,
      paddingVertical: clubSpace.xl,
      paddingHorizontal: clubSpace.lg,
      paddingLeft: clubSpace.lg + 6,
      borderRadius: clubRadius.xxl,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
      overflow: 'hidden',
      ...clubShadow.lift,
    },
    rail: {
      position: 'absolute',
      left: 0,
      top: 16,
      bottom: 16,
      width: 4,
      borderTopRightRadius: 2,
      borderBottomRightRadius: 2,
    },
    iconBadge: {
      width: 48,
      height: 48,
      borderRadius: clubRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      flexShrink: 0,
      marginTop: 2,
    },
    col: { flex: 1, minWidth: 0, gap: 6 },
    title: {
      fontWeight: '800',
      letterSpacing: -0.35,
      color: tokens.foreground,
    },
    ctaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: clubSpace.sm,
      marginTop: clubSpace.xs,
    },
    ctaPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: clubRadius.pill,
      backgroundColor: tokens.accent,
    },
    ctaPrimaryLabel: {
      color: tokens.onAccent,
      fontWeight: '800',
      fontSize: 12,
    },
    ctaGhost: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: clubRadius.pill,
      borderWidth: 1,
      backgroundColor: tokens.elevated,
    },
  });

const tileStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: clubSpace.md,
      paddingHorizontal: clubSpace.md,
      borderRadius: clubRadius.lg,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      ...clubShadow.soft,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    col: { flex: 1, minWidth: 0, gap: 2 },
  });
