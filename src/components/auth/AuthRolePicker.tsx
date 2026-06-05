import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { UserRole } from '../../models/User';
import { rolesForProductLine } from '../../content/universeRoles';
import type { ProductLineId } from '../../models/ProductLine';
import { useAppTheme } from '../../context/ProductLineContext';
import { Icon, type IconName } from '../ui/Icon';
import { colors as defaultColors, spacing, radius } from '../../theme/designTokens';

export const ROLE_OPTIONS: {
  value: UserRole;
  label: string;
  description: string;
  icon: IconName;
}[] = [
  {
    value: 'player',
    label: 'Joueur',
    description: 'CV en ligne, stats, Pulse',
    icon: 'football',
  },
  {
    value: 'coach',
    label: 'Coach',
    description: 'Effectif, convocations, recrutement vérifié',
    icon: 'school',
  },
  {
    value: 'club',
    label: 'Club',
    description: 'Annonces, équipes, candidatures',
    icon: 'business',
  },
  {
    value: 'agent',
    label: 'Agent',
    description: 'Mandats, repérage joueurs, réseau clubs',
    icon: 'briefcase',
  },
  {
    value: 'recruiter',
    label: 'Recruteur',
    description: 'Scouting, annonces Mercato, pipeline candidatures',
    icon: 'search',
  },
  {
    value: 'organizer',
    label: 'Organisateur',
    description: 'Tournois Arena, inscriptions',
    icon: 'trophy',
  },
  {
    value: 'physio',
    label: 'Pôle santé',
    description: 'Kiné, médecin, coach mental, nutrition…',
    icon: 'heart',
  },
  {
    value: 'sponsor',
    label: 'Sponsor',
    description: 'Visibilité marque & clubs locaux',
    icon: 'star-four-points',
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
        return { ...r, label: 'Joueuse', description: 'CV en ligne, stats, Pulse F' };
      }
      if (line === 'pro' && r.value === 'physio') {
        return { ...r, label: 'Pôle santé', description: 'Kiné, médecin, coach mental…' };
      }
      if (line === 'pro' && r.value === 'sponsor') {
        return { ...r, label: 'Partenaire', description: 'Visibilité marque & clubs pro' };
      }
      return r;
    });
  }, [line]);

  const ink = colors.ink ?? defaultColors.ink;

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
              active && { backgroundColor: colors.ink, borderColor: colors.ink },
            ]}
            onPress={() => onChange(r.value)}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.iconWrap,
                { borderColor: colors.border, backgroundColor: colors.surfaceMuted },
                active && { backgroundColor: colors.surfaceInverse, borderColor: colors.ink },
              ]}
            >
              <Icon
                name={r.icon}
                size={22}
                color={active ? colors.brandInverse : ink}
              />
            </View>
            <View style={styles.body}>
              <Text
                style={[
                  styles.title,
                  { color: colors.text },
                  active && { color: colors.brandInverse },
                ]}
              >
                {r.label}
              </Text>
              <Text style={[styles.desc, active && styles.descActive]}>{r.description}</Text>
            </View>
            {active ? (
              <Icon name="checkmark-circle" size={22} color={colors.brandInverse} />
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
  desc: { fontSize: 12, color: defaultColors.textMuted, marginTop: 2 },
  descActive: { color: 'rgba(255,255,255,0.78)' },
});
