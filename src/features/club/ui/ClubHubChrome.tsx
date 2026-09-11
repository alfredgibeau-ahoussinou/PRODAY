/**
 * Composition visuelle hub Club (identité) — crest hero Obsidian Glass, pack, alertes, tuiles réglages.
 */
import React, { useMemo } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring, AnimatedEntrance } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { useClubTheme } from '../shell/ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { clubRadius, clubShadow, clubSpace } from '../theme/clubDesignSystem';
import { ClubStatusPill, ClubText } from './clubUi';
import type { ClubHubAlert, ClubHubSettingsTile } from './clubHubModel';

/** Hero identité Obsidian Glass — crest dominant, nom, méta, statut & dock statistiques. */
export function ClubHubIdentityHero({
  clubName,
  locationLine,
  metaLine,
  verified,
  statusLabel,
  statusTone,
  onPressCrest,
  crestUploading,
  canEditCrest,
  playerCount,
  teamCount,
  coachCount,
  onPressPlayers,
  onPressTeams,
  onPressCoaches,
}: {
  clubName: string;
  locationLine?: string;
  metaLine?: string;
  verified?: boolean;
  statusLabel: string;
  statusTone: 'ok' | 'warn' | 'alert';
  onPressCrest?: () => void;
  crestUploading?: boolean;
  canEditCrest?: boolean;
  playerCount?: number;
  teamCount?: number;
  coachCount?: number;
  onPressPlayers?: () => void;
  onPressTeams?: () => void;
  onPressCoaches?: () => void;
}) {
  const { tokens, logoUrl } = useClubTheme();
  const styles = useMemo(() => identityStyles(tokens), [tokens]);
  const crestLetter = (clubName.trim().charAt(0) || 'C').toUpperCase();
  const editable = Boolean(canEditCrest && onPressCrest);

  const crestInner = logoUrl ? (
    <Image source={{ uri: logoUrl }} style={styles.crestImg} resizeMode="cover" />
  ) : (
    <LinearGradient
      colors={[tokens.accentDeep, tokens.accent]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.crestPh}
    >
      <ClubText style={styles.crestLetter}>{crestLetter}</ClubText>
    </LinearGradient>
  );

  const hasStats = playerCount !== undefined && teamCount !== undefined && coachCount !== undefined;

  return (
    <View style={styles.wrap}>
      {/* Background radial glow */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.04)', 'rgba(0, 0, 0, 0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Top Status & Verification Row */}
      <View style={styles.topRow}>
        {verified ? (
          <View style={styles.verifiedBadge}>
            <Icon name="checkmark-circle" size={13} color={tokens.accent} />
            <ClubText variant="caption" style={styles.verifiedText}>
              Club Vérifié FFF
            </ClubText>
          </View>
        ) : (
          <View style={styles.unverifiedBadge}>
            <Icon name="warning" size={13} color={tokens.warning} />
            <ClubText variant="caption" style={styles.unverifiedText}>
              Vérification en cours
            </ClubText>
          </View>
        )}
        <ClubStatusPill label={statusLabel} tone={statusTone} />
      </View>

      {/* Crest & Hero Information */}
      <View style={styles.heroCol}>
        <PressableSpring
          onPress={editable ? onPressCrest : undefined}
          disabled={!editable || crestUploading}
          scaleTo={0.96}
          haptic={editable}
          style={styles.crestWrap}
          accessibilityRole={editable ? 'button' : undefined}
          accessibilityLabel={
            logoUrl ? 'Changer le logo du club' : 'Ajouter le logo du club'
          }
        >
          <View style={[styles.crest, { borderColor: 'rgba(255, 255, 255, 0.16)' }]}>
            <View style={styles.crestInner}>
              {crestUploading ? (
                <View style={[styles.crestPh, { backgroundColor: tokens.elevated }]}>
                  <ActivityIndicator color={tokens.accent} />
                </View>
              ) : (
                crestInner
              )}
            </View>
          </View>
          {editable && !crestUploading ? (
            <View style={[styles.crestBadge, { backgroundColor: tokens.accent, borderColor: tokens.bg }]}>
              <Icon name="camera" size={13} color={tokens.onAccent} />
            </View>
          ) : null}
        </PressableSpring>

        <ClubText variant="h1" numberOfLines={2} style={styles.clubName}>
          {clubName}
        </ClubText>

        {locationLine ? (
          <View style={styles.locationPill}>
            <Icon name="location" size={12} color={tokens.muted} />
            <ClubText variant="caption" muted numberOfLines={1}>
              {locationLine}
            </ClubText>
          </View>
        ) : null}

        {/* Integrated Executive Stats Capsule */}
        {hasStats ? (
          <View style={styles.statsCapsule}>
            <PressableSpring
              onPress={onPressPlayers}
              scaleTo={0.96}
              haptic
              style={styles.statCol}
            >
              <ClubText variant="h3" style={styles.statValue}>
                {playerCount}
              </ClubText>
              <ClubText variant="caption" muted style={styles.statLabel}>
                Licenciés
              </ClubText>
            </PressableSpring>

            <View style={styles.statDivider} />

            <PressableSpring
              onPress={onPressTeams}
              scaleTo={0.96}
              haptic
              style={styles.statCol}
            >
              <ClubText variant="h3" style={styles.statValue}>
                {teamCount}
              </ClubText>
              <ClubText variant="caption" muted style={styles.statLabel}>
                Équipes
              </ClubText>
            </PressableSpring>

            <View style={styles.statDivider} />

            <PressableSpring
              onPress={onPressCoaches}
              scaleTo={0.96}
              haptic
              style={styles.statCol}
            >
              <ClubText variant="h3" style={styles.statValue}>
                {coachCount}
              </ClubText>
              <ClubText variant="caption" muted style={styles.statLabel}>
                Staff
              </ClubText>
            </PressableSpring>
          </View>
        ) : metaLine ? (
          <ClubText variant="caption" muted numberOfLines={2} style={styles.metaFallback}>
            {metaLine}
          </ClubText>
        ) : null}
      </View>
    </View>
  );
}

