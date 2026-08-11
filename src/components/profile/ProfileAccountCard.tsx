import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { Icon, type IconName } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';
import { spacing, radius } from '../../theme/designTokens';

type ProfileAccountCardProps = {
  profile: User;
  subscriptionTier: 'free' | 'pro';
  roleLabel: string;
  onEdit?: () => void;
};

type RowProps = {
  icon: IconName;
  label: string;
  value: string;
  colors: AppColors;
  last?: boolean;
};

const AccountRow: React.FC<RowProps> = ({ icon, label, value, colors, last }) => (
  <View
    style={[
      rowStyles.row,
      !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    ]}
  >
    <View style={[rowStyles.icon, { backgroundColor: colors.accentSoft }]}>
      <Icon name={icon} size={14} color={colors.accent} />
    </View>
    <View style={rowStyles.copy}>
      <ProDayText variant="caption" muted>
        {label}
      </ProDayText>
      <ProDayText variant="body" numberOfLines={2}>
        {value}
      </ProDayText>
    </View>
  </View>
);

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 1 },
});

/** Fiche compte — informations essentielles lisibles d’un coup d’œil. */
export const ProfileAccountCard: React.FC<ProfileAccountCardProps> = ({
  profile,
  subscriptionTier,
  roleLabel,
  onEdit,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const p = profile.profile;

  const rows: { icon: IconName; label: string; value: string }[] = [
    { icon: 'mail', label: 'E-mail', value: profile.email },
    { icon: 'person', label: 'Rôle', value: roleLabel },
  ];

  if (profile.city) {
    rows.push({ icon: 'location', label: 'Ville', value: profile.city });
  }
  if (p.position) {
    rows.push({ icon: 'football', label: 'Poste', value: p.position });
  }
  if (p.jersey_number != null && Number.isFinite(p.jersey_number)) {
    rows.push({ icon: 'shirt', label: 'Numéro', value: String(p.jersey_number) });
  }
  if (p.strong_foot) {
    rows.push({
      icon: 'walk',
      label: 'Pied fort',
      value:
        p.strong_foot === 'left' ? 'Gauche' : p.strong_foot === 'right' ? 'Droit' : 'Les deux',
    });
  }
  if (p.level) {
    rows.push({ icon: 'star-four-points', label: 'Niveau', value: p.level });
  }
  rows.push({
    icon: 'business',
    label: 'Club',
    value: p.club_id ? 'Club lié' : 'Aucun club',
  });
  rows.push({
    icon: 'bag',
    label: 'Abonnement',
    value: subscriptionTier === 'pro' ? 'ProDay Pro' : 'Gratuit',
  });

  return (
    <ProDaySurface variant="flat" style={styles.card}>
      <View style={styles.head}>
        <ProDayText variant="section">Mon compte</ProDayText>
        {onEdit ? (
          <PressableSpring onPress={onEdit} scaleTo={0.96} haptic>
            <ProDayText variant="caption" accent style={styles.editLink}>
              Modifier
            </ProDayText>
          </PressableSpring>
        ) : null}
      </View>
      {rows.map((row, index) => (
        <AccountRow
          key={row.label}
          {...row}
          colors={colors}
          last={index === rows.length - 1}
        />
      ))}
    </ProDaySurface>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: spacing.xs,
      marginBottom: spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    editLink: { fontWeight: '800' },
  });
}
