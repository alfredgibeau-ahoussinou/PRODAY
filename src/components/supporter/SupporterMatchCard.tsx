import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { PressableSpring } from '../motion';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { SUPPORTER_SITE } from '../../content/supporterPageIdentity';
import { radius, spacing } from '../../theme/designTokens';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';

export type SupporterMatchCardProps = {
  item: SupporterMatchViewItem;
  isFollowed?: boolean;
  onToggleFollow?: () => void;
  onDebate?: () => void;
  onMoment?: () => void;
  compact?: boolean;
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

function LivePulse({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.liveDot, { backgroundColor: color, opacity }]}
    />
  );
}

export const SupporterMatchCard: React.FC<SupporterMatchCardProps> = ({
  item,
  isFollowed = false,
  onToggleFollow,
  onDebate,
  onMoment,
  compact = false,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const genderKey = genderLabelKey(item.genderScope);
  const isLive = item.status === 'live';
  const showScore = item.status !== 'upcoming' && item.scoreHome != null && item.scoreAway != null;
  const sourceIsProday = item.source === 'proday';

  return (
    <ProDaySurface
      variant="module"
      style={[
        styles.card,
        compact && styles.cardCompact,
        {
          borderColor: isLive ? SUPPORTER_SITE.live : colors.border,
          backgroundColor: isLive ? 'rgba(52, 211, 153, 0.04)' : undefined,
        },
      ]}
    >
      <View style={styles.badges}>
        {isLive ? (
          <View style={[styles.badge, styles.liveBadge, { borderColor: SUPPORTER_SITE.live }]}>
            <LivePulse color={SUPPORTER_SITE.live} />
            <ProDayText variant="caption" style={{ color: SUPPORTER_SITE.live, fontWeight: '800' }}>
              {t(statusLabelKey(item.status))}
            </ProDayText>
          </View>
        ) : (
          <Badge label={t(statusLabelKey(item.status))} colors={colors} />
        )}
        <Badge
          label={
            sourceIsProday
              ? t('supporter.match.source.proday')
              : t('supporter.match.source.world')
          }
          colors={colors}
          proday={sourceIsProday}
        />
        {genderKey ? <Badge label={t(genderKey)} colors={colors} muted /> : null}
      </View>

      <View style={styles.teamsRow}>
        <ProDayText variant="section" style={styles.teamName} numberOfLines={2}>
          {item.homeLabel}
        </ProDayText>
        {showScore ? (
          <ProDayText
            variant={isLive ? 'hero' : 'title'}
            style={[styles.score, { color: isLive ? SUPPORTER_SITE.live : colors.accent }]}
          >
            {item.scoreHome} - {item.scoreAway}
          </ProDayText>
        ) : (
          <ProDayText variant="caption" muted>
            {item.timeLabel ?? '…'}
          </ProDayText>
        )}
        <ProDayText variant="section" style={[styles.teamName, styles.teamAway]} numberOfLines={2}>
          {item.awayLabel}
        </ProDayText>
      </View>

      {isLive && item.minute != null ? (
        <View style={styles.minuteRow}>
          <LivePulse color={SUPPORTER_SITE.live} />
          <ProDayText variant="caption" style={{ color: SUPPORTER_SITE.live, fontWeight: '700' }}>
            {t('supporter.match.minute', { n: String(item.minute) })}
          </ProDayText>
        </View>
      ) : item.timeLabel && !isLive ? (
        <ProDayText variant="caption" muted>
          {item.timeLabel}
        </ProDayText>
      ) : null}

      {item.meta ? (
        <ProDayText variant="caption" muted numberOfLines={1}>
          {item.meta}
        </ProDayText>
      ) : null}

      {!compact && item.scorers && item.scorers.length > 0 ? (
        <ProDayText variant="caption" muted numberOfLines={2}>
          {t('supporter.match.scorers')}: {item.scorers.join(' · ')}
        </ProDayText>
      ) : null}

      {!compact ? (
        <View style={styles.actions}>
          {item.followTarget && onToggleFollow ? (
            <ActionChip
              label={
                isFollowed
                  ? t('supporter.match.action.following')
                  : t('supporter.match.action.follow')
              }
              active={isFollowed}
              onPress={onToggleFollow}
              colors={colors}
            />
          ) : null}
          <ActionChip label={t('supporter.match.action.debate')} onPress={onDebate} colors={colors} />
          <ActionChip label={t('supporter.match.action.moment')} onPress={onMoment} colors={colors} />
        </View>
      ) : null}
    </ProDaySurface>
  );
};

function Badge({
  label,
  accent,
  proday,
  muted,
  colors,
}: {
  label: string;
  accent?: boolean;
  proday?: boolean;
  muted?: boolean;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const bg = proday
    ? SUPPORTER_SITE.soft
    : muted
      ? 'rgba(255,255,255,0.03)'
      : accent
        ? colors.accentSoft
        : 'rgba(255,255,255,0.04)';
  const border = proday
    ? SUPPORTER_SITE.accent
    : muted
      ? colors.border
      : accent
        ? colors.accent
        : colors.border;
  const text = proday
    ? SUPPORTER_SITE.bright
    : muted
      ? colors.textSecondary
      : accent
        ? colors.accent
        : colors.textSecondary;

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
      <ProDayText variant="caption" style={{ color: text, fontWeight: proday ? '800' : '600' }}>
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
  cardCompact: {
    padding: spacing.sm,
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
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
  score: {
    fontWeight: '900',
    letterSpacing: 1,
    minWidth: 72,
    textAlign: 'center',
  },
  minuteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
