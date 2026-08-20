import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { useTranslation } from '../../context/LocaleContext';
import { SUPPORTER_SITE } from '../../content/supporterPageIdentity';
import { spacing } from '../../theme/designTokens';
import { formatKickoffClock } from '../../utils/supporterMatchFilters';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';

export type SupporterMatchCardProps = {
  item: SupporterMatchViewItem;
  isFollowed?: boolean;
  onToggleFollow?: () => void;
  onDebate?: () => void;
  onMoment?: () => void;
  compact?: boolean;
  hero?: boolean;
  onPress?: () => void;
};

function statusLabelKey(status: SupporterMatchViewItem['status']): string {
  if (status === 'live') return 'supporter.match.status.live';
  if (status === 'finished') return 'supporter.match.status.finished';
  return 'supporter.match.status.upcoming';
}

function LivePulse({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.4, duration: 1100, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.liveDot, { backgroundColor: color, opacity }]} />;
}

export const SupporterMatchCard: React.FC<SupporterMatchCardProps> = ({
  item,
  isFollowed = false,
  onToggleFollow,
  onDebate,
  onMoment,
  compact = false,
  hero = false,
  onPress,
}) => {
  const { t } = useTranslation();
  const isLive = item.status === 'live';
  const showScore = item.status !== 'upcoming' && item.scoreHome != null && item.scoreAway != null;
  const clock = isLive
    ? item.timeLabel ?? (item.minute != null ? `${item.minute}'` : 'LIVE')
    : formatKickoffClock(item.startsAt);
  const competition = item.competitionLabel ?? (item.source === 'proday' ? 'ProDay' : undefined);
  const venue = item.meta
    ?.split(' · ')
    .filter((part) => part && part !== competition)
    .join(' · ');

  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.card, compact && styles.cardCompact, hero && styles.cardHero]}>
      <View style={styles.lockup}>
        <View style={styles.timeCol}>
          {isLive ? (
            <View style={styles.livePill}>
              <LivePulse color={SUPPORTER_SITE.live} />
              <ProDayText variant="caption" style={styles.livePillText}>
                {t(statusLabelKey(item.status))}
              </ProDayText>
            </View>
          ) : (
            <ProDayText variant="title" style={[styles.clock, hero && styles.clockHero]}>
              {clock}
            </ProDayText>
          )}
          <ProDayText variant="caption" style={styles.sourceBadge}>
            {item.source === 'proday'
              ? t('supporter.match.source.proday')
              : t('supporter.match.source.world')}
          </ProDayText>
        </View>

        <View style={styles.teams}>
          {competition ? (
            <ProDayText variant="caption" style={styles.competition} numberOfLines={1}>
              {competition}
            </ProDayText>
          ) : null}
          <ProDayText
            variant={hero ? 'title' : 'section'}
            style={[styles.teamName, hero && styles.teamNameHero]}
            numberOfLines={1}
          >
            {item.homeLabel}
          </ProDayText>
          <ProDayText
            variant={hero ? 'title' : 'section'}
            style={[styles.teamName, styles.teamAway, hero && styles.teamNameHero]}
            numberOfLines={1}
          >
            {item.awayLabel}
          </ProDayText>
          {showScore ? (
            <ProDayText variant="title" style={styles.score}>
              {item.scoreHome} – {item.scoreAway}
            </ProDayText>
          ) : venue ? (
            <ProDayText variant="caption" style={styles.venue} numberOfLines={1}>
              {venue}
            </ProDayText>
          ) : null}
          {item.broadcastListed || item.watchUrl ? (
            <ProDayText variant="caption" style={styles.broadcast}>
              {item.watchUrl
                ? t('supporter.broadcast.watchFree')
                : t('supporter.broadcast.chip')}
            </ProDayText>
          ) : null}
        </View>
      </View>

      {!compact && !hero ? (
        <View style={styles.actions}>
          {item.followTarget && onToggleFollow ? (
            <Pressable onPress={onToggleFollow} hitSlop={8}>
              <ProDayText variant="caption" style={styles.actionText}>
                {isFollowed
                  ? t('supporter.match.action.following')
                  : t('supporter.match.action.follow')}
              </ProDayText>
            </Pressable>
          ) : null}
          {onDebate ? (
            <Pressable onPress={onDebate} hitSlop={8}>
              <ProDayText variant="caption" style={styles.actionText}>
                {t('supporter.match.action.debate')}
              </ProDayText>
            </Pressable>
          ) : null}
          {onMoment ? (
            <Pressable onPress={onMoment} hitSlop={8}>
              <ProDayText variant="caption" style={styles.actionText}>
                {t('supporter.match.action.moment')}
              </ProDayText>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SUPPORTER_SITE.border,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  cardCompact: {
    paddingVertical: spacing.sm,
  },
  cardHero: {
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lockup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  timeCol: {
    width: 64,
    gap: 6,
    paddingTop: 2,
  },
  clock: {
    color: SUPPORTER_SITE.foreground,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
    fontSize: 18,
    letterSpacing: 0.4,
  },
  clockHero: {
    fontSize: 22,
    fontWeight: '700',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
  },
  livePillText: {
    color: SUPPORTER_SITE.live,
    fontWeight: '700',
    letterSpacing: 1.4,
    fontSize: 10,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  sourceBadge: {
    color: SUPPORTER_SITE.muted,
    letterSpacing: 1.2,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  teams: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  competition: {
    color: SUPPORTER_SITE.accent,
    letterSpacing: 1.6,
    fontSize: 9,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  teamName: {
    color: SUPPORTER_SITE.foreground,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  teamNameHero: {
    fontSize: 20,
    fontWeight: '700',
  },
  teamAway: {
    color: 'rgba(244, 241, 234, 0.78)',
  },
  score: {
    marginTop: 4,
    color: SUPPORTER_SITE.foreground,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    letterSpacing: 1,
    fontSize: 18,
  },
  venue: {
    marginTop: 4,
    color: SUPPORTER_SITE.muted,
    fontSize: 11,
  },
  broadcast: {
    marginTop: 4,
    color: SUPPORTER_SITE.bright,
    letterSpacing: 1.2,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingLeft: 64 + spacing.md,
  },
  actionText: {
    color: SUPPORTER_SITE.muted,
    letterSpacing: 0.8,
    fontSize: 11,
    textTransform: 'uppercase',
  },
});
