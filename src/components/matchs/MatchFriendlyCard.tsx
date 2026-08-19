import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { prodayHaptics } from '../../utils/prodayHaptics';
import type { FriendlyMatch } from '../../models/FriendlyMatch';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import {
  formatMatchDateTime,
  formatMatchTeams,
  matchStatusStyle,
} from '../../utils/matchDisplay';
import { tr } from '../../i18n/translate';
import { useMatchSkinTokens } from './matchCenterUi';
import { spacing } from '../../theme/designTokens';

const LEVEL_TYPE_FALLBACK: Record<FriendlyMatch['level_type'], string> = {
  loisir: 'Loisir',
  competition: 'Competition',
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
  const skin = useMatchSkinTokens();
  const accent = skin.joueurSkin ? skin.accent : colors.accent;
  const styles = useMemo(() => createCardStyles(skin), [skin]);
  const { t } = useTranslation();
  const levelLabels: Record<FriendlyMatch['level_type'], string> = {
    loisir: tr(t, 'match.level.loisir', LEVEL_TYPE_FALLBACK.loisir),
    competition: tr(t, 'match.competition', LEVEL_TYPE_FALLBACK.competition),
    mixte: tr(t, 'match.level.mixte', LEVEL_TYPE_FALLBACK.mixte),
  };
  const st = matchStatusStyle(match.status, colors);

  return (
    <PressableSpring
      style={styles.card}
      onPress={onPress ?? (() => prodayHaptics.press())}
      scaleTo={0.98}
      haptic
    >
      <View style={[styles.bar, { backgroundColor: st.color ?? accent }]} />
      <View style={styles.body}>
        <View style={styles.top}>
          <ProDayText variant="caption" style={styles.date}>
            {formatMatchDateTime(match.date, match.time_label)}
          </ProDayText>
          <View style={styles.topBadges}>
            {iaScore != null ? (
              <ProDayText variant="caption" style={[styles.metaAccent, { color: accent }]}>
                {iaScore}%
              </ProDayText>
            ) : null}
            <ProDayText variant="caption" style={{ color: st.color, fontWeight: '800' }}>
              {st.label}
            </ProDayText>
          </View>
        </View>

        <ProDayText variant="section" style={styles.title}>
          {formatMatchTeams(match)}
        </ProDayText>
        <ProDayText variant="caption" style={styles.muted}>
          {match.city}
          {match.level ? ` · ${match.level}` : ''} · {match.category} ·{' '}
          {levelLabels[match.level_type]}
        </ProDayText>
        {match.has_pitch ? (
          <ProDayText variant="caption" style={styles.muted}>
            Terrain disponible
          </ProDayText>
        ) : null}
        {healthWarning ? (
          <ProDayText variant="caption" style={[styles.muted, styles.warn]}>
            {healthWarning}
          </ProDayText>
        ) : null}
        {match.message ? (
          <ProDayText variant="caption" style={[styles.muted, styles.message]} numberOfLines={2}>
            « {match.message} »
          </ProDayText>
        ) : null}

        {(showAccept ||
          (isMine && match.status === 'OPEN') ||
          (isMine && match.status === 'INVITED') ||
          (isMine && match.status === 'COUNTERED') ||
          (isMine && match.status === 'ACCEPTED')) ? (
          <View style={styles.actions}>
            {showAccept && onAccept ? (
              <PressableSpring
                scaleTo={0.96}
                haptic
                style={[styles.btnPrimary, { backgroundColor: accent }]}
                onPress={() => {
                  prodayHaptics.confirm();
                  onAccept();
                }}
              >
                <ProDayText variant="caption" style={styles.btnPrimaryText}>
                  {t('matchs.friendly.accept')}
                </ProDayText>
              </PressableSpring>
            ) : null}
            {isMine &&
            (match.status === 'OPEN' || match.status === 'INVITED') &&
            onCancel ? (
              <PressableSpring style={styles.btnGhost} scaleTo={0.97} haptic onPress={onCancel}>
                <ProDayText variant="caption" style={[styles.link, { color: accent }]}>
                  {t('matchs.friendly.cancel')}
                </ProDayText>
              </PressableSpring>
            ) : null}
            {isMine && match.status === 'ACCEPTED' && onMarkPlayed ? (
              <PressableSpring
                style={styles.btnGhost}
                scaleTo={0.97}
                haptic
                onPress={onMarkPlayed}
              >
                <ProDayText variant="caption" style={[styles.link, { color: accent }]}>
                  {t('matchs.friendly.markPlayed')}
                </ProDayText>
              </PressableSpring>
            ) : null}
          </View>
        ) : null}
      </View>
    </PressableSpring>
  );
};

const createCardStyles = (skin: ReturnType<typeof useMatchSkinTokens>) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: skin.border,
      backgroundColor: skin.surface,
      borderRadius: skin.cardRadius,
      marginBottom: spacing.xs,
      overflow: 'hidden',
    },
    bar: { width: 3 },
    body: { flex: 1, padding: spacing.md, gap: 4 },
    top: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    date: { fontWeight: '800', letterSpacing: 0.3, flex: 1, color: skin.muted },
    topBadges: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    metaAccent: { fontWeight: '800', fontSize: 10 },
    title: { fontWeight: '800', color: skin.foreground, letterSpacing: -0.3 },
    muted: { color: skin.muted },
    warn: { fontStyle: 'italic' },
    message: { fontStyle: 'italic', marginTop: 2 },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    btnPrimary: {
      borderRadius: skin.cardRadius,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      minHeight: 40,
      justifyContent: 'center',
    },
    btnPrimaryText: { color: '#fff', fontWeight: '800' },
    btnGhost: {
      borderRadius: skin.cardRadius,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      minHeight: 40,
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: skin.border,
    },
    link: { fontWeight: '800' },
  });
