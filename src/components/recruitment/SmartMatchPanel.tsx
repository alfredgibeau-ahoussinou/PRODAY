import React, { useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import type { SmartMatchEdge } from '../../core/recruitment/smartMatch.engine';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';

interface SmartMatchPanelProps {
  edges: SmartMatchEdge[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
  emptyLabel?: string;
  onOpenPlayer?: (uid: string) => void;
  onOpenPost?: (postId: string) => void;
  onOpenMercato?: () => void;
}

function edgeTargetUid(edge: SmartMatchEdge): string {
  if (edge.kind === 'recruiter_to_talent') return edge.toUid;
  if (edge.kind === 'player_to_club_post' || edge.kind === 'player_to_agent') {
    return edge.fromUid;
  }
  return edge.toUid;
}

export const SmartMatchPanel: React.FC<SmartMatchPanelProps> = ({
  edges,
  loading = false,
  title,
  subtitle,
  emptyLabel,
  onOpenPlayer,
  onOpenPost,
  onOpenMercato,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const top = useMemo(() => edges.slice(0, 6), [edges]);

  const resolvedTitle = title ?? t('smartMatch.title');
  const resolvedSubtitle = subtitle ?? t('smartMatch.subtitle');
  const resolvedEmpty = emptyLabel ?? t('smartMatch.empty');

  const kindLabel = (kind: SmartMatchEdge['kind']): string => {
    switch (kind) {
      case 'player_to_club_post':
        return t('smartMatch.kind.post');
      case 'player_to_agent':
        return t('smartMatch.kind.agent');
      case 'recruiter_to_talent':
        return t('smartMatch.kind.radar');
      default:
        return t('smartMatch.kind.match');
    }
  };

  return (
    <ProDaySurface variant="module" style={styles.block}>
      <ProDayText variant="eyebrow" accent style={styles.blockLabel}>
        {resolvedTitle}
      </ProDayText>
      <ProDayText variant="caption" muted style={styles.sub}>
        {resolvedSubtitle}
      </ProDayText>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : top.length === 0 ? (
        <View style={styles.emptyWrap}>
          <ProDayText variant="body" muted>
            {resolvedEmpty}
          </ProDayText>
          {onOpenMercato ? (
            <PressableSpring onPress={onOpenMercato} scaleTo={0.97}>
              <ProDayText variant="caption" accent style={{ fontWeight: '800' }}>
                {t('smartMatch.openMercato')}
              </ProDayText>
            </PressableSpring>
          ) : null}
        </View>
      ) : (
        top.map((edge) => {
          const playerUid = edgeTargetUid(edge);
          return (
            <PressableSpring
              key={`${edge.kind}-${edge.fromUid}-${edge.toUid}-${edge.postId ?? ''}`}
              onPress={() => {
                if (edge.postId && onOpenPost) onOpenPost(edge.postId);
                else onOpenPlayer?.(playerUid);
              }}
              scaleTo={0.98}
              style={[
                styles.row,
                { borderColor: colors.border, backgroundColor: colors.surfaceMuted },
              ]}
            >
              <View style={styles.rowMain}>
                <ProDayText variant="section" numberOfLines={1}>
                  {edge.label}
                </ProDayText>
                <ProDayText variant="caption" muted numberOfLines={2}>
                  {kindLabel(edge.kind)}
                  {edge.reasons.length ? ` · ${edge.reasons.slice(0, 2).join(' · ')}` : ''}
                </ProDayText>
              </View>
              <View style={[styles.scoreBadge, { backgroundColor: colors.accentSoft }]}>
                <ProDayText variant="caption" accent style={styles.scoreText}>
                  {edge.score}%
                </ProDayText>
              </View>
            </PressableSpring>
          );
        })
      )}
    </ProDaySurface>
  );
};

const styles = StyleSheet.create({
  block: { padding: spacing.lg, marginBottom: spacing.md },
  blockLabel: { marginBottom: 4 },
  sub: { marginBottom: spacing.md },
  loader: { marginVertical: spacing.lg },
  emptyWrap: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  rowMain: { flex: 1, gap: 2, minWidth: 0 },
  scoreBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    minWidth: 48,
    alignItems: 'center',
  },
  scoreText: { fontWeight: '800' },
});
