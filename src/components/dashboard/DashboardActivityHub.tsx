import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
  onArena?: () => void;
  onSponsors?: () => void;
}

const QUICK_MODULES: {
  key: string;
  title: string;
  subtitle: string;
  icon: IconName;
  action: 'arena' | 'sponsors';
}[] = [
  { key: 'arena', title: 'Arena', subtitle: 'Tournois', icon: 'trophy', action: 'arena' },
  {
    key: 'sponsors',
    title: 'Sponsors',
    subtitle: 'Partenaires',
    icon: 'star-four-points',
    action: 'sponsors',
  },
];

export const DashboardActivityHub: React.FC<DashboardActivityHubProps> = ({
  profile,
  unreadCount,
  onMessages,
  onProfile,
  onArena,
  onSponsors,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>ACTIVITÉ</Text>
      <Text style={styles.title}>Votre espace</Text>

      <View style={styles.card}>
        <Row
          icon="chat"
          title="Messagerie"
          meta={
            unreadCount > 0
              ? `${unreadCount} non lu${unreadCount > 1 ? 's' : ''}`
              : 'Aucun nouveau message'
          }
          highlight={unreadCount > 0}
          onPress={onMessages}
          styles={styles}
          c={c}
        />
        <Divider styles={styles} />
        <Row
          icon="person"
          title="Mon profil"
          meta="Infos, club, CV vivant"
          onPress={onProfile}
          styles={styles}
          c={c}
        />
        {profile.role === 'player' && profile.profile.season_stats ? (
          <>
            <Divider styles={styles} />
            <Row
              icon="football"
              title="Ma saison"
              meta={`${profile.profile.season_stats.matches} matchs · ${profile.profile.season_stats.goals} buts · ${profile.profile.season_stats.assists} passes`}
              onPress={onProfile}
              styles={styles}
              c={c}
            />
          </>
        ) : null}
        <Divider styles={styles} />
        <View style={styles.badgeRow}>
          <VerificationBadge user={profile} />
        </View>
      </View>

      <View style={styles.quickGrid}>
        {QUICK_MODULES.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={styles.quickCard}
            onPress={() => {
              if (m.action === 'arena') onArena?.();
              else onSponsors?.();
            }}
          >
            <Icon name={m.icon} size={22} color={c.brand} />
            <Text style={styles.quickTitle}>{m.title}</Text>
            <Text style={styles.quickSub}>{m.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
  <TouchableOpacity style={styles.row} onPress={onPress}>
    <View style={[styles.rowIcon, highlight && styles.rowIconHi]}>
      <Icon
        name={icon}
        size={20}
        color={highlight ? c.brandInverse : c.textMuted}
      />
    </View>
    <View style={styles.rowBody}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={[styles.rowMeta, highlight && styles.rowMetaHi]}>{meta}</Text>
    </View>
    <Icon name="chevron-forward" size={18} color={c.textMuted} />
  </TouchableOpacity>
);

const Divider: React.FC<{ styles: ReturnType<typeof createStyles> }> = ({ styles }) => (
  <View style={styles.divider} />
);

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: { marginBottom: spacing.xl },
    eyebrow: { fontSize: 10, fontWeight: '800', color: c.brand, letterSpacing: 1 },
    title: { fontSize: 18, fontWeight: '900', color: c.text, marginBottom: spacing.md },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.md,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
    rowIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowIconHi: { backgroundColor: c.ink, borderWidth: 1, borderColor: c.brand },
    rowBody: { flex: 1 },
    rowTitle: { fontWeight: '800', fontSize: 15, color: c.text },
    rowMeta: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    rowMetaHi: { color: c.text, fontWeight: '800' },
    divider: { height: 2, backgroundColor: c.border, marginVertical: spacing.xs },
    badgeRow: { paddingTop: spacing.sm },
    quickGrid: { flexDirection: 'row', gap: spacing.sm },
    quickCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'flex-start',
      gap: 4,
    },
    quickTitle: { fontSize: 14, fontWeight: '800', color: c.text },
    quickSub: { fontSize: 11, color: c.textMuted },
  });
}
