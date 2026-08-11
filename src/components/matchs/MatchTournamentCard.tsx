import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Tournament } from '../../models/Tournament';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { MATCH_SITE } from '../../content/matchPageIdentity';
import { spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import { useTranslation } from '../../context/LocaleContext';

interface MatchTournamentCardProps {
  tournament: Tournament;
  colors: AppColors;
  onPress: () => void;
  registered?: boolean;
}

export const MatchTournamentCard: React.FC<MatchTournamentCardProps> = ({
  tournament,
  colors: c,
  onPress,
  registered,
}) => {
  const { t, locale } = useTranslation();
  const spotsLeft = tournament.max_teams - tournament.registrations.length;
  const fee =
    tournament.entry_fee_cents > 0
      ? `${(tournament.entry_fee_cents / 100).toFixed(0)} €`
      : t('tournament.fee.free');
  const isOpen = tournament.status === 'open';
  const barColor = isOpen ? c.accent : MATCH_SITE.muted;

  return (
    <PressableSpring style={styles.card} onPress={onPress} scaleTo={0.98} haptic>
      <View style={[styles.bar, { backgroundColor: barColor }]} />
      <View style={styles.body}>
        <View style={styles.top}>
          <ProDayText
            variant="caption"
            style={[styles.status, { color: isOpen ? c.accent : MATCH_SITE.muted }]}
          >
            {t(`tournament.status.${tournament.status}`)}
          </ProDayText>
          <ProDayText variant="caption" style={styles.muted}>
            {tournament.starts_at.toLocaleDateString(locale, {
              day: 'numeric',
              month: 'short',
            })}
          </ProDayText>
        </View>

        <ProDayText variant="section" style={styles.title} numberOfLines={2}>
          {tournament.title}
        </ProDayText>
        <ProDayText variant="caption" style={styles.muted}>
          {tournament.city} ·{' '}
          {t('tournament.card.teams', {
            n: tournament.registrations.length,
            max: tournament.max_teams,
          })}{' '}
          · {fee}
        </ProDayText>

        {tournament.categories.length > 0 ? (
          <ProDayText variant="caption" style={styles.muted} numberOfLines={1}>
            {tournament.categories.join(' · ')}
          </ProDayText>
        ) : null}

        {registered ? (
          <ProDayText variant="caption" style={[styles.link, { color: c.accent }]}>
            {t('tournament.card.registered')} →
          </ProDayText>
        ) : spotsLeft > 0 && isOpen ? (
          <ProDayText variant="caption" style={[styles.link, { color: c.accent }]}>
            {t('tournament.card.spots', { n: spotsLeft })} →
          </ProDayText>
        ) : (
          <ProDayText variant="caption" style={[styles.link, { color: c.accent }]}>
            Ouvrir →
          </ProDayText>
        )}
      </View>
    </PressableSpring>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: MATCH_SITE.border,
    backgroundColor: MATCH_SITE.surface,
    marginBottom: 2,
    overflow: 'hidden',
  },
  bar: { width: 3 },
  body: {
    flex: 1,
    padding: spacing.md,
    gap: 4,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  status: {
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    fontWeight: '800',
    color: MATCH_SITE.foreground,
    letterSpacing: -0.3,
  },
  muted: { color: MATCH_SITE.muted },
  link: { fontWeight: '800', marginTop: 2 },
});