/** Carte Pack Obsidian Glass — offre, statut et CTA club. */
export function ClubHubPackHero({
  title,
  hint,
  onOpenPack,
  onOpenQuote,
}: {
  title: string;
  hint: string;
  onOpenPack: () => void;
  onOpenQuote?: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => packStyles(tokens), [tokens]);

  return (
    <AnimatedEntrance kind="fadeUp" index={0} delayStep={36}>
      <View style={styles.card}>
        <LinearGradient
          colors={['rgba(24, 28, 42, 0.95)', 'rgba(14, 16, 24, 0.98)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.rail, { backgroundColor: tokens.accent }]} />
        
        <View style={styles.contentWrap}>
          <View style={styles.headerRow}>
            <View style={[styles.iconBadge, { backgroundColor: tokens.accentSoft, borderColor: tokens.accent }]}>
              <Icon name="star-four-points" size={20} color={tokens.accent} />
            </View>
            <View style={styles.titleCol}>
              <View style={styles.tagRow}>
                <ClubText variant="caption" style={styles.tagText}>
                  ESPACE & OFFRE CLUB
                </ClubText>
                <View style={styles.tierPill}>
                  <ClubText variant="caption" style={styles.tierText}>
                    SUR DEVIS
                  </ClubText>
                </View>
              </View>
              <ClubText variant="h2" style={styles.title}>
                {title}
              </ClubText>
            </View>
          </View>

          <ClubText variant="caption" muted numberOfLines={2} style={styles.hintText}>
            {hint}
          </ClubText>

          <View style={styles.ctaRow}>
            <PressableSpring onPress={onOpenPack} scaleTo={0.97} haptic style={styles.ctaPrimary}>
              <ClubText variant="caption" style={styles.ctaPrimaryLabel}>
                Voir le Pack
              </ClubText>
              <Icon name="chevron-forward" size={13} color={tokens.onAccent} />
            </PressableSpring>
            {onOpenQuote ? (
              <PressableSpring
                onPress={onOpenQuote}
                scaleTo={0.97}
                haptic
                style={styles.ctaGhost}
              >
                <ClubText variant="caption" style={styles.ctaGhostLabel}>
                  Demander un devis
                </ClubText>
              </PressableSpring>
            ) : null}
          </View>
        </View>
      </View>
    </AnimatedEntrance>
  );
}

/** Alerte opérationnelle Obsidian Glass (sans coach / adhésions). */
export function ClubHubAlertCard({
  alert,
  index,
  onPress,
}: {
  alert: ClubHubAlert;
  index: number;
  onPress: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => alertStyles(tokens), [tokens]);
  const accent =
    alert.tone === 'alert'
      ? tokens.danger
      : alert.tone === 'warn'
        ? tokens.warning
        : tokens.accent;
  const soft =
    alert.tone === 'alert'
      ? tokens.dangerSoft
      : alert.tone === 'warn'
        ? tokens.warningSoft
        : tokens.accentSoft;

  return (
    <AnimatedEntrance kind="fadeUp" index={index + 1} delayStep={28}>
      <PressableSpring onPress={onPress} scaleTo={0.98} haptic style={styles.card}>
        <View style={[styles.rail, { backgroundColor: accent }]} />
        <View style={[styles.icon, { backgroundColor: soft }]}>
          <Icon
            name={alert.id === 'without_coach' ? 'school' : 'people'}
            size={18}
            color={accent}
          />
        </View>
        <View style={styles.col}>
          <ClubText variant="body" style={styles.alertTitle}>
            {alert.title}
          </ClubText>
          <ClubText variant="caption" muted numberOfLines={2}>
            {alert.body}
          </ClubText>
        </View>
        <View style={[styles.ctaChip, { borderColor: accent }]}>
          <ClubText variant="caption" style={[styles.ctaChipLabel, { color: accent }]}>
            {alert.ctaLabel}
          </ClubText>
          <Icon name="chevron-forward" size={12} color={accent} />
        </View>
      </PressableSpring>
    </AnimatedEntrance>
  );
}

/** Tuile réglages / outils Obsidian Glass. */
export function ClubHubSettingsTileRow({
  tile,
  index,
  onPress,
}: {
  tile: ClubHubSettingsTile;
  index: number;
  onPress: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => tileStyles(tokens), [tokens]);

  return (
    <AnimatedEntrance kind="fadeUp" index={index + 2} delayStep={24}>
      <PressableSpring onPress={onPress} scaleTo={0.98} haptic style={styles.row}>
        <View
          style={[
            styles.icon,
            {
              backgroundColor: tile.primary ? tokens.accentSoft : 'rgba(255, 255, 255, 0.05)',
            },
          ]}
        >
          <Icon
            name={tile.icon}
            size={17}
            color={tile.primary ? tokens.accent : tokens.foreground}
          />
        </View>
        <View style={styles.col}>
          <ClubText variant="body" style={styles.tileLabel}>
            {tile.label}
          </ClubText>
          <ClubText variant="caption" muted numberOfLines={1}>
            {tile.hint}
          </ClubText>
        </View>
        <Icon name="chevron-forward" size={15} color={tokens.faint} />
      </PressableSpring>
    </AnimatedEntrance>
  );
}

const identityStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    wrap: {
      marginHorizontal: -clubSpace.lg,
      marginTop: -clubSpace.sm,
      marginBottom: clubSpace.md,
      paddingBottom: clubSpace.lg,
      backgroundColor: tokens.surface,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
      overflow: 'hidden',
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: clubSpace.lg,
      paddingTop: clubSpace.md,
      gap: 8,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 4,
      paddingHorizontal: 9,
      borderRadius: clubRadius.pill,
      backgroundColor: tokens.accentSoft,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.25)',
    },
    verifiedText: {
      color: tokens.accent,
      fontWeight: '800',
      fontSize: 11,
      letterSpacing: 0.2,
    },
    unverifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 4,
      paddingHorizontal: 9,
      borderRadius: clubRadius.pill,
      backgroundColor: tokens.warningSoft,
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.25)',
    },
    unverifiedText: {
      color: tokens.warning,
      fontWeight: '700',
      fontSize: 11,
    },
    heroCol: {
      alignItems: 'center',
      paddingHorizontal: clubSpace.lg,
      paddingTop: clubSpace.sm,
      gap: 6,
    },
    crestWrap: {
      position: 'relative',
      marginBottom: 6,
      ...clubShadow.lift,
    },
    crest: {
      width: 100,
      height: 100,
      borderRadius: 30,
      borderWidth: 1.5,
      borderColor: tokens.border,
      overflow: 'hidden',
      backgroundColor: tokens.elevated,
    },
    crestInner: {
      width: '100%',
      height: '100%',
      borderRadius: 28,
      overflow: 'hidden',
    },
    crestImg: { width: '100%', height: '100%' },
    crestPh: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    crestLetter: {
      fontSize: 40,
      fontWeight: '900',
      color: tokens.onAccent,
    },
    crestBadge: {
      position: 'absolute',
      right: -3,
      bottom: -3,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      ...clubShadow.lift,
    },
    clubName: {
      textAlign: 'center',
      fontWeight: '900',
      letterSpacing: -0.5,
      fontSize: 24,
      color: tokens.foreground,
      marginTop: 2,
    },
    locationPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: clubRadius.pill,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      marginTop: 2,
    },
    statsCapsule: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: clubSpace.md,
      width: '100%',
      maxWidth: 360,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: clubRadius.xl,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
      ...clubShadow.card,
    },
    statCol: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    statValue: {
      fontWeight: '900',
      fontSize: 19,
      letterSpacing: -0.3,
      color: tokens.foreground,
    },
    statLabel: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    statDivider: {
      width: 1,
      height: 26,
      backgroundColor: tokens.border,
    },
    metaFallback: {
      textAlign: 'center',
      maxWidth: 320,
      marginTop: 4,
    },
  });

const packStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    card: {
      borderRadius: clubRadius.xl,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      overflow: 'hidden',
      marginBottom: clubSpace.sm,
      ...clubShadow.lift,
    },
    rail: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
    },
    contentWrap: {
      padding: clubSpace.lg,
      gap: clubSpace.sm,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.md,
    },
    iconBadge: {
      width: 46,
      height: 46,
      borderRadius: clubRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      flexShrink: 0,
    },
    titleCol: { flex: 1, minWidth: 0, gap: 3 },
    tagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    tagText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: tokens.accent,
      textTransform: 'uppercase',
    },
    tierPill: {
      paddingVertical: 2,
      paddingHorizontal: 7,
      borderRadius: clubRadius.pill,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    tierText: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.4,
      color: tokens.foreground,
    },
    title: {
      fontWeight: '900',
      letterSpacing: -0.4,
      color: tokens.foreground,
      fontSize: 17,
    },
    hintText: {
      lineHeight: 18,
    },
    ctaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      marginTop: 4,
    },
    ctaPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 8,
      paddingHorizontal: 16,
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
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: clubRadius.pill,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.14)',
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    ctaGhostLabel: {
      color: tokens.foreground,
      fontWeight: '700',
      fontSize: 12,
    },
  });

const alertStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.md,
      paddingVertical: 12,
      paddingHorizontal: clubSpace.lg,
      borderRadius: clubRadius.xl,
      backgroundColor: 'rgba(20, 24, 36, 0.95)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.09)',
      overflow: 'hidden',
      marginBottom: 6,
    },
    rail: {
      position: 'absolute',
      left: 0,
      top: 10,
      bottom: 10,
      width: 3,
      borderTopRightRadius: 2,
      borderBottomRightRadius: 2,
    },
    icon: {
      width: 38,
      height: 38,
      borderRadius: clubRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    col: { flex: 1, minWidth: 0, gap: 2 },
    alertTitle: {
      fontWeight: '800',
      fontSize: 14,
      color: tokens.foreground,
    },
    ctaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: clubRadius.pill,
      borderWidth: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    ctaChipLabel: {
      fontWeight: '800',
      fontSize: 11,
    },
  });

const tileStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.md,
      paddingVertical: 12,
      paddingHorizontal: clubSpace.md,
      borderRadius: clubRadius.lg,
      backgroundColor: 'rgba(22, 26, 38, 0.75)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.07)',
      marginBottom: 4,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: clubRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    col: { flex: 1, minWidth: 0, gap: 2 },
    tileLabel: {
      fontWeight: '700',
      fontSize: 14,
      color: tokens.foreground,
    },
  });
