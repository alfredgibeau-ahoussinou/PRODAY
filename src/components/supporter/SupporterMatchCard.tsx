import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PressableSpring } from '../motion';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { radius, spacing } from '../../theme/designTokens';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';

export type SupporterMatchCardProps = {
  item: SupporterMatchViewItem;
  isFollowed?: boolean;
  onToggleFollow?: () => void;
  onDebate?: () => void;
  onMoment?: () => void;
};

function statusLabelKey(status: SupporterMatchViewItem['status']): string {
  if (status === 'live') return 'supporter.match.status.live';
  if (status === 'finished') return 'supporter.match.status.finished';
  return 'supporter.match.status.upcoming';
}

function genderLabelKey(scope: SupporterMatchViewItem['genderScope']): string | null {
  if (scope === 'men') return 'supporter.match.gender.men';
  if (scope === 'women') return 'supporter.match.gender.women';
  if (scope === 'mixed') return 'supporter.match.gender.mixed';
  return null;
}

export const SupporterMatchCard: React.FC<SupporterMatchCardProps> = ({
  item,
  isFollowed = false,
  onToggleFollow,
  onDebate,
  onMoment,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const genderKey = genderLabelKey(item.genderScope);
  const showScore = item.status !== 'upcoming' && item.scoreHome != null && item.scoreAway != null;

  return (
    <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
      <View style={styles.badges}>
        <Badge label={t(statusLabelKey(item.status))} accent={item.status === 'live'} colors={colors} />
        <Badge
          label={item.source === 'proday' ? t('supporter.match.source.proday') : t('supporter.match.source.world')}
          colors={colors}
        />
        {genderKey ? <Badge label={t(genderKey)} colors={colors} /> : null}
      </View>

      <View style={styles.teamsRow}>
        <ProDayText variant="section" style={styles.teamName} numberOfLines={2}>
          {item.homeLabel}
        </ProDayText>
        {showScore ? (
          <ProDayText variant="title" style={{ color: colors.accent }}>
            {item.scoreHome} - {item.scoreAway}
          </ProDayText>
        ) : (
          <ProDayText variant="caption" muted>
            {item.timeLabel ?? '—'}
          </ProDayText>
        )}
        <ProDayText variant="section" style={[styles.teamName, styles.teamAway]} numberOfLines={2}>
          {item.awayLabel}
        </ProDayText>
      </View>

      {item.status === 'live' && item.minute != null ? (
        <ProDayText variant="caption" style={{ color: colors.accent }}>
          {t('supporter.match.minute', { n: String(item.minute) })}
        </ProDayText>
      ) : item.timeLabel && item.status !== 'live' ? (
        <ProDayText variant="caption" muted>
          {item.timeLabel}
        </ProDayText>
      ) : null}

      {item.meta ? (
        <ProDayText variant="caption" muted>
          {item.meta}
        </ProDayText>
      ) : null}

      {item.scorers && item.scorers.length > 0 ? (
        <ProDayText variant="caption" muted numberOfLines={2}>
          {t('supporter.match.scorers')}: {item.scorers.join(' · ')}
        </ProDayText>
      ) : null}

      <View style={styles.actions}>
        {item.followTarget && onToggleFollow ? (
          <ActionChip
            label={isFollowed ? t('supporter.match.action.following') : t('supporter.match.action.follow')}
            active={isFollowed}
            onPress={onToggleFollow}
            colors={colors}
          />
        ) : null}
        <ActionChip label={t('supporter.match.action.debate')} onPress={onDebate} colors={colors} />
        <ActionChip label={t('supporter.match.action.moment')} onPress={onMoment} colors={colors} />
      </View>
    </ProDaySurface>
  );
};

function Badge({
  label,
  accent,
  colors,
}: {
  label: string;
  accent?: boolean;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: accent ? colors.accentSoft : 'rgba(255,255,255,0.04)',
          borderColor: accent ? colors.accent : colors.border,
        },
      ]}
    >
      <ProDayText variant="caption" style={{ color: accent ? colors.accent : colors.textSecondary }}>
        {label}
      </ProDayText>
    </View>
  );
}

function ActionChip({
  label,
  onPress,
  active,
  colors,
}: {
  label: string;
  onPress?: () => void;
  active?: boolean;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <PressableSpring
      onPress={onPress}
      style={[
        styles.action,
        {
          backgroundColor: active ? colors.accentSoft : colors.surfaceMuted,
          borderColor: active ? colors.accent : colors.border,
        },
      ]}
    >
      <ProDayText variant="caption" style={{ color: active ? colors.accent : colors.textSecondary }}>
        {label}
      </ProDayText>
    </PressableSpring>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  teamName: {
    flex: 1,
  },
  teamAway: {
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  action: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
