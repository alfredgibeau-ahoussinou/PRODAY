/**
 * Composition visuelle hub Club (identité) — crest hero, pack, alertes, tuiles réglages.
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

/** Hero identité — crest dominant, nom, méta, statut. */
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

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[tokens.pitch, '#06241C', tokens.bg]}
        locations={[0, 0.42, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.heroWash}
        pointerEvents="none"
      />
      <View style={styles.statusCol}>
        <ClubStatusPill label={statusLabel} tone={statusTone} />
        {verified ? (
          <ClubStatusPill label="Vérifié" tone="ok" />
        ) : (
          <ClubStatusPill label="Non vérifié" tone="warn" />
        )}
      </View>
      <View style={styles.heroCol}>
        <PressableSpring
          onPress={editable ? onPressCrest : undefined}
          disabled={!editable || crestUploading}
          scaleTo={0.97}
          haptic={editable}
          style={[styles.crest, { borderColor: tokens.successSoft }]}
          accessibilityRole={editable ? 'button' : undefined}
          accessibilityLabel={
            logoUrl ? 'Changer le logo du club' : 'Ajouter le logo du club'
          }
        >
          <View style={styles.crestInner}>
            {crestUploading ? (
              <View style={[styles.crestPh, { backgroundColor: tokens.elevated }]}>
                <ActivityIndicator color={tokens.accent} />
              </View>
            ) : (
              crestInner
            )}
          </View>
          {editable && !crestUploading ? (
            <View style={[styles.crestBadge, { backgroundColor: tokens.accent }]}>
              <Icon name="camera" size={14} color={tokens.onAccent} />
            </View>
          ) : null}
        </PressableSpring>
        <ClubText variant="label" muted style={styles.eyebrow}>
          Identité club
        </ClubText>
        <ClubText variant="h1" numberOfLines={2} style={styles.clubName}>
          {clubName}
        </ClubText>
        {locationLine ? (
          <ClubText variant="caption" muted numberOfLines={2} style={styles.meta}>
            {locationLine}
          </ClubText>
        ) : null}
        {metaLine ? (
          <ClubText variant="caption" muted numberOfLines={2} style={styles.meta}>
            {metaLine}
          </ClubText>
        ) : null}
      </View>
    </View>
  );
}

/** Carte Pack / offre — CTA vers Pack Club existant. */
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
          colors={[tokens.pitchSoft, tokens.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.rail, { backgroundColor: tokens.pitch }]} />
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: tokens.pitchSoft, borderColor: tokens.pitch },
          ]}
        >
          <Icon name="star-outline" size={22} color={tokens.pitch} />
        </View>
        <View style={styles.col}>
          <ClubText variant="label" style={{ color: tokens.pitch }}>
            Offre
          </ClubText>
          <ClubText variant="h2" style={styles.title}>
            {title}
          </ClubText>
          <ClubText variant="caption" muted numberOfLines={2}>
            {hint}
          </ClubText>
          <View style={styles.ctaRow}>
            <PressableSpring onPress={onOpenPack} scaleTo={0.97} haptic style={styles.ctaPrimary}>
              <ClubText variant="caption" style={styles.ctaPrimaryLabel}>
                Voir le Pack
              </ClubText>
              <Icon name="chevron-forward" size={12} color={tokens.onAccent} />
            </PressableSpring>
            {onOpenQuote ? (
              <PressableSpring
                onPress={onOpenQuote}
                scaleTo={0.97}
                haptic
                style={[styles.ctaGhost, { borderColor: tokens.borderStrong }]}
              >
                <ClubText variant="caption" style={{ color: tokens.foreground, fontWeight: '800' }}>
                  Devis
                </ClubText>
              </PressableSpring>
            ) : null}
          </View>
        </View>
      </View>
    </AnimatedEntrance>
  );
}

/** Alerte opérationnelle (sans coach / adhésions). */
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
            size={16}
            color={accent}
          />
        </View>
        <View style={styles.col}>
          <ClubText variant="body" style={{ fontWeight: '800' }}>
            {alert.title}
          </ClubText>
          <ClubText variant="caption" muted numberOfLines={2}>
            {alert.body}
          </ClubText>
        </View>
        <View style={[styles.ctaChip, { borderColor: tokens.borderStrong }]}>
          <ClubText variant="caption" style={{ color: tokens.foreground, fontWeight: '800' }}>
            {alert.ctaLabel}
          </ClubText>
        </View>
      </PressableSpring>
    </AnimatedEntrance>
  );
}

/** Tuile réglages / outils. */
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

const identityStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    wrap: {
      marginHorizontal: -clubSpace.lg,
      marginTop: -clubSpace.sm,
      marginBottom: clubSpace.md,
      paddingBottom: clubSpace.lg,
      overflow: 'hidden',
    },
    heroWash: {
      ...StyleSheet.absoluteFillObject,
    },
    statusCol: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: clubSpace.lg,
      paddingTop: clubSpace.md,
      justifyContent: 'flex-end',
    },
    heroCol: {
      alignItems: 'center',
      paddingHorizontal: clubSpace.lg,
      paddingTop: clubSpace.sm,
      gap: 6,
    },
    crest: {
      width: 96,
      height: 96,
      borderRadius: 28,
      borderWidth: 2,
      overflow: 'visible',
      marginBottom: 4,
      ...clubShadow.lift,
    },
    crestInner: {
      width: '100%',
      height: '100%',
      borderRadius: 26,
      overflow: 'hidden',
      backgroundColor: tokens.elevated,
    },
    crestImg: { width: '100%', height: '100%' },
    crestPh: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    crestLetter: {
      fontSize: 36,
      fontWeight: '800',
      color: tokens.onAccent,
    },
    crestBadge: {
      position: 'absolute',
      right: -4,
      bottom: -4,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: tokens.bg,
    },
    eyebrow: {
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      fontSize: 11,
      marginTop: 4,
    },
    clubName: {
      textAlign: 'center',
      fontWeight: '800',
      letterSpacing: -0.4,
      color: tokens.foreground,
    },
    meta: {
      textAlign: 'center',
      maxWidth: 320,
    },
  });

const packStyles = (tokens: ClubThemeTokens) =>
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

const alertStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.md,
      paddingVertical: clubSpace.md,
      paddingHorizontal: clubSpace.lg,
      paddingLeft: clubSpace.lg + 6,
      borderRadius: clubRadius.xl,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
      overflow: 'hidden',
    },
    rail: {
      position: 'absolute',
      left: 0,
      top: 12,
      bottom: 12,
      width: 3,
      borderTopRightRadius: 2,
      borderBottomRightRadius: 2,
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
    ctaChip: {
      paddingVertical: 6,
      paddingHorizontal: 10,
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
      gap: clubSpace.md,
      paddingVertical: clubSpace.md,
      paddingHorizontal: clubSpace.lg,
      borderRadius: clubRadius.xl,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
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
  });
