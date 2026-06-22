import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Linking, ActivityIndicator, Alert } from 'react-native';
import type { PlayerActivity } from '../../models/PlayerActivity';
import { GlassCard } from '../aurora/GlassCard';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { LogActivityScreen } from '../../screens/LogActivityScreen';
import { playerActivityService } from '../../services/playerActivity.service';
import { spacing, radius } from '../../theme/designTokens';

interface PlayerActivityFeedProps {
  uid: string;
  activities: PlayerActivity[];
  highlightVideoUrls?: string[];
  loading?: boolean;
  onActivityLogged?: () => void;
}

/** Fil d'activités récentes — journal de performance (base analyse vidéo future). */
export const PlayerActivityFeed: React.FC<PlayerActivityFeedProps> = ({
  uid,
  activities,
  highlightVideoUrls = [],
  loading = false,
  onActivityLogged,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const [logOpen, setLogOpen] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

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
          activities.slice(0, 8).map((act) => (
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
                </ProDayText>
                {act.type === 'match' && (act.goals != null || act.assists != null) ? (
                  <ProDayText variant="caption" muted>
                    {act.goals ?? 0} but{(act.goals ?? 0) > 1 ? 's' : ''} · {act.assists ?? 0} passe
                    {(act.assists ?? 0) > 1 ? 's' : ''}
                  </ProDayText>
                ) : null}
                {act.notes ? (
                  <ProDayText variant="caption" muted numberOfLines={2}>
                    {act.notes}
                  </ProDayText>
                ) : null}
                {act.video_url ? (
                  <View style={styles.videoBadges}>
                    <View style={[styles.videoBadge, { backgroundColor: colors.accentSoft }]}>
                      <ProDayText variant="caption" accent style={styles.badgeText}>
                        {t('activity.feed.videoRecorded')}
                      </ProDayText>
                    </View>
                    {act.analysis_status === 'pending_analysis' ? (
                      <Pressable
                        onPress={() => void handleAnalyze(act.id)}
                        disabled={analyzingId === act.id}
                        style={[styles.videoBadge, { backgroundColor: colors.surfaceMuted }]}
                      >
                        {analyzingId === act.id ? (
                          <ActivityIndicator size="small" color={colors.accent} />
                        ) : (
                          <ProDayText variant="caption" accent style={styles.badgeText}>
                            {t('activity.feed.analyze')}
                          </ProDayText>
                        )}
                      </Pressable>
                    ) : null}
                    {act.analysis_status === 'failed' ? (
                      <Pressable
                        onPress={() => void handleAnalyze(act.id)}
                        disabled={analyzingId === act.id}
                      >
                        <ProDayText variant="caption" muted style={styles.analysisFailed}>
                          {act.analysis_summary_fr ?? t('activity.feed.analysisFailed')}
                        </ProDayText>
                      </Pressable>
                    ) : null}
                    <Pressable onPress={() => void Linking.openURL(act.video_url!)}>
                      <ProDayText variant="caption" accent style={styles.videoLink}>
                        {t('activity.feed.videoLink')}
                      </ProDayText>
                    </Pressable>
                  </View>
                ) : null}
                {act.analysis_status === 'analyzed' && act.analysis_summary_fr ? (
                  <View style={styles.analysisBlock}>
                    <ProDayText variant="caption" style={styles.analysisSummary}>
                      {act.analysis_summary_fr}
                    </ProDayText>
                    {act.analysis_strengths?.length ? (
                      <ProDayText variant="caption" muted numberOfLines={2}>
                        + {act.analysis_strengths.slice(0, 2).join(' · ')}
                      </ProDayText>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>
          ))
        )}
      </GlassCard>

      <LogActivityScreen
        visible={logOpen}
        uid={uid}
        highlightVideoUrls={highlightVideoUrls}
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
  card: { padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  addText: { fontWeight: '800' },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  emptyText: { textAlign: 'center' },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  typeText: { fontWeight: '700', fontSize: 10 },
  rowCopy: { flex: 1, gap: 2 },
  rowTitle: { fontWeight: '700' },
  videoBadges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 2 },
  videoBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  badgeText: { fontWeight: '700', fontSize: 9 },
  videoLink: { fontWeight: '700' },
  analysisBlock: { marginTop: 4, gap: 2 },
  analysisSummary: { fontWeight: '600' },
  analysisFailed: { fontWeight: '600', textDecorationLine: 'underline' },
});
