import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ClubStatusPill, ClubText } from './clubUi';
import { useClubTheme } from '../shell/ClubThemeContext';
import { clubJerseyLabel, clubPositionShort } from './clubPlayerIdentity';
import { clubRadius, clubShadow, clubSpace, clubType } from '../theme/clubDesignSystem';
import type { ClubThemeTokens } from '../theme/clubTokens';

export type ClubPlayerHeroStats = {
  matches?: number | null;
  goals?: number | null;
  assists?: number | null;
};

type Props = {
  displayName: string;
  position?: string | null;
  jerseyNumber?: number | null;
  photoUrl?: string | null;
  clubName?: string | null;
  clubLogoUrl?: string | null;
  subtitle?: string | null;
  statusLabel?: string | null;
  statusTone?: 'ok' | 'warn' | 'alert' | 'neutral' | 'accent';
  stats?: ClubPlayerHeroStats;
};

/**
 * Hero fiche joueur Club — n° maillot en watermark, crest photo, bandeau stats.
 * Remplace le PlayerShieldCard du pôle Joueur sur les écrans Club.
 */
export function ClubPlayerHero({
  displayName,
  position,
  jerseyNumber,
  photoUrl,
  clubName,
  clubLogoUrl,
  subtitle,
  statusLabel,
  statusTone = 'neutral',
  stats,
}: Props) {
  const { tokens, logoUrl } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const crestLogo = clubLogoUrl ?? logoUrl;
  const pos = clubPositionShort(position);
  const jersey = clubJerseyLabel(jerseyNumber);
  const initial = (displayName?.trim()?.charAt(0) || '?').toUpperCase();

  const rows: { label: string; value: string }[] = [
    {
      label: 'Matchs',
      value: stats?.matches != null ? String(stats.matches) : '—',
    },
    {
      label: 'Buts',
      value: stats?.goals != null ? String(stats.goals) : '—',
    },
    {
      label: 'Passes',
      value: stats?.assists != null ? String(stats.assists) : '—',
    },
  ];

  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={[tokens.headerWash, tokens.surface, tokens.elevated]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.face}
      >
        <View style={styles.pitchWash} pointerEvents="none" />
        <View style={[styles.yard, { top: '28%' }]} pointerEvents="none" />
        <View style={[styles.yard, { top: '52%' }]} pointerEvents="none" />
        <View style={[styles.yard, { top: '76%' }]} pointerEvents="none" />

        <View style={styles.watermarkWrap} pointerEvents="none">
          <ClubText style={styles.watermark}>{jersey}</ClubText>
        </View>

        <View style={styles.topRow}>
          <View style={[styles.crest, { borderColor: tokens.accentSoft }]}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
            ) : (
              <LinearGradient
                colors={[tokens.accentDeep, tokens.accent, tokens.raised]}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={[styles.photo, styles.photoPh]}
              >
                <ClubText style={styles.photoLetter}>{initial}</ClubText>
              </LinearGradient>
            )}
            <View style={[styles.crestCap, { backgroundColor: tokens.accent }]} />
          </View>

          <View style={styles.identity}>
            <View style={styles.clubRow}>
              {crestLogo ? (
                <Image source={{ uri: crestLogo }} style={styles.clubLogo} resizeMode="cover" />
              ) : (
                <View style={[styles.clubLogo, styles.clubLogoPh, { backgroundColor: tokens.accentSoft }]}>
                  <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '800' }}>
                    {(clubName || displayName).charAt(0).toUpperCase()}
                  </ClubText>
                </View>
              )}
              <ClubText variant="caption" muted numberOfLines={1} style={{ flex: 1 }}>
                {clubName?.trim() || 'Club'}
              </ClubText>
            </View>

            <ClubText variant="h1" numberOfLines={2} style={styles.name}>
              {displayName}
            </ClubText>

            <View style={styles.badges}>
              <View style={[styles.jerseyBadge, { backgroundColor: tokens.accent }]}>
                <ClubText variant="caption" style={styles.jerseyBadgeText}>
                  #{jersey === '—' ? '—' : jersey}
                </ClubText>
              </View>
              {pos ? (
                <View style={[styles.posBadge, { backgroundColor: tokens.accentSoft }]}>
                  <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '800' }}>
                    {pos}
                  </ClubText>
                </View>
              ) : null}
              {statusLabel ? <ClubStatusPill label={statusLabel} tone={statusTone} /> : null}
            </View>

            {subtitle ? (
              <ClubText variant="caption" muted numberOfLines={2}>
                {subtitle}
              </ClubText>
            ) : null}
          </View>
        </View>

        <View style={styles.statStrip}>
          {rows.map((r, i) => (
            <View
              key={r.label}
              style={[styles.statCell, i < rows.length - 1 && styles.statCellBorder]}
            >
              <ClubText style={styles.statValue}>{r.value}</ClubText>
              <ClubText variant="label" muted style={styles.statLabel}>
                {r.label}
              </ClubText>
            </View>
          ))}
        </View>
      </LinearGradient>
      <View style={[styles.accentBar, { backgroundColor: tokens.accent }]} />
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    shell: {
      borderRadius: clubRadius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: tokens.borderStrong,
      backgroundColor: tokens.surface,
      ...clubShadow.lift,
    },
    face: {
      padding: clubSpace.lg,
      gap: clubSpace.lg,
      overflow: 'hidden',
    },
    pitchWash: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: tokens.pitchSoft,
      opacity: 0.28,
    },
    yard: {
      position: 'absolute',
      left: clubSpace.lg,
      right: clubSpace.lg,
      height: StyleSheet.hairlineWidth,
      backgroundColor: 'rgba(238,243,251,0.07)',
    },
    watermarkWrap: {
      position: 'absolute',
      right: -4,
      top: -8,
    },
    watermark: {
      ...clubType.score,
      fontSize: 112,
      lineHeight: 112,
      color: tokens.foreground,
      opacity: 0.06,
      fontWeight: '900',
      letterSpacing: -4,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: clubSpace.md,
    },
    crest: {
      width: 96,
      height: 118,
      borderRadius: clubRadius.lg,
      borderTopLeftRadius: clubRadius.xxl,
      borderTopRightRadius: clubRadius.xxl,
      borderBottomLeftRadius: clubRadius.md,
      borderBottomRightRadius: clubRadius.md,
      overflow: 'hidden',
      borderWidth: 2,
      backgroundColor: tokens.raised,
      flexShrink: 0,
      ...clubShadow.accent(tokens),
    },
    crestCap: {
      position: 'absolute',
      top: 0,
      left: '22%',
      right: '22%',
      height: 5,
      borderBottomLeftRadius: 3,
      borderBottomRightRadius: 3,
    },
    photo: { width: '100%', height: '100%' },
    photoPh: { alignItems: 'center', justifyContent: 'center' },
    photoLetter: {
      color: tokens.onAccent,
      fontWeight: '900',
      fontSize: 36,
    },
    identity: { flex: 1, minWidth: 0, gap: clubSpace.sm },
    clubRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    clubLogo: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    clubLogoPh: { alignItems: 'center', justifyContent: 'center' },
    name: { letterSpacing: -0.5 },
    badges: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
    },
    jerseyBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: clubRadius.xs,
    },
    jerseyBadgeText: {
      color: tokens.onAccent,
      fontWeight: '900',
      letterSpacing: 0.4,
    },
    posBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: clubRadius.xs,
    },
    statStrip: {
      flexDirection: 'row',
      borderRadius: clubRadius.md,
      backgroundColor: tokens.raised,
      borderWidth: 1,
      borderColor: tokens.border,
      overflow: 'hidden',
    },
    statCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: clubSpace.md,
      gap: 4,
    },
    statCellBorder: {
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: tokens.border,
    },
    statValue: {
      ...clubType.stat,
      fontSize: 22,
      lineHeight: 26,
      color: tokens.foreground,
    },
    statLabel: {
      fontSize: 9,
      letterSpacing: 1.1,
      color: tokens.faint,
    },
    accentBar: {
      height: 3,
      width: '100%',
    },
  });
