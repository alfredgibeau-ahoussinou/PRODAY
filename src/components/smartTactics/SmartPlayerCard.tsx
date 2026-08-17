import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import type { SmartPlayerCardData } from '../../models/SmartTactics';
import { radius, spacing } from '../../theme/designTokens';
import { SMART_PITCH, SmartTacticsPressable, useSmartTacticsCoachSkin, useSmartTacticsTheme } from './smartTacticsUi';
import { CoachText } from '../coach/coachPortalUi';
import { Icon } from '../ui/Icon';
import { ProDayFutCard } from '../cards/ProDayFutCard';
import { smartPlayerToProDayCard } from '../../utils/prodayFutCard';

export const SmartPlayerCard: React.FC<{
  card: SmartPlayerCardData;
  compact?: boolean;
  /** Affiche la carte passeport Fut (flip + aperçu long-press). */
  fut?: boolean;
  onPress?: () => void;
}> = ({ card, compact, fut, onPress }) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const coach = useSmartTacticsCoachSkin();
  const theme = useSmartTacticsTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const readyTone =
    card.readiness_pct >= 75
      ? SMART_PITCH.ready
      : card.readiness_pct >= 50
        ? theme.midTone
        : SMART_PITCH.risk;

  if (fut) {
    return (
      <ProDayFutCard
        card={smartPlayerToProDayCard(card)}
        width={compact ? 160 : 220}
        onSelect={onPress}
        onAction={onPress ? () => onPress() : undefined}
      />
    );
  }

  if (coach && compact) {
    const body = (
      <View
        style={[
          styles.coachCompact,
          { borderColor: card.injured ? SMART_PITCH.risk : theme.border },
        ]}
      >
        <View style={styles.top}>
          <View style={[styles.avatar, { backgroundColor: theme.elevated }]}>
            {card.photo_url ? (
              <Image source={{ uri: card.photo_url }} style={styles.avatarImg} />
            ) : (
              <CoachText variant="section" accent>
                {card.display_name.slice(0, 1).toUpperCase()}
              </CoachText>
            )}
          </View>
          <View style={styles.meta}>
            <CoachText variant="body" style={{ fontWeight: '800' }} numberOfLines={1}>
              {card.display_name}
            </CoachText>
            <CoachText variant="caption" muted numberOfLines={1}>
              {[card.position, card.preferred_foot, card.age ? `${card.age} ans` : null]
                .filter(Boolean)
                .join(' · ')}
            </CoachText>
          </View>
          <View style={styles.overall}>
            <CoachText variant="caption" muted style={styles.overallLabel}>
              NOTE
            </CoachText>
            <CoachText variant="section" accent style={{ fontSize: 22 }}>
              {card.overall}
            </CoachText>
          </View>
        </View>
        <View style={styles.readinessRow}>
          <View style={styles.readinessBlock}>
            <CoachText variant="caption" muted>
              {t('smartTactics.ready')}
            </CoachText>
            <CoachText variant="section" style={{ color: readyTone }}>
              {card.readiness_pct}%
            </CoachText>
          </View>
        </View>
        <View style={[styles.barTrack, { backgroundColor: theme.border }]}>
          <View
            style={[styles.barFill, { width: `${card.readiness_pct}%`, backgroundColor: readyTone }]}
          />
        </View>
      </View>
    );
    if (onPress) {
      return (
        <SmartTacticsPressable onPress={onPress} scaleTo={0.97}>
          {body}
        </SmartTacticsPressable>
      );
    }
    return body;
  }

  const body = (
    <LinearGradient
      colors={['#001854', '#0A0A12', '#050508']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.card,
        compact && styles.compact,
        {
          borderColor: card.injured ? SMART_PITCH.risk : 'rgba(0,84,240,0.45)',
        },
      ]}
    >
      <View style={styles.top}>
        <View style={[styles.avatar, { backgroundColor: 'rgba(0,84,240,0.25)' }]}>
          {card.photo_url ? (
            <Image source={{ uri: card.photo_url }} style={styles.avatarImg} />
          ) : (
            <ProDayText variant="section" style={{ color: '#4C8BFF' }}>
              {card.display_name.slice(0, 1).toUpperCase()}
            </ProDayText>
          )}
          {card.is_captain ? (
            <View style={styles.captain}>
              <Icon name="star" size={10} color="#0B1A12" />
            </View>
          ) : null}
        </View>
        <View style={styles.meta}>
          <ProDayText variant="body" style={styles.name} numberOfLines={1}>
            {card.display_name}
          </ProDayText>
          <ProDayText variant="caption" muted numberOfLines={1}>
            {[card.position, card.preferred_foot, card.age ? `${card.age} ans` : null]
              .filter(Boolean)
              .join(' · ')}
          </ProDayText>
          {card.badges.length > 0 ? (
            <ProDayText variant="caption" style={{ color: '#4C8BFF', fontSize: 10 }}>
              {card.badges.slice(0, 2).join(' · ')}
            </ProDayText>
          ) : null}
        </View>
        <View style={styles.overall}>
          <ProDayText variant="caption" muted style={styles.overallLabel}>
            NOTE
          </ProDayText>
          <ProDayText variant="section" style={{ color: '#4C8BFF', fontSize: 22 }}>
            {card.overall}
          </ProDayText>
        </View>
      </View>

      <View style={styles.readinessRow}>
        <View style={styles.readinessBlock}>
          <ProDayText variant="caption" muted>
            {t('smartTactics.potential')}
          </ProDayText>
          <ProDayText variant="section">{card.overall}</ProDayText>
        </View>
        <View style={styles.readinessBlock}>
          <ProDayText variant="caption" muted>
            {t('smartTactics.ready')}
          </ProDayText>
          <ProDayText variant="section" style={{ color: readyTone }}>
            {card.readiness_pct}%
          </ProDayText>
        </View>
        {!compact ? (
          <>
            <View style={styles.readinessBlock}>
              <ProDayText variant="caption" muted>
                Forme
              </ProDayText>
              <ProDayText variant="section">{card.form}</ProDayText>
            </View>
            <View style={styles.readinessBlock}>
              <ProDayText variant="caption" muted>
                Conf.
              </ProDayText>
              <ProDayText variant="section">{card.confidence}</ProDayText>
            </View>
          </>
        ) : null}
      </View>

      <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
        <View
          style={[styles.barFill, { width: `${card.readiness_pct}%`, backgroundColor: readyTone }]}
        />
      </View>

      <View style={styles.footer}>
        <ProDayText variant="caption" muted>
          {card.availability === 'available'
            ? 'Dispo'
            : card.availability === 'doubtful'
              ? 'Doute'
              : card.availability === 'suspended'
                ? 'Suspendu'
                : 'Absent'}
          {card.contract_status ? ` · ${card.contract_status}` : ''}
        </ProDayText>
        <ProDayText variant="caption" muted>
          Prog. {card.progress}%
        </ProDayText>
      </View>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <SmartTacticsPressable onPress={onPress} scaleTo={0.97}>
        {body}
      </SmartTacticsPressable>
    );
  }
  return body;
};

function createStyles(theme: ReturnType<typeof useSmartTacticsTheme>) {
  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.sm + 2,
      gap: spacing.xs,
      overflow: 'hidden',
    },
    compact: { padding: spacing.sm },
    coachCompact: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.lg,
      padding: spacing.sm,
      gap: spacing.xs,
      backgroundColor: theme.surface,
    },
    top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImg: { width: '100%', height: '100%' },
    captain: {
      position: 'absolute',
      right: -2,
      top: -2,
      backgroundColor: SMART_PITCH.warm,
      borderRadius: 8,
      padding: 2,
    },
    meta: { flex: 1, gap: 1 },
    name: { fontWeight: '800', color: '#fff' },
    overall: { alignItems: 'center' },
    overallLabel: { fontSize: 9, fontWeight: '800' },
    readinessRow: { flexDirection: 'row', gap: spacing.xs },
    readinessBlock: { flex: 1, gap: 0 },
    barTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 2 },
    footer: { flexDirection: 'row', justifyContent: 'space-between' },
  });
}
