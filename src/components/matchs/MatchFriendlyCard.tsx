import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { prodayHaptics } from '../../utils/prodayHaptics';
import type { FriendlyMatch } from '../../models/FriendlyMatch';
import { ProDayGradient } from '../ui/ProDayGradient';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import {
  formatMatchDateTime,
  formatMatchTeams,
  matchStatusStyle,
} from '../../utils/matchDisplay';
import { spacing, radius, shadows } from '../../theme/designTokens';

const LEVEL_TYPE_LABELS: Record<FriendlyMatch['level_type'], string> = {
  loisir: 'Loisir',
  competition: 'Compétition',
  mixte: 'Mixte',
};

interface MatchFriendlyCardProps {
  match: FriendlyMatch;
  isMine: boolean;
  showAccept: boolean;
  iaScore?: number;
  healthWarning?: string;
  onPress?: () => void;
  onAccept?: () => void;
  onCancel?: () => void;
  onMarkPlayed?: () => void;
}

export const MatchFriendlyCard: React.FC<MatchFriendlyCardProps> = ({
  match,
  isMine,
  showAccept,
  iaScore,
  healthWarning,
  onPress,
  onAccept,
  onCancel,
  onMarkPlayed,
}) => {
  const { colors } = useAppTheme();
  const st = matchStatusStyle(match.status, colors);

  return (
    <PressableSpring
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.soft]}
      onPress={onPress ?? (() => prodayHaptics.press())}
      scaleTo={0.96}
      haptic
    >
      <ProDayGradient kind="card" style={styles.accent} />
      <View style={styles.body}>
        <View style={styles.top}>
          <ProDayText variant="caption" muted style={styles.date}>
            {formatMatchDateTime(match.date, match.time_label)}
          </ProDayText>
          <View style={styles.topBadges}>
            {iaScore != null ? (
              <View style={[styles.iaBadge, { backgroundColor: colors.accentSoft }]}>
                <ProDayText variant="caption" accent style={styles.iaText}>
                  {iaScore}%
                </ProDayText>
              </View>
            ) : null}
            <View style={[styles.badge, { backgroundColor: st.bg }]}>
              <ProDayText variant="caption" style={{ color: st.color, fontWeight: '800' }}>
                {st.label}
              </ProDayText>
            </View>
          </View>
        </View>

        <ProDayText variant="section">{formatMatchTeams(match)}</ProDayText>
        <View style={styles.metaRow}>
          <ProDayText variant="body" muted style={styles.metaText}>
            {match.city}
            {match.level ? ` · ${match.level}` : ''}
          </ProDayText>
          <View style={[styles.levelPill, { backgroundColor: colors.accentSoft }]}>
            <ProDayText variant="caption" accent style={styles.levelText}>
              {match.category} · {LEVEL_TYPE_LABELS[match.level_type]}
            </ProDayText>
          </View>
        </View>
        {match.has_pitch ? (
          <ProDayText variant="caption" muted style={styles.pitch}>
            Terrain disponible
          </ProDayText>
        ) : null}
        {healthWarning ? (
          <ProDayText variant="caption" muted style={styles.healthWarn}>
            {healthWarning}
          </ProDayText>
        ) : null}
        {match.message ? (
          <ProDayText variant="body" muted numberOfLines={2} style={styles.message}>
            « {match.message} »
          </ProDayText>
        ) : null}

        {(showAccept || (isMine && match.status === 'OPEN') || (isMine && match.status === 'ACCEPTED')) ? (
          <View style={styles.actions}>
            {showAccept && onAccept ? (
              <PressableSpring
                scaleTo={0.96}
                haptic
                onPress={() => {
                  prodayHaptics.confirm();
                  onAccept();
                }}
              >
                <ProDayGradient kind="cta" style={styles.btnPrimary}>
                  <ProDayText variant="caption" inverse style={styles.btnText}>
                    Accepter
                  </ProDayText>
                </ProDayGradient>
              </PressableSpring>
            ) : null}
            {isMine && match.status === 'OPEN' && onCancel ? (
              <PressableSpring
                style={[
                  styles.btnGhost,
                  { borderColor: colors.borderStrong, backgroundColor: colors.surfaceMuted },
                ]}
                scaleTo={0.97}
                haptic
                onPress={onCancel}
              >
                <ProDayText variant="caption" accent style={styles.btnGhostText}>
                  Annuler
                </ProDayText>
              </PressableSpring>
            ) : null}
            {isMine && match.status === 'ACCEPTED' && onMarkPlayed ? (
              <PressableSpring
                style={[
                  styles.btnGhost,
                  { borderColor: colors.borderStrong, backgroundColor: colors.surfaceMuted },
                ]}
                scaleTo={0.97}
                haptic
                onPress={onMarkPlayed}
              >
                <ProDayText variant="caption" accent style={styles.btnGhostText}>
                  Marquer joué
                </ProDayText>
              </PressableSpring>
            ) : null}
          </View>
        ) : null}
      </View>
    </PressableSpring>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  accent: { height: 3, width: '100%' },
  body: { padding: spacing.md },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  date: { fontWeight: '800', letterSpacing: 0.3, flex: 1 },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  metaText: { flexShrink: 1 },
  levelPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  levelText: { fontWeight: '800', fontSize: 10 },
  pitch: { marginTop: 4, fontWeight: '700' },
  message: { marginTop: spacing.sm, fontStyle: 'italic' },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  topBadges: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  iaBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  iaText: { fontWeight: '800', fontSize: 10 },
  healthWarn: { marginTop: spacing.xs, fontStyle: 'italic' },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  btnPrimary: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  btnText: { fontWeight: '800' },
  btnGhost: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  btnGhostText: { fontWeight: '800' },
});
