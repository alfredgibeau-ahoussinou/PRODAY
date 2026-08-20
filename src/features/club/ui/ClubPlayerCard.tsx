import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { ClubStatusPill, ClubText } from './clubUi';
import { useClubTheme } from '../shell/ClubThemeContext';
import { clubJerseyLabel, clubPositionShort } from './clubPlayerIdentity';
import { clubRadius, clubShadow, clubSpace, clubType } from '../theme/clubDesignSystem';
import type { ClubThemeTokens } from '../theme/clubTokens';

export type ClubPlayerCardStats = {
  matches?: number | null;
  goals?: number | null;
  assists?: number | null;
};

type Props = {
  displayName: string;
  position?: string | null;
  jerseyNumber?: number | null;
  photoUrl?: string | null;
  teamOrClub?: string | null;
  statusLabel?: string | null;
  statusTone?: 'ok' | 'warn' | 'alert' | 'neutral' | 'accent';
  metaLabel?: string | null;
  stats?: ClubPlayerCardStats;
  onPress?: () => void;
};

/**
 * Carte joueur Club — plaque maillot / crest, n° en héros.
 * Identité distincte du bouclier pôle Joueur (pas de rating inventé).
 */
export function ClubPlayerCard({
  displayName,
  position,
  jerseyNumber,
  photoUrl,
  teamOrClub,
  statusLabel,
  statusTone = 'neutral',
  metaLabel,
  stats,
  onPress,
}: Props) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const pos = clubPositionShort(position);
  const jersey = clubJerseyLabel(jerseyNumber);
  const initial = (displayName?.trim()?.charAt(0) || '?').toUpperCase();

  const statBits = [
    stats?.matches != null ? `M ${stats.matches}` : null,
    stats?.goals != null ? `B ${stats.goals}` : null,
    stats?.assists != null ? `P ${stats.assists}` : null,
  ].filter(Boolean);

  const body = (
    <View style={styles.shell}>
      <LinearGradient
        colors={[tokens.elevated, tokens.surface, tokens.headerWash]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.face}
      >
        {/* Texture pitch très légère */}
        <View style={styles.pitchWash} pointerEvents="none" />
        <View style={[styles.yard, styles.yardA]} pointerEvents="none" />
        <View style={[styles.yard, styles.yardB]} pointerEvents="none" />

        <View style={[styles.kitStripe, { backgroundColor: tokens.accent }]} />

        <View style={styles.jerseyPlate}>
          <ClubText variant="label" style={styles.jerseyCap}>
            N°
          </ClubText>
          <ClubText style={styles.jerseyNum}>{jersey}</ClubText>
          {pos ? (
            <View style={[styles.posChip, { backgroundColor: tokens.accentSoft }]}>
              <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '800', fontSize: 10 }}>
                {pos}
              </ClubText>
            </View>
          ) : null}
        </View>

        <View style={[styles.crest, { borderColor: tokens.accentSoft }]}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={[tokens.accentDeep, tokens.accent, tokens.elevated]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={[styles.photo, styles.photoPh]}
            >
              <ClubText style={styles.photoLetter}>{initial}</ClubText>
            </LinearGradient>
          )}
        </View>

        <View style={styles.copy}>
          <ClubText variant="h3" numberOfLines={1} style={styles.name}>
            {displayName}
          </ClubText>
          {teamOrClub ? (
            <ClubText variant="caption" muted numberOfLines={1}>
              {teamOrClub}
            </ClubText>
          ) : null}
          <View style={styles.metaRow}>
            {statusLabel ? <ClubStatusPill label={statusLabel} tone={statusTone} /> : null}
            {metaLabel ? (
              <ClubText variant="caption" muted numberOfLines={1} style={styles.meta}>
                {metaLabel}
              </ClubText>
            ) : null}
          </View>
          {statBits.length > 0 ? (
            <View style={styles.statRow}>
              {statBits.map((bit) => (
                <View key={bit as string} style={styles.statChip}>
                  <ClubText variant="caption" style={styles.statText}>
                    {bit}
                  </ClubText>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {onPress ? (
          <View style={[styles.chevron, { backgroundColor: tokens.accentSoft }]}>
            <Icon name="chevron-forward" size={14} color={tokens.accent} />
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );

  if (onPress) {
    return (
      <PressableSpring onPress={onPress} scaleTo={0.98} haptic style={styles.press}>
        {body}
      </PressableSpring>
    );
  }
  return body;
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    press: { borderRadius: clubRadius.lg },
    shell: {
      borderRadius: clubRadius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.surface,
      ...clubShadow.soft,
    },
    face: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: clubSpace.sm + 2,
      paddingRight: clubSpace.sm,
      paddingLeft: clubSpace.md + 4,
      minHeight: 92,
      overflow: 'hidden',
    },
    pitchWash: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: tokens.pitchSoft,
      opacity: 0.22,
    },
    yard: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: 'rgba(238,243,251,0.06)',
    },
    yardA: { top: '38%' },
    yardB: { top: '68%' },
    kitStripe: {
      position: 'absolute',
      left: 0,
      top: 12,
      bottom: 12,
      width: 3,
      borderTopRightRadius: 2,
      borderBottomRightRadius: 2,
    },
    jerseyPlate: {
      width: 44,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      flexShrink: 0,
    },
    jerseyCap: {
      color: tokens.faint,
      fontSize: 9,
      letterSpacing: 1.4,
    },
    jerseyNum: {
      ...clubType.stat,
      fontSize: 26,
      lineHeight: 28,
      color: tokens.foreground,
      fontWeight: '800',
      letterSpacing: -1,
    },
    posChip: {
      marginTop: 2,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: clubRadius.xs,
    },
    crest: {
      width: 52,
      height: 64,
      borderRadius: clubRadius.md,
      borderTopLeftRadius: clubRadius.lg,
      borderTopRightRadius: clubRadius.lg,
      borderBottomLeftRadius: clubRadius.sm,
      borderBottomRightRadius: clubRadius.sm,
      overflow: 'hidden',
      borderWidth: 1.5,
      backgroundColor: tokens.raised,
      flexShrink: 0,
    },
    photo: { width: '100%', height: '100%' },
    photoPh: { alignItems: 'center', justifyContent: 'center' },
    photoLetter: {
      color: tokens.onAccent,
      fontWeight: '900',
      fontSize: 22,
    },
    copy: { flex: 1, minWidth: 0, gap: 3 },
    name: { letterSpacing: -0.25 },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 2,
    },
    meta: { flexShrink: 1 },
    statRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 4,
    },
    statChip: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: clubRadius.xs,
      backgroundColor: tokens.raised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    statText: {
      color: tokens.muted,
      fontWeight: '700',
      fontSize: 10,
      letterSpacing: 0.2,
    },
    chevron: {
      width: 28,
      height: 28,
      borderRadius: clubRadius.xs,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      alignSelf: 'center',
    },
  });
