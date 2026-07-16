import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import { PressableSpring, SkeletonList, StaggerReveal } from '../motion';
import type { User } from '../../models/User';
import { usersService } from '../../services/users.service';
import { openContactConversation } from '../../utils/openContactConversation';
import {
  matchesHealthPoleGroup,
  type HealthPoleGroupId,
} from '../../utils/healthPoleSpecialties';
import { isPhysioBookingEnabled } from '../../services/medicalAppointments.service';
import { hasPhysioCalComBooking } from '../../utils/calComBooking';
import { spacing, radius } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import { useFemalePlayerPresentation } from '../../hooks/useFemalePlayerPresentation';
import type { AppColors } from '../../theme/universeTheme';
import { Icon, type IconName } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';


interface PhysioCarePanelProps {
  profile: User;
  onOpenChat: (threadId: string) => void;
  onOpenMessages: () => void;
  onBookPhysio?: (physio: User) => void;
  /** Filtre par pôle (onglet Santé). */
  poleGroup?: HealthPoleGroupId;
  /** Plein écran onglet Santé — liste complète */
  expanded?: boolean;
  /** Masque le titre dupliqué quand l’onglet Santé fournit déjà le hero. */
  hideHeader?: boolean;
  /** Liste épurée — bordures et libellés réduits. */
  minimal?: boolean;
}

