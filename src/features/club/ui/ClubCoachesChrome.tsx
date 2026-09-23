/**
 * Composition visuelle Coachs Club — hero sans coach + cartes annuaire.
 */
import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { PressableSpring, AnimatedEntrance } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { useClubTheme } from '../shell/ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { clubForm, clubRadius, clubShadow, clubSpace } from '../theme/clubDesignSystem';
import { ClubStatusPill, ClubText } from './clubUi';
import type { ClubCoachListItem } from './clubCoachesModel';

/** Hero équipes sans coach. */
export function ClubCoachesGapHero({
  count,
  teamNames,
  onAssign,
  onSeeTeams,
}: {
  count: number;
  teamNames: string[];
  onAssign: () => void;
  onSeeTeams?: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => heroStyles(tokens), [tokens]);
  if (count <= 0) return null;

  const preview =
    teamNames.length > 0
      ? teamNames.slice(0, 3).join(', ') + (teamNames.length > 3 ? '…' : '')
      : 'Catégories à couvrir';

  return (
    <AnimatedEntrance kind="fadeUp" index={0} delayStep={36}>
      {/* Référence : carte plate et neutre — la couleur reste dans la pastille. */}
      <View style={styles.card}>
        <View style={[styles.iconBadge, { backgroundColor: tokens.warningSoft }]}>
          <Icon name="school" size={20} color={tokens.warning} />
        </View>
        <View style={styles.col}>
          <ClubText variant="label" style={{ color: tokens.warning }}>
            Affectation
          </ClubText>
          <ClubText variant="h2" style={styles.title}>
            {count} sans coach
          </ClubText>
          <ClubText variant="caption" muted numberOfLines={2}>
            {preview}
          </ClubText>
          <View style={styles.ctaRow}>
            <PressableSpring onPress={onAssign} scaleTo={0.97} haptic style={styles.ctaPrimary}>
              <ClubText variant="caption" style={styles.ctaPrimaryLabel}>
                Affecter
              </ClubText>
              <Icon name="chevron-forward" size={12} color={tokens.onAccent} />
            </PressableSpring>
            {onSeeTeams ? (
              <PressableSpring
                onPress={onSeeTeams}
                scaleTo={0.97}
                haptic
                style={[styles.ctaGhost, { borderColor: tokens.borderStrong }]}
              >
                <ClubText variant="caption" style={{ color: tokens.foreground, fontWeight: '800' }}>
                  Équipes
                </ClubText>
              </PressableSpring>
            ) : null}
          </View>
        </View>
      </View>
    </AnimatedEntrance>
  );
}

/** Carte coach annuaire. */
export function ClubCoachListCard({
  item,
  index,
  onPress,
}: {
  item: ClubCoachListItem;
  index: number;
  onPress: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => cardStyles(tokens), [tokens]);
  const photo = item.coach.avatar_url;
  const diploma = item.coach.profile?.diploma?.trim();

  return (
    <AnimatedEntrance kind="fadeUp" index={index + 1} delayStep={36}>
      <PressableSpring
        onPress={onPress}
        scaleTo={0.97}
        haptic
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={`${item.coach.display_name || 'Coach'}, ${item.teamsLabel}`}
      >
        <View
          style={[
            styles.accentBar,
            { backgroundColor: item.isUnassigned ? tokens.warning : tokens.accent },
          ]}
        />
        <View style={[styles.avatar, { backgroundColor: tokens.accentSoft }]}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatarImg} resizeMode="cover" />
          ) : (
            <Icon name="school" size={20} color={tokens.accent} />
          )}
        </View>
        <View style={styles.copy}>
          <ClubText variant="body" numberOfLines={1} style={{ fontWeight: '800' }}>
            {item.coach.display_name || 'Coach'}
          </ClubText>
          <ClubText variant="caption" muted numberOfLines={2}>
            {item.teamsLabel}
          </ClubText>
          {diploma ? (
            <ClubText variant="caption" muted numberOfLines={1}>
              {diploma}
            </ClubText>
          ) : null}
        </View>
        <ClubStatusPill
          label={item.isUnassigned ? 'Libre' : `${item.teams.length} éq.`}
          tone={item.isUnassigned ? 'warn' : 'ok'}
        />
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
      paddingVertical: clubSpace.lg,
      paddingHorizontal: clubSpace.lg,
      borderRadius: clubForm.groupRadius,
      backgroundColor: tokens.surface,
      overflow: 'hidden',
    },
    iconBadge: {
      width: 44,
      height: 44,
      borderRadius: clubRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
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
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: clubRadius.pill,
      borderWidth: 1,
      backgroundColor: tokens.elevated,
    },
  });

const cardStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.md,
      paddingVertical: clubSpace.md,
      paddingHorizontal: clubSpace.md,
      borderRadius: clubRadius.xl,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      overflow: 'hidden',
      ...clubShadow.soft,
    },
    accentBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: clubRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      flexShrink: 0,
    },
    avatarImg: { width: '100%', height: '100%' },
    copy: { flex: 1, minWidth: 0, gap: 2 },
  });
