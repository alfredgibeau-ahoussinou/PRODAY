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
import { isPhysioBookingEnabled } from '../../services/medicalAppointments.service';
import { spacing, radius } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';
import { Icon, type IconName } from '../ui/Icon';

interface PhysioCarePanelProps {
  profile: User;
  onOpenChat: (threadId: string) => void;
  onOpenMessages: () => void;
  onBookPhysio?: (physio: User) => void;
  /** Plein écran onglet Santé — liste complète */
  expanded?: boolean;
}

export const PhysioCarePanel: React.FC<PhysioCarePanelProps> = ({
  profile,
  onOpenChat,
  onOpenMessages,
  onBookPhysio,
  expanded = false,
}) => {
  const { colors: c, productLine } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const isWoman = productLine === 'woman';
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

  const list = expanded ? filteredPhysios : filteredPhysios.slice(0, 5);

  if (!isPlayer && !isPhysio) return null;

  function specialtyIcon(specialty: string | undefined): IconName {
    return isMentalCoachSpecialty(specialty) ? 'shield' : 'heart';
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>SUIVI SANTÉ</Text>
      <Text style={styles.title}>
        {isPlayer
          ? 'Pôle médical'
          : isWoman
            ? 'Joueuses — suivi blessure'
            : 'Joueurs — suivi blessure'}
      </Text>
      <Text style={styles.sub}>
        {isPlayer
          ? 'Réservez un créneau ou contactez kinés, coach mental, nutrition…'
          : isWoman
            ? 'Les joueuses réservent en ligne ou vous contactent pour prévention et récupération.'
            : 'Les joueurs réservent en ligne ou vous contactent pour prévention et récupération.'}
      </Text>

      {isPlayer ? (
        <>
          <TextInput
            style={styles.search}
            placeholder="Ville, nom…"
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filters}
            contentContainerStyle={styles.filtersContent}
          >
            {HEALTH_POLE_FILTERS.map((filter) => {
              const active = specialtyFilter === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setSpecialtyFilter(filter.id)}
                >
                  <Text
                    style={[styles.filterChipText, active && styles.filterChipTextActive]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {loading ? (
            <ActivityIndicator color={c.accent} style={styles.loader} />
          ) : list.length === 0 ? (
            <Text style={styles.empty}>Aucun professionnel du pôle médical inscrit pour le moment.</Text>
          ) : (
            list.map((p) => (
              <View key={p.uid} style={styles.row}>
                <View style={styles.avatar}>
                  <Icon name={specialtyIcon(p.profile?.medical_specialty)} size={18} color={c.accent} />
                </View>
                <View style={styles.copy}>
                  <Text style={styles.name}>{p.display_name}</Text>
                  <Text style={styles.meta}>
                    {p.profile?.medical_specialty ?? p.profile?.job_title ?? p.city ?? 'Pôle médical ProDay'}
                  </Text>
                </View>
                <View style={styles.actions}>
                  {onBookPhysio && isPhysioBookingEnabled(p) ? (
                    <TouchableOpacity
                      style={styles.bookBtn}
                      onPress={() => onBookPhysio(p)}
                    >
                      <Text style={styles.bookBtnText}>RDV</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={styles.chatBtn}
                    onPress={() =>
                      void openContactConversation(profile, p, p.display_name, onOpenChat)
                    }
                  >
                    <Icon name="chat" size={18} color={c.accent} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </>
      ) : (
        <TouchableOpacity style={styles.inboxBtn} onPress={onOpenMessages}>
          <Text style={styles.inboxBtnText}>Voir mon agenda & messagerie</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: spacing.lg,
      padding: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    eyebrow: {
      fontSize: 9,
      fontWeight: '900',
      color: c.accent,
      letterSpacing: 1.2,
      marginBottom: 4,
    },
    title: { fontSize: 16, fontWeight: '900', color: c.text },
    sub: { fontSize: 12, color: c.textSecondary, marginTop: 4, marginBottom: spacing.md },
    search: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginBottom: spacing.sm,
      color: c.text,
      backgroundColor: c.background,
    },
    filters: { marginBottom: spacing.sm },
    filtersContent: { gap: spacing.xs, paddingRight: spacing.sm },
    filterChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    filterChipActive: {
      borderColor: c.accent,
      backgroundColor: c.accentSoft,
    },
    filterChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: c.textMuted,
    },
    filterChipTextActive: {
      color: c.accent,
    },
    loader: { marginVertical: spacing.md },
    empty: { fontSize: 13, color: c.textMuted, fontStyle: 'italic' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: { flex: 1 },
    name: { fontSize: 14, fontWeight: '800', color: c.text },
    meta: { fontSize: 11, color: c.textMuted, marginTop: 2 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    bookBtn: {
      backgroundColor: c.accent,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
    },
    bookBtnText: { color: c.brandInverse, fontWeight: '900', fontSize: 12 },
    chatBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.background,
    },
    inboxBtn: {
      backgroundColor: c.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    inboxBtnText: { color: c.brandInverse, fontWeight: '900', fontSize: 14 },
  });
}
