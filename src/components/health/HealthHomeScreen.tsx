import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { User } from '../../models/User';
import {
  HEALTH_CHAPTERS,
  healthChapterToPoleGroup,
  type HealthChapterId,
} from '../../content/healthChapters';
import { usersService } from '../../services/users.service';
import {
  matchesHealthPoleGroup,
  type HealthPoleGroupId,
} from '../../utils/healthPoleSpecialties';
import { isPhysioBookingEnabled } from '../../services/medicalAppointments.service';
import { hasPhysioCalComBooking } from '../../utils/calComBooking';
import { PressableSpring } from '../motion';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { ScreenHeader } from '../ui/ScreenHeader';
import { useAppTheme } from '../../context/ProductLineContext';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing, radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';
import type { AppColors } from '../../theme/universeTheme';

interface HealthHomeScreenProps {
  onBookPhysio: (physio: User) => void;
}

const BOOKING_CHAPTERS = HEALTH_CHAPTERS.filter((ch) => ch.id !== 'conseils');

type Step =
  | { kind: 'care' }
  | { kind: 'practitioners'; chapterId: HealthChapterId };

function practitionerInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

function canBookPractitioner(physio: User): boolean {
  return hasPhysioCalComBooking(physio) || isPhysioBookingEnabled(physio);
}

/** Page RDV santé — parcours premium en 2 étapes. */
export const HealthHomeScreen: React.FC<HealthHomeScreenProps> = ({
  onBookPhysio,
}) => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [step, setStep] = useState<Step>({ kind: 'care' });
  const [physios, setPhysios] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const chapter =
    step.kind === 'practitioners'
      ? BOOKING_CHAPTERS.find((ch) => ch.id === step.chapterId)
      : null;
  const poleGroup =
    step.kind === 'practitioners'
      ? (healthChapterToPoleGroup(step.chapterId) as HealthPoleGroupId | null)
      : null;

  const load = useCallback(async () => {
    if (step.kind !== 'practitioners') return;
    setLoading(true);
    try {
      setPhysios(await usersService.listPhysios(search));
    } finally {
      setLoading(false);
    }
  }, [search, step]);

  useEffect(() => {
    if (step.kind !== 'practitioners') return;
    const t = setTimeout(() => void load(), 280);
    return () => clearTimeout(t);
  }, [load, step]);

  const filtered = useMemo(() => {
    if (!poleGroup) return [];
    return physios.filter((p) =>
      matchesHealthPoleGroup(p.profile?.medical_specialty, poleGroup)
    );
  }, [physios, poleGroup]);

  const handleSelectCare = (chapterId: HealthChapterId) => {
    prodayHaptics.tabSwitch();
    setSearch('');
    setStep({ kind: 'practitioners', chapterId });
  };

  const handleBack = () => {
    prodayHaptics.tabSwitch();
    setSearch('');
    setStep({ kind: 'care' });
  };

  const handleBook = (physio: User) => {
    if (!canBookPractitioner(physio)) return;
    prodayHaptics.tabSwitch();
    onBookPhysio(physio);
  };

  if (step.kind === 'care') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.careHeader, { paddingTop: Math.max(insets.top, spacing.md) }]}>
          <ProDayText variant="hero" style={styles.careTitle}>
            Prendre rendez-vous
          </ProDayText>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.careScroll,
            { paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {BOOKING_CHAPTERS.map((ch) => (
            <PressableSpring
              key={ch.id}
              style={[styles.careCard, { backgroundColor: colors.surface }]}
              onPress={() => handleSelectCare(ch.id)}
              scaleTo={0.98}
              haptic
            >
              <View style={[styles.careIcon, { backgroundColor: colors.accentSoft }]}>
                <Icon name={ch.icon} size={24} color={colors.accent} variant="outline" />
              </View>
              <ProDayText variant="section" style={styles.careLabel}>
                {ch.shortLabel}
              </ProDayText>
              <Icon name="chevron-forward" size={20} color={colors.textMuted} />
            </PressableSpring>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={chapter?.shortLabel ?? 'Praticiens'}
        onBack={handleBack}
      />

      <View style={styles.practitionerBody}>
        <TextInput
          style={[
            styles.search,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          placeholder="Rechercher…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        {loading ? (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        ) : filtered.length === 0 ? (
          <ProDayText variant="body" muted style={styles.empty}>
            Aucun praticien disponible pour le moment.
          </ProDayText>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.listScroll,
              { paddingBottom: TAB_BAR_CONTENT_INSET + spacing.lg },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filtered.map((p) => {
              const bookable = canBookPractitioner(p);
              return (
                <PressableSpring
                  key={p.uid}
                  style={[styles.row, { borderBottomColor: colors.border }]}
                  onPress={() => handleBook(p)}
                  disabled={!bookable}
                  scaleTo={0.98}
                  haptic={bookable}
                >
                  <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
                    <ProDayText variant="caption" accent style={styles.avatarText}>
                      {practitionerInitial(p.display_name)}
                    </ProDayText>
                  </View>
                  <View style={styles.rowCopy}>
                    <ProDayText variant="body" style={styles.rowName}>
                      {p.display_name}
                    </ProDayText>
                    {p.city ? (
                      <ProDayText variant="caption" muted>
                        {p.city}
                      </ProDayText>
                    ) : null}
                  </View>
                  {bookable ? (
                    <Icon name="chevron-forward" size={18} color={colors.textMuted} />
                  ) : null}
                </PressableSpring>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    careHeader: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    careTitle: {
      fontSize: 32,
      letterSpacing: -0.6,
      color: c.text,
    },
    careScroll: {
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    careCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.xl,
      minHeight: 76,
    },
    careIcon: {
      width: 48,
      height: 48,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    careLabel: {
      flex: 1,
      fontFamily: fontFamily.bold,
      fontWeight: '700',
      fontSize: 17,
      color: c.text,
    },
    practitionerBody: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    search: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      fontSize: 16,
      marginBottom: spacing.md,
    },
    loader: { marginTop: spacing.xl },
    empty: {
      textAlign: 'center',
      marginTop: spacing.xxl,
      paddingHorizontal: spacing.lg,
    },
    listScroll: { flexGrow: 1 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontFamily: fontFamily.bold,
      fontWeight: '700',
      fontSize: 14,
    },
    rowCopy: { flex: 1, gap: 2 },
    rowName: {
      fontFamily: fontFamily.semibold,
      fontWeight: '600',
      fontSize: 16,
      color: c.text,
    },
  });
}
