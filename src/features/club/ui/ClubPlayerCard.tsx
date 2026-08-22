import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { ClubStatusPill, ClubText } from './clubUi';
import { useClubTheme } from '../shell/ClubThemeContext';
import { clubJerseyLabel, clubPositionShort } from './clubPlayerIdentity';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';
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
 * Ligne effectif Club — avatar circulaire + nom + rôle + tags (réf. sport management).
 * Pas de plaque maillot dominante : identité liste premium.
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
  const jersey = jerseyNumber != null ? clubJerseyLabel(jerseyNumber) : null;
  const initial = (displayName?.trim()?.charAt(0) || '?').toUpperCase();

  const roleLine = [pos, teamOrClub].filter(Boolean).join(' · ') || undefined;

  const tags = [
    statusLabel
      ? { key: 'status', label: statusLabel, tone: statusTone }
      : null,
    jersey ? { key: 'jersey', label: `N° ${jersey}`, tone: 'neutral' as const } : null,
    metaLabel ? { key: 'meta', label: metaLabel, tone: 'neutral' as const } : null,
  ].filter(Boolean) as { key: string; label: string; tone: NonNullable<Props['statusTone']> }[];

  const statBits = [
    stats?.matches != null ? `M ${stats.matches}` : null,
    stats?.goals != null ? `B ${stats.goals}` : null,
    stats?.assists != null ? `P ${stats.assists}` : null,
  ].filter(Boolean);

  const body = (
    <View style={styles.row}>
      <View style={[styles.avatar, { borderColor: tokens.border }]}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[tokens.accentDeep, tokens.accent]}
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
        {roleLine ? (
          <ClubText variant="caption" muted numberOfLines={1} style={styles.role}>
            {roleLine}
          </ClubText>
        ) : null}
        {tags.length > 0 || statBits.length > 0 ? (
          <View style={styles.tagRow}>
            {tags.map((tag) =>
              tag.key === 'status' ? (
                <ClubStatusPill key={tag.key} label={tag.label} tone={tag.tone} />
              ) : (
                <View key={tag.key} style={styles.tag}>
                  <ClubText variant="caption" style={styles.tagText}>
                    {tag.label}
                  </ClubText>
                </View>
              ),
            )}
            {statBits.map((bit) => (
              <View key={bit as string} style={styles.tag}>
                <ClubText variant="caption" style={styles.tagText}>
                  {bit}
                </ClubText>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {onPress ? (
        <Icon name="chevron-forward" size={16} color={tokens.accent} />
      ) : null}
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
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.md,
      paddingVertical: clubSpace.md,
      paddingHorizontal: clubSpace.md,
      minHeight: 72,
      borderRadius: clubRadius.xl,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1.5,
      backgroundColor: tokens.raised,
      flexShrink: 0,
    },
    photo: { width: '100%', height: '100%' },
    photoPh: { alignItems: 'center', justifyContent: 'center' },
    photoLetter: {
      color: tokens.onAccent,
      fontWeight: '800',
      fontSize: 18,
    },
    copy: { flex: 1, minWidth: 0, gap: 4 },
    name: {
      letterSpacing: -0.2,
      fontWeight: '700',
      fontSize: 16,
      lineHeight: 20,
    },
    role: {
      color: tokens.muted,
    },
    tagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 2,
    },
    tag: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: clubRadius.sm,
      backgroundColor: tokens.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    tagText: {
      color: tokens.muted,
      fontWeight: '600',
      fontSize: 11,
    },
  });
