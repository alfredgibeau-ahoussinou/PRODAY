import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { UserRole } from '../../models/User';
import { rolesForProductLine } from '../../content/universeRoles';
import type { ProductLineId } from '../../models/ProductLine';
import { useAppTheme } from '../../context/ProductLineContext';
import { Icon, type IconName } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';

export const ROLE_OPTIONS: {
  value: UserRole;
  label: string;
  description: string;
  icon: IconName;
}[] = [
  {
    value: 'club',
    label: 'Club / Dirigeant',
    description: 'Équipes, licenciés, matchs, recrutement interne',
    icon: 'business',
  },
  {
    value: 'coach',
    label: 'Coach',
    description: 'Effectif, convocations, tactique et séances',
    icon: 'school',
  },
  {
    value: 'player',
    label: 'Joueur',
    description: 'Profil, stats, matchs et vie d’équipe',
    icon: 'football',
  },
  {
    value: 'parent',
    label: 'Parent',
    description: 'Supervision du compte mineur lié',
    icon: 'people',
  },
  {
    value: 'supporter',
    label: 'Supporter',
    description: 'Matchs, réels et fil communautaire',
    icon: 'star-four-points',
  },
  {
    value: 'sponsor',
    label: 'Sponsor',
    description: 'Visibilité marque & clubs locaux',
    icon: 'star-four-points',
  },
  {
    value: 'agent',
    label: 'Agent (intégré)',
    description: 'Mandats et réseau — intégré au club',
    icon: 'briefcase',
  },
  {
    value: 'recruiter',
    label: 'Recruteur (intégré)',
    description: 'Scouting et suivi — intégré au club',
    icon: 'search',
  },
  {
    value: 'organizer',
    label: 'Organisateur (intégré)',
    description: 'Tournois et stages — depuis l’espace Club',
    icon: 'trophy',
  },
  {
    value: 'physio',
    label: 'Staff médical (intégré)',
    description: 'Suivi sportif privé — permissions strictes',
    icon: 'heart',
  },
];

interface AuthRolePickerProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
  productLine?: ProductLineId;
}

export const AuthRolePicker: React.FC<AuthRolePickerProps> = ({
  value,
  onChange,
  productLine: productLineProp,
}) => {
  const { colors, productLine: themeLine } = useAppTheme();
  const line = productLineProp ?? themeLine;
  const options = useMemo(() => {
    const allowed = new Set(rolesForProductLine(line));
    return ROLE_OPTIONS.filter((r) => allowed.has(r.value)).map((r) => {
      if (line === 'woman' && r.value === 'player') {
        return { ...r, label: 'Joueuse', description: 'CV en ligne, stats, Visibilité' };
      }
      if (line === 'pro' && r.value === 'physio') {
        return {
          ...r,
          label: 'Staff médical (intégré)',
          description: 'Suivi sportif privé — permissions strictes',
        };
      }
      if (line === 'pro' && r.value === 'sponsor') {
        return { ...r, label: 'Sponsor', description: 'Visibilité marque & clubs pro' };
      }
      if (line === 'amateur' && r.value === 'player') {
        return {
          ...r,
          label: 'Joueur',
          description: 'Profil, matchs, stats et vie d’équipe',
        };
      }
      return r;
    });
  }, [line]);

  const ink = colors.ink;

  return (
    <View style={styles.list}>
      {options.map((r) => {
        const active = value === r.value;
        return (
          <TouchableOpacity
            key={r.value}
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
              active && { backgroundColor: colors.accent, borderColor: colors.accent },
            ]}
            onPress={() => onChange(r.value)}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.iconWrap,
                { borderColor: colors.border, backgroundColor: colors.surfaceMuted },
                active && { backgroundColor: colors.surfaceInverse, borderColor: colors.accent },
              ]}
            >
              <Icon
                name={r.icon}
                size={22}
                color={active ? colors.accent : ink}
              />
            </View>
            <View style={styles.body}>
              <Text
                style={[
                  styles.title,
                  { color: colors.text },
                  active && { color: '#000000' },
                ]}
              >
                {r.label}
              </Text>
              <Text
                style={[
                  styles.desc,
                  { color: colors.textMuted },
                  active && { color: 'rgba(0,0,0,0.65)' },
                ]}
              >
                {r.description}
              </Text>
            </View>
            {active ? (
              <Icon name="checkmark-circle" size={22} color="#000000" />
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800' },
  desc: { fontSize: 12, marginTop: 2 },
});
