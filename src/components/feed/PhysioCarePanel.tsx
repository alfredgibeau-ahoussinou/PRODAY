import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import { PressableSpring, SkeletonList, StaggerReveal } from '../motion';
import { ProDaySelect } from '../ui/ProDaySelect';
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
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';

const INJURY_TIPS = [
  { id: 'knee', label: 'Genou', hint: 'Kiné & prévention' },
  { id: 'ankle', label: 'Cheville', hint: 'Ostéo / kiné' },
  { id: 'muscle', label: 'Musculaire', hint: 'Récupération' },
] as const;

interface PhysioCarePanelProps {
  profile: User;
  onOpenChat: (threadId: string) => void;
  onOpenMessages: () => void;
  onBookPhysio?: (physio: User) => void;
  /** Plein écran onglet Santé — liste complète */
  expanded?: boolean;
  /** Masque le titre dupliqué quand l’onglet Santé fournit déjà le hero. */
  hideHeader?: boolean;
}

export const PhysioCarePanel: React.FC<PhysioCarePanelProps> = ({
  profile,
  onOpenChat,
  onOpenMessages,
  onBookPhysio,
  expanded = false,
  hideHeader = false,
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
    <View style={[styles.wrap, expanded && styles.wrapExpanded, { borderColor: c.borderStrong }]}>
      {!hideHeader ? (
        <>
          <ProDayText variant="eyebrow" accent>
            Suivi santé
          </ProDayText>
          <ProDayText variant="section">
            {isPlayer
              ? 'Pôle médical'
              : isWoman
                ? 'Joueuses — suivi blessure'
                : 'Joueurs — suivi blessure'}
          </ProDayText>
          <ProDayText variant="body" muted style={styles.sub}>
            {isPlayer
              ? 'Réservez un créneau ou contactez kinés, coach mental, nutrition…'
              : isWoman
                ? 'Les joueuses réservent en ligne ou vous contactent pour prévention et récupération.'
                : 'Les joueurs réservent en ligne ou vous contactent pour prévention et récupération.'}
          </ProDayText>
        </>
      ) : null}

      {isPlayer ? (
        <>
          <TextInput
            style={styles.search}
            placeholder="Ville, nom…"
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {expanded ? (
            <ProDaySelect<HealthPoleFilterId>
              label="Spécialité"
              placeholder="Tous les pros"
              options={HEALTH_POLE_FILTERS.map((f) => ({ id: f.id, label: f.label }))}
              value={specialtyFilter}
              onChange={setSpecialtyFilter}
              inset={false}
            />
          ) : null}

          {expanded ? (
            <ProDaySelect<string>
              label="Type de douleur"
              placeholder="Parcours blessure"
              options={INJURY_TIPS.map((t) => ({
                id: t.id,
                label: t.label,
                hint: t.hint,
              }))}
              onChange={(id) => {
                const tip = INJURY_TIPS.find((t) => t.id === id);
                if (tip?.id === 'knee') setSpecialtyFilter('kine');
                if (tip?.id === 'muscle') setSpecialtyFilter('kine');
                if (tip?.id === 'ankle') setSpecialtyFilter('kine');
              }}
              resetOnSelect
            />
          ) : null}
          {loading ? (
            <SkeletonList count={3} variant="row" />
          ) : list.length === 0 ? (
            <Text style={styles.empty}>Aucun professionnel du pôle médical inscrit pour le moment.</Text>
          ) : (
            list.map((p, index) => (
              <StaggerReveal key={p.uid} index={index}>
                <PressableSpring
                  style={styles.row}
                  onPress={() =>
                    void openContactConversation(profile, p, p.display_name, onOpenChat)
                  }
                  scaleTo={0.98}
                  haptic
                >
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
                      <PressableSpring
                        style={styles.bookBtn}
                        onPress={() => onBookPhysio(p)}
                        scaleTo={0.96}
                        haptic
                      >
                        <Text style={styles.bookBtnText}>RDV</Text>
                      </PressableSpring>
                    ) : (
                      <Icon name="chevron-forward" size={18} color={c.textMuted} />
                    )}
                  </View>
                </PressableSpring>
              </StaggerReveal>
            ))
          )}
        </>
      ) : (
        <PressableSpring onPress={onOpenMessages} scaleTo={0.97} haptic style={styles.inboxWrap}>
          <ProDayGradient kind="cta" style={styles.inboxBtn}>
            <ProDayText variant="caption" inverse style={styles.inboxBtnText}>
              Voir mon agenda & messagerie
            </ProDayText>
          </ProDayGradient>
        </PressableSpring>
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
      borderWidth: 1.5,
    },
    wrapExpanded: {
      backgroundColor: c.surfaceMuted,
    },
    sub: { marginTop: 4, marginBottom: spacing.md },
    search: {
      borderWidth: 1.5,
      borderColor: c.borderStrong,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginBottom: spacing.sm,
      color: c.text,
      backgroundColor: c.background,
    },
    filters: { marginBottom: spacing.sm },
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
    bookBtnWrap: {
      borderRadius: radius.md,
      overflow: 'hidden',
    },
    bookBtn: {
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 8,
      borderRadius: radius.md,
    },
    bookBtnText: { fontWeight: '900' },
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
    inboxWrap: {
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    inboxBtn: {
      paddingVertical: spacing.md,
      alignItems: 'center',
      borderRadius: radius.lg,
    },
    inboxBtnText: { fontWeight: '900', fontSize: 14 },
  });
}
