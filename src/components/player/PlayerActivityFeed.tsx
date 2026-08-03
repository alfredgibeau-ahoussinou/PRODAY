import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Linking, Alert } from 'react-native';
import type { PlayerActivity } from '../../models/PlayerActivity';
import { GlassCard } from '../aurora/GlassCard';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { LogActivityScreen } from '../../screens/LogActivityScreen';
import { playerActivityService } from '../../services/playerActivity.service';
import { formatPulseRating } from '../../utils/prodayMatchRating';
import { spacing, radius } from '../../theme/designTokens';

type ReactionKind = 'like' | 'fire' | 'clap' | 'goat';

const REACTIONS: { kind: ReactionKind; emoji: string }[] = [
  { kind: 'like', emoji: '👍' },
  { kind: 'fire', emoji: '🔥' },
  { kind: 'clap', emoji: '👏' },
  { kind: 'goat', emoji: '🐐' },
];

interface PlayerActivityFeedProps {
  uid: string;
  displayName?: string;
  city?: string;
  level?: string;
  category?: string;
  clubId?: string;
  isGoalkeeper?: boolean;
  activities: PlayerActivity[];
  highlightVideoUrls?: string[];
  highlightGalleryUrls?: string[];
  loading?: boolean;
  onActivityLogged?: () => void;
}