export const PhysioCarePanel: React.FC<PhysioCarePanelProps> = ({
  profile,
  onOpenChat,
  onOpenMessages,
  onBookPhysio,
  poleGroup,
  expanded = false,
  hideHeader = false,
  minimal = false,
}) => {
  const { colors: c, productLine } = useAppTheme();
  const isFemalePresentation = useFemalePlayerPresentation();
  const styles = useMemo(() => createStyles(c), [c]);
  
  const [physios, setPhysios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
        poleGroup
          ? matchesHealthPoleGroup(p.profile?.medical_specialty, poleGroup)
          : true
      ),
    [physios, poleGroup]
  );

  const list = expanded ? filteredPhysios : filteredPhysios.slice(0, 5);

  if (!isPlayer && !isPhysio) return null;

  function specialtyIcon(specialty: string | undefined): IconName {
    const lower = (specialty ?? '').toLowerCase();
    if (lower.includes('médecin')) return 'shield';
    if (lower.includes('préparateur physique')) return 'football';
    if (lower.includes('mental')) return 'shield';
    if (lower.includes('nutrition')) return 'heart';
    if (lower.includes('podologue')) return 'walk';
    if (lower.includes('ostéopathe')) return 'person';
    return 'walk';
  }

  return (
    <View
      style={[
        styles.wrap,
        expanded && styles.wrapExpanded,
        minimal && styles.wrapMinimal,
        { borderColor: minimal ? c.border : c.borderStrong },
      ]}
    >
      {!hideHeader ? (
        <>
          <ProDayText variant="eyebrow" accent>
            Suivi santé
          </ProDayText>
          <ProDayText variant="section">
            {isPlayer
              ? 'Pôle médical'
              : isFemalePresentation
                ? 'Joueuses — suivi blessure'
                : 'Joueurs — suivi blessure'}
          </ProDayText>
          <ProDayText variant="body" muted style={styles.sub}>
            {isPlayer
              ? 'Besoin d’un RDV santé ? Réservez un créneau sur le calendrier du praticien (sans compte Cal.com).'
              : isFemalePresentation
                ? 'Les joueuses réservent sur votre Cal.com (sans compte Cal.com) ou vous contactent.'
                : 'Les joueurs réservent sur votre Cal.com (sans compte Cal.com) ou vous contactent.'}
          </ProDayText>
        </>
      ) : null}

      {isPlayer ? (
        <>
          {!minimal ? (
            <ProDayText variant="eyebrow" accent style={styles.listLabel}>
              Praticiens disponibles
            </ProDayText>
          ) : null}
          <TextInput
            style={[styles.search, minimal && styles.searchMinimal]}
            placeholder="Rechercher…"
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={setSearch}
          />

          {loading ? (
            <SkeletonList count={3} variant="row" />
          ) : list.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Icon name="person" size={28} color={c.textMuted} />
              <Text style={styles.emptyTitle}>Aucun praticien</Text>
              <Text style={styles.empty}>
                Aucun praticien de cette spécialité inscrit pour le moment.
              </Text>
            </View>
          ) : (
            <View style={[styles.listCard, minimal && styles.listCardMinimal, { borderColor: c.border }]}>
              {list.map((p, index) => (
                <StaggerReveal key={p.uid} index={index}>
                  <PressableSpring
                    style={[
                      styles.row,
                      minimal && styles.rowMinimal,
                      index > 0 && styles.rowBorder,
                      index > 0 && { borderTopColor: c.border },
                    ]}
                    onPress={() =>
                      void openContactConversation(profile, p, p.display_name, onOpenChat)
                    }
                    scaleTo={0.98}
                    haptic
                  >
                    <View style={[styles.avatar, minimal && styles.avatarMinimal]}>
                      <Icon
                        name={specialtyIcon(p.profile?.medical_specialty)}
                        size={minimal ? 22 : 18}
                        color={c.accent}
                      />
                    </View>
                    <View style={styles.copy}>
                      <Text style={[styles.name, minimal && styles.nameMinimal]}>{p.display_name}</Text>
                      <Text style={styles.meta}>
                        {p.profile?.medical_specialty ?? p.profile?.job_title ?? p.city ?? 'Pôle médical ProDay'}
                      </Text>
                    </View>
                    <View style={styles.actions}>
                      {onBookPhysio &&
                      (hasPhysioCalComBooking(p) || isPhysioBookingEnabled(p)) ? (
                        <PressableSpring
                          style={[styles.bookBtn, minimal && styles.bookBtnMinimal, { backgroundColor: c.accent }]}
                          onPress={() => onBookPhysio(p)}
                          scaleTo={0.96}
                          haptic
                        >
                          <Icon name="calendar" size={14} color={c.brandInverse} />
                          <Text style={[styles.bookBtnText, { color: c.brandInverse }]}>RDV</Text>
                        </PressableSpring>
                      ) : (
                        <Icon name="chevron-forward" size={18} color={c.textMuted} />
                      )}
                    </View>
                  </PressableSpring>
                </StaggerReveal>
              ))}
            </View>
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
    wrapMinimal: {
      borderWidth: 0,
      backgroundColor: 'transparent',
      padding: 0,
      marginBottom: 0,
    },
    sub: { marginTop: 4, marginBottom: spacing.md },
    listLabel: { marginBottom: spacing.xs, fontWeight: '800' },
    search: {
      borderWidth: 1.5,
      borderColor: c.borderStrong,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginBottom: spacing.sm,
      color: c.text,
      backgroundColor: c.background,
    },
    searchMinimal: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      marginBottom: spacing.md,
      fontSize: 15,
    },
    filters: { marginBottom: spacing.sm },
    loader: { marginVertical: spacing.md },
    listCard: {
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    listCardMinimal: {
      backgroundColor: c.surface,
    },
    emptyCard: {
      alignItems: 'center',
      padding: spacing.xl,
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      gap: spacing.sm,
    },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: c.text },
    empty: { fontSize: 13, color: c.textMuted, textAlign: 'center', lineHeight: 19 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    rowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    rowMinimal: {
      minHeight: 76,
      paddingVertical: spacing.md,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarMinimal: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    copy: { flex: 1 },
    name: { fontSize: 14, fontWeight: '800', color: c.text },
    nameMinimal: { fontSize: 16, letterSpacing: -0.2 },
    meta: { fontSize: 12, color: c.textMuted, marginTop: 3, lineHeight: 16 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    bookBtnWrap: {
      borderRadius: radius.md,
      overflow: 'hidden',
    },
    bookBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 8,
      borderRadius: radius.pill,
    },
    bookBtnMinimal: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    bookBtnText: { fontWeight: '800', fontSize: 13 },
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
