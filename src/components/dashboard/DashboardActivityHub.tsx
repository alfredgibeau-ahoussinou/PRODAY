import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring, StaggerReveal } from '../motion';
import type { User } from '../../models/User';
import { Icon, type IconName } from '../ui/Icon';
import { VerificationBadge } from '../VerificationBadge';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface DashboardActivityHubProps {
  profile: User;
  unreadCount: number;
  onMessages: () => void;
  onProfile: () => void;
  onSponsors?: () => void;
}

export const DashboardActivityHub: React.FC<DashboardActivityHubProps> = ({
  profile,
  unreadCount,
  onMessages,
  onProfile,
  onSponsors,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>ACTIVITÉ</Text>
      <Text style={styles.title}>Votre espace</Text>

      <View style={styles.card}>
        {[
          {
            key: 'messages',
            icon: 'chat' as IconName,
            title: 'Messagerie',
            meta:
              unreadCount > 0
                ? `${unreadCount} non lu${unreadCount > 1 ? 's' : ''}`
                : 'Aucun nouveau message',
            highlight: unreadCount > 0,
            onPress: onMessages,
          },
          {
            key: 'profile',
            icon: 'person' as IconName,
            title: 'Mon profil',
            meta: 'Infos, club, CV vivant',
            onPress: onProfile,
          },
          ...(profile.role === 'player' && profile.profile.season_stats
            ? [
                {
                  key: 'season',
                  icon: 'football' as IconName,
                  title: 'Ma saison',
                  meta: `${profile.profile.season_stats.matches} matchs · ${profile.profile.season_stats.goals} buts · ${profile.profile.season_stats.assists} passes`,
                  onPress: onProfile,
                },
              ]
            : []),
        ].map((row, index, rows) => (
          <React.Fragment key={row.key}>
            {index > 0 ? <Divider styles={styles} /> : null}
            <StaggerReveal index={index} delayStep={55}>
              <Row
                icon={row.icon}
                title={row.title}
                meta={row.meta}
                highlight={'highlight' in row ? row.highlight : false}
                onPress={row.onPress}
                styles={styles}
                c={c}
              />
            </StaggerReveal>
            {index === rows.length - 1 ? <Divider styles={styles} /> : null}
          </React.Fragment>
        ))}
        <StaggerReveal index={3} delayStep={55}>
          <View style={styles.badgeRow}>
            <VerificationBadge user={profile} />
          </View>
        </StaggerReveal>
      </View>

      {onSponsors ? (
        <View style={styles.quickGrid}>
          <PressableSpring style={styles.quickCard} onPress={onSponsors} scaleTo={0.97} haptic>
            <Icon name="star-four-points" size={22} color={c.brand} />
            <Text style={styles.quickTitle}>Sponsors</Text>
            <Text style={styles.quickSub}>Partenaires</Text>
          </PressableSpring>
        </View>
      ) : null}
    </View>
  );
};

const Row: React.FC<{
  icon: IconName;
  title: string;
  meta: string;
  highlight?: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  c: AppColors;
}> = ({ icon, title, meta, highlight, onPress, styles, c }) => (
  <PressableSpring style={styles.row} onPress={onPress} scaleTo={0.96} haptic>
    <Icon name={icon} size={20} color={highlight ? c.brand : c.textMuted} />
    <View style={styles.rowBody}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={[styles.rowMeta, highlight && { color: c.brand }]}>{meta}</Text>
    </View>
    <Icon name="chevron-forward" size={18} color={c.textMuted} />
  </PressableSpring>
);

const Divider: React.FC<{ styles: ReturnType<typeof createStyles> }> = ({ styles }) => (
  <View style={styles.divider} />
);

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: { marginTop: spacing.lg },
    eyebrow: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      color: c.brand,
      marginBottom: 4,
    },
    title: { fontSize: 20, fontWeight: '900', color: c.text, marginBottom: spacing.md },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
    },
    rowBody: { flex: 1 },
    rowTitle: { fontSize: 14, fontWeight: '800', color: c.text },
    rowMeta: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    divider: { height: 1, backgroundColor: c.border, marginHorizontal: spacing.md },
    badgeRow: { padding: spacing.md },
    quickGrid: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
    quickCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      gap: 4,
    },
    quickTitle: { fontSize: 14, fontWeight: '800', color: c.text },
    quickSub: { fontSize: 11, color: c.textMuted },
  });
}