export const PlayerActivityFeed: React.FC<PlayerActivityFeedProps> = ({
  uid,
  displayName,
  city,
  level,
  category,
  clubId,
  isGoalkeeper,
  activities,
  highlightVideoUrls = [],
  highlightGalleryUrls = [],
  loading = false,
  onActivityLogged,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const [logOpen, setLogOpen] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [busyReaction, setBusyReaction] = useState<string | null>(null);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  const handleAnalyze = async (activityId: string) => {
    setAnalyzingId(activityId);
    try {
      await playerActivityService.requestAnalysis(activityId);
      onActivityLogged?.();
    } catch (e) {
      Alert.alert(
        t('activity.feed.analyzeError'),
        e instanceof Error ? e.message : t('common.error')
      );
    } finally {
      setAnalyzingId(null);
    }
  };

  const reactionCounts = useCallback((act: PlayerActivity) => {
    const counts: Record<ReactionKind, number> = { like: 0, fire: 0, clap: 0, goat: 0 };
    for (const kind of Object.values(act.reactions ?? {})) {
      if (kind in counts) counts[kind as ReactionKind] += 1;
    }
    return counts;
  }, []);

  const toggleReaction = async (activityId: string, kind: ReactionKind) => {
    if (busyReaction) return;
    setBusyReaction(activityId);
    try {
      await playerActivityService.toggleReaction(activityId, uid, kind);
      onActivityLogged?.();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
    } finally {
      setBusyReaction(null);
    }
  };

  return (
    <>
      <GlassCard variant="default" style={styles.card}>
        <View style={styles.header}>
          <ProDayText variant="section">{t('activity.feed.title')}</ProDayText>
          <PressableSpring
            onPress={() => setLogOpen(true)}
            scaleTo={0.96}
            haptic
            style={[styles.addBtn, { backgroundColor: colors.accentSoft }]}
          >
            <Icon name="add" size={14} color={colors.accent} />
            <ProDayText variant="caption" accent style={styles.addText}>
              {t('activity.feed.add')}
            </ProDayText>
          </PressableSpring>
        </View>

        {loading ? (
          <ProDayText variant="body" muted>
            {t('common.loading')}
          </ProDayText>
        ) : activities.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="football" size={28} color={colors.textMuted} />
            <ProDayText variant="body" muted style={styles.emptyText}>
              {t('activity.feed.empty')}
            </ProDayText>
          </View>
        ) : (
          activities.slice(0, 8).map((act) => {
            const counts = reactionCounts(act);
            const mine = act.reactions?.[uid] as ReactionKind | undefined;
            return (
              <View
                key={act.id}
                style={[styles.row, { borderBottomColor: colors.border }]}
              >
                <View style={[styles.typeBadge, { backgroundColor: colors.surfaceMuted }]}>
                  <ProDayText variant="caption" accent style={styles.typeText}>
                    {t(`activity.type.${act.type}`)}
                  </ProDayText>
                </View>
                <View style={styles.rowCopy}>
                  <ProDayText variant="caption" style={styles.rowTitle}>
                    {formatDate(act.date)} · {act.duration_min} min
                    {act.rating_pulse != null
                      ? ` · ${t('activity.feed.pulseLabel', {
                          score: formatPulseRating(act.rating_pulse),
                        })}`
                      : ''}
                  </ProDayText>
                  {act.type === 'match' &&
                  (act.goals != null || act.assists != null || act.minutes_played != null) ? (
                    <ProDayText variant="caption" muted>
                      {[
                        act.goals != null ? `${act.goals} buts` : null,
                        act.assists != null ? `${act.assists} passes` : null,
                        act.minutes_played != null ? `${act.minutes_played}'` : null,
                        act.match_result ? t(`activity.log.result.${act.match_result}`) : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </ProDayText>
                  ) : null}
                  {act.type === 'training' && act.drills?.length ? (
                    <ProDayText variant="caption" muted>
                      {act.drills.map((d) => t(`activity.log.drill.${d}`)).join(' · ')}
                      {act.intensity != null ? ` · intensité ${act.intensity}/5` : ''}
                    </ProDayText>
                  ) : null}
                  {act.voice_reflection_url ? (
                    <PressableSpring
                      onPress={() => void Linking.openURL(act.voice_reflection_url!)}
                      scaleTo={0.98}
                    >
                      <ProDayText variant="caption" accent>
                        {t('activity.feed.voicePlay')}
                      </ProDayText>
                    </PressableSpring>
                  ) : null}
                  {act.video_url ? (
                    <PressableSpring
                      onPress={() => void Linking.openURL(act.video_url!)}
                      scaleTo={0.98}
                    >
                      <ProDayText variant="caption" accent>
                        {t('activity.feed.videoLink')}
                      </ProDayText>
                    </PressableSpring>
                  ) : null}
                  {act.video_url && act.analysis_status !== 'analyzed' ? (
                    <PressableSpring
                      onPress={() => void handleAnalyze(act.id)}
                      disabled={analyzingId === act.id}
                      scaleTo={0.98}
                    >
                      <ProDayText variant="caption" muted>
                        {analyzingId === act.id
                          ? t('common.loading')
                          : t('activity.feed.analyze')}
                      </ProDayText>
                    </PressableSpring>
                  ) : null}
                  {act.analysis_summary_fr ? (
                    <ProDayText variant="caption" muted>
                      {act.analysis_summary_fr}
                    </ProDayText>
                  ) : null}
                  <View style={styles.reactions}>
                    {REACTIONS.map(({ kind, emoji }) => (
                      <PressableSpring
                        key={kind}
                        onPress={() => void toggleReaction(act.id, kind)}
                        disabled={busyReaction === act.id}
                        scaleTo={0.94}
                        haptic
                        style={[
                          styles.reactionChip,
                          {
                            borderColor: mine === kind ? colors.accent : colors.border,
                            backgroundColor:
                              mine === kind ? colors.accentSoft : colors.surfaceMuted,
                          },
                        ]}
                      >
                        <ProDayText variant="caption">{emoji}</ProDayText>
                        {counts[kind] > 0 ? (
                          <ProDayText variant="caption" style={{ fontWeight: '800' }}>
                            {counts[kind]}
                          </ProDayText>
                        ) : null}
                      </PressableSpring>
                    ))}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </GlassCard>

      <LogActivityScreen
        visible={logOpen}
        uid={uid}
        displayName={displayName}
        city={city}
        level={level}
        category={category}
        clubId={clubId}
        isGoalkeeper={isGoalkeeper}
        highlightVideoUrls={highlightVideoUrls}
        highlightGalleryUrls={highlightGalleryUrls}
        onClose={() => setLogOpen(false)}
        onSaved={() => {
          setLogOpen(false);
          onActivityLogged?.();
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  addText: { fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  emptyText: { textAlign: 'center' },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  typeText: { fontWeight: '700' },
  rowCopy: { flex: 1, gap: 4 },
  rowTitle: { fontWeight: '700' },
  reactions: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
