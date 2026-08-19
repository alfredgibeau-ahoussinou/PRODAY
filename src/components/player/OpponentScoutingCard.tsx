import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { FriendlyMatch } from '../../models/FriendlyMatch';
import { friendlyMatchesService } from '../../services/friendlyMatches.service';
import { GlassCard } from '../aurora/GlassCard';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';

interface OpponentScoutingCardProps {
  clubId?: string;
}

/** Insights légers prochain adversaire (amical / club). */
export const OpponentScoutingCard: React.FC<OpponentScoutingCardProps> = ({ clubId }) => {
  const { colors } = useAppTheme();
  const playerColors = usePlayerThemeColors();
  const { t } = useTranslation();
  const [match, setMatch] = useState<FriendlyMatch | null>(null);

  useEffect(() => {
    if (!clubId) {
      setMatch(null);
      return;
    }
    void friendlyMatchesService.listUpcoming(40).then((rows) => {
      const next =
        rows.find(
          (m) => m.requester_club_id === clubId || m.opponent_club_id === clubId
        ) ?? null;
      setMatch(next);
    });
  }, [clubId]);

  if (!clubId || !match) return null;

  const isRequester = match.requester_club_id === clubId;
  const opponentLabel = isRequester
    ? match.opponent_club_name || match.opponent_club_id || t('pulse.scouting.unknown')
    : match.requester_club_name || match.requester_club_id || t('pulse.scouting.unknown');

  return (
    <GlassCard variant="default" style={styles.card}>
      <View style={styles.header}>
        <Icon name="eye" size={18} color={playerColors.accent} />
        <ProDayText variant="section">{t('pulse.scouting.title')}</ProDayText>
      </View>
      <ProDayText variant="caption" muted style={styles.sub}>
        {t('pulse.scouting.subtitle')}
      </ProDayText>
      <ProDayText variant="body" style={{ fontWeight: '700' }}>
        {opponentLabel}
      </ProDayText>
      <ProDayText variant="caption" muted>
        {[
          match.date ? new Date(match.date).toLocaleDateString('fr-FR') : null,
          match.city,
          match.category,
          match.level,
          match.status,
        ]
          .filter(Boolean)
          .join(' · ')}
      </ProDayText>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 4 },
  sub: { marginBottom: spacing.sm },
});
