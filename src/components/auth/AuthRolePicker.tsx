import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { UserRole } from '../../models/User';
import { Icon, type IconName } from '../ui/Icon';
import { colors, spacing, radius } from '../../theme/designTokens';

export const ROLE_OPTIONS: {
  value: UserRole;
  label: string;
  description: string;
  icon: IconName;
}[] = [
  {
    value: 'player',
    label: 'Joueur',
    description: 'Profil, stats, candidatures clubs',
    icon: 'football',
  },
  {
    value: 'coach',
    label: 'Coach',
    description: 'Diplôme vérifié · messagerie',
    icon: 'school',
  },
  {
    value: 'club',
    label: 'Club',
    description: 'Stages · annonces · gestion équipe',
    icon: 'business',
  },
  {
    value: 'agent',
    label: 'Agent',
    description: 'Licence pro · recrutement',
    icon: 'briefcase',
  },
  {
    value: 'organizer',
    label: 'Organisateur',
    description: 'Tournois · vérif. document + IA',
    icon: 'trophy',
  },
  {
    value: 'physio',
    label: 'Kinésithérapeute',
    description: 'Suivi blessures · fil ProDay',
    icon: 'heart',
  },
  {
    value: 'sponsor',
    label: 'Sponsor',
    description: 'Partenariats & visibilité',
    icon: 'star-four-points',
  },
];

interface AuthRolePickerProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
}

export const AuthRolePicker: React.FC<AuthRolePickerProps> = ({ value, onChange }) => (
  <View style={styles.list}>
    {ROLE_OPTIONS.map((r) => {
      const active = value === r.value;
      return (
        <TouchableOpacity
          key={r.value}
          style={[styles.card, active && styles.cardActive]}
          onPress={() => onChange(r.value)}
          activeOpacity={0.85}
        >
          <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
            <Icon name={r.icon} size={22} color={active ? colors.brandInverse : colors.text} />
          </View>
          <View style={styles.body}>
            <Text style={[styles.title, active && styles.titleActive]}>{r.label}</Text>
            <Text style={styles.desc}>{r.description}</Text>
          </View>
          {active ? (
            <Icon name="checkmark-circle" size={22} color={colors.brand} />
          ) : null}
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActive: {
    borderColor: colors.border,
    backgroundColor: colors.brand,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: colors.surfaceInverse, borderColor: colors.border },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: colors.text },
  titleActive: { color: colors.brandInverse },
  desc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
