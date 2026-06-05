import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import type { User } from '../../models/User';
import { usersService } from '../../services/users.service';
import { openContactConversation } from '../../utils/openContactConversation';
import {
  HEALTH_POLE_FILTERS,
  isMentalCoachSpecialty,
  matchesHealthPoleFilter,
  type HealthPoleFilterId,
} from '../../utils/healthPoleSpecialties';
import { colors, spacing, radius } from '../../theme/designTokens';
import { Icon, type IconName } from '../ui/Icon';

interface PhysioCarePanelProps {
  profile: User;
  onOpenChat: (threadId: string) => void;
  onOpenMessages: () => void;
  /** Plein écran onglet Santé — liste complète */
  expanded?: boolean;
}

export const PhysioCarePanel: React.FC<PhysioCarePanelProps> = ({
  profile,
  onOpenChat,
  onOpenMessages,
  expanded = false,
}) => {
  const [physios, setPhysios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState<HealthPoleFilterId>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPhysios(await usersService.listPhysios(search));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 300);
    return () => clearTimeout(t);
  }, [load]);

  const isPlayer = profile.role === 'player';
  const isPhysio = profile.role === 'physio';

  const filteredPhysios = useMemo(
    () =>
      physios.filter((p) =>
        matchesHealthPoleFilter(p.profile?.medical_specialty, specialtyFilter)
      ),
    [physios, specialtyFilter]
  );

  if (!isPlayer && !isPhysio) return null;

  function specialtyIcon(specialty: string | undefined): IconName {
    return isMentalCoachSpecialty(specialty) ? 'shield' : 'heart';
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>SUIVI SANTÉ</Text>
      <Text style={styles.title}>
        {isPlayer ? 'Pôle médical' : 'Joueurs — suivi blessure'}
      </Text>
      <Text style={styles.sub}>
        {isPlayer
          ? 'Kiné, coach mental, nutrition… Messagerie dédiée joueur ↔ pôle santé ProDay.'
          : 'Les joueurs vous contactent pour prévention, récupération ou accompagnement mental.'}
      </Text>

      {isPlayer ? (
        <>
          <TextInput
            style={styles.search}
            placeholder="Ville, nom…"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {loading ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : physios.length === 0 ? (
            <Text style={styles.empty}>Aucun professionnel du pôle médical inscrit pour le moment.</Text>
          ) : (
            (expanded ? physios : physios.slice(0, 5)).map((p) => (
              <TouchableOpacity
                key={p.uid}
                style={styles.row}
                onPress={() =>
                  void openContactConversation(profile, p, p.display_name, onOpenChat)
                }
              >
                <View style={styles.avatar}>
                  <Icon name="heart" size={18} color={colors.accent} />
                </View>
                <View style={styles.copy}>
                  <Text style={styles.name}>{p.display_name}</Text>
                  <Text style={styles.meta}>
                    {p.profile?.medical_specialty ?? p.profile?.job_title ?? p.city ?? 'Pôle médical ProDay'}
                  </Text>
                </View>
                <Icon name="chat" size={20} color={colors.accent} />
              </TouchableOpacity>
            ))
          )}
        </>
      ) : (
        <TouchableOpacity
          style={styles.inboxBtn}
          onPress={onOpenMessages}
        >
          <Text style={styles.inboxBtnText}>Voir ma messagerie</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: '900', color: colors.text },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    color: colors.text,
    backgroundColor: colors.background,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    paddingRight: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: colors.accent,
  },
  loader: { marginVertical: spacing.md },
  empty: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  name: { fontSize: 14, fontWeight: '800', color: colors.text },
  meta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  inboxBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  inboxBtnText: { color: colors.brandInverse, fontWeight: '900', fontSize: 14 },
});
