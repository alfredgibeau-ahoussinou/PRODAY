import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Tournament } from '../../models/Tournament';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
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
  const styles = useMemo(() => createStyles(c), [c]);
  const spotsLeft = tournament.max_teams - tournament.registrations.length;
  const fee =
    tournament.entry_fee_cents > 0
      ? `${(tournament.entry_fee_cents / 100).toFixed(0)} €`
      : t('tournament.fee.free');

  return (
    <PressableSpring
      style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
      onPress={onPress}
      scaleTo={0.98}
      haptic
    >
      <View style={styles.head}>
        <View style={[styles.iconWrap, { backgroundColor: c.brandSoft }]}>
          <Icon name="trophy" size={18} color={c.brand} />
        </View>
        <View style={styles.meta}>
          <ProDayText variant="body" style={styles.title}>
            {tournament.title}
          </ProDayText>
          <ProDayText variant="caption" muted>
            {tournament.city} ·{' '}
            {tournament.starts_at.toLocaleDateString(locale, {
              day: 'numeric',
              month: 'short',
            })}
          </ProDayText>
        </View>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor:
                tournament.status === 'open' ? c.brandSoft : c.surfaceMuted,
            },
          ]}
        >
          <ProDayText
            variant="caption"
            style={{
              color: tournament.status === 'open' ? c.brand : c.textMuted,
              fontWeight: '800',
            }}
          >
            {t(`tournament.status.${tournament.status}`)}
          </ProDayText>
        </View>
      </View>

      <View style={styles.row}>
        <ProDayText variant="caption" muted>
          {t('tournament.card.teams', {
            n: tournament.registrations.length,
            max: tournament.max_teams,
          })}
        </ProDayText>
        <ProDayText variant="caption" muted>
          {fee}
        </ProDayText>
      </View>

      {tournament.categories.length > 0 ? (
        <View style={styles.tags}>
          {tournament.categories.map((cat) => (
            <View key={cat} style={[styles.tag, { backgroundColor: c.surfaceMuted }]}>
              <ProDayText variant="caption" muted>
                {cat}
              </ProDayText>
            </View>
          ))}
        </View>
      ) : null}

      {registered ? (
        <ProDayText variant="caption" style={{ color: c.brand, fontWeight: '700' }}>
          {t('tournament.card.registered')}
        </ProDayText>
      ) : spotsLeft > 0 && tournament.status === 'open' ? (
        <ProDayText variant="caption" muted>
          {t('tournament.card.spots', { n: spotsLeft })}
        </ProDayText>
      ) : null}
    </PressableSpring>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    meta: { flex: 1, gap: 2 },
    title: { fontWeight: '800', color: c.text, lineHeight: 22 },
    statusPill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    tag: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
  });
}
