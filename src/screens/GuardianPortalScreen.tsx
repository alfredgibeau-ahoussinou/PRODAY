import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import { ProDayText } from '../components/ui/ProDayText';
import { ProDaySurface } from '../components/ui/ProDaySurface';
import { PressableSpring } from '../components/motion';
import { ParentalTimeLimitScreen } from './ParentalTimeLimitScreen';
import {
  parentalGuardianService,
  type LinkedMinorProfile,
} from '../services/parentalGuardian.service';
import { normalizeGuardianEmail } from '../utils/guardianEmail';
import { resolveDailyLimitMinutes, isScreenTimeActiveDay } from '../utils/parentalScreenTime';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { spacing, radius, shadows } from '../theme/designTokens';

interface GuardianPortalScreenProps {
  onBack: () => void;
}

type ViewMode = 'list' | 'time';

export const GuardianPortalScreen: React.FC<GuardianPortalScreenProps> = ({ onBack }) => {
  const { profile, firebaseUser } = useAuth();
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const guardianEmail = normalizeGuardianEmail(profile?.email ?? firebaseUser?.email);

  const [mode, setMode] = useState<ViewMode>('list');
  const [children, setChildren] = useState<LinkedMinorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LinkedMinorProfile | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!guardianEmail) {
      setChildren([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setChildren(await parentalGuardianService.listLinkedMinors(guardianEmail));
    setLoading(false);
  }, [guardianEmail]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchChild = async (
    child: LinkedMinorProfile,
    patch: Parameters<typeof parentalGuardianService.updateChildScreenTime>[2],
  ) => {
    if (!guardianEmail) return;
    setSaving(true);
    try {
      await parentalGuardianService.updateChildScreenTime(child.uid, guardianEmail, patch);
      await load();
      setSelected((prev) =>
        prev?.uid === child.uid
          ? {
              ...prev,
              settings: {
                ...prev.settings,
                ...patch,
                daily_limit_minutes:
                  patch.daily_limit_minutes ?? prev.settings.daily_limit_minutes,
                active_days: patch.active_days ?? prev.settings.active_days,
              },
            }
          : prev,
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Modification impossible.');
    } finally {
      setSaving(false);
    }
  };

  if (mode === 'time' && selected) {
    return (
      <ParentalTimeLimitScreen
        minutes={selected.settings.daily_limit_minutes}
        activeDays={selected.settings.active_days}
        onBack={() => setMode('list')}
        onSave={(daily_limit_minutes, active_days) => {
          void patchChild(selected, {
            daily_limit_minutes,
            active_days,
            screen_time_enabled: true,
          }).then(() => setMode('list'));
        }}
      />
    );
  }

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title="Espace tuteur" onBack={onBack} centered />

      <ScrollView contentContainerStyle={styles.content}>
        <ProDaySurface variant="module" style={styles.hero}>
          <Icon name="shield" size={32} color={c.brand} />
          <ProDayText variant="section" style={styles.heroTitle}>
            Gestion à distance
          </ProDayText>
          <ProDayText variant="body" muted style={styles.heroBody}>
            Connectez-vous avec l’email enregistré comme tuteur lors de l’inscription du
            mineur pour ajuster le temps d’écran à distance.
          </ProDayText>
          {guardianEmail ? (
            <ProDayText variant="caption" accent>
              Compte tuteur : {guardianEmail}
            </ProDayText>
          ) : null}
        </ProDaySurface>

        {loading ? (
          <ActivityIndicator color={c.brand} style={styles.loader} />
        ) : children.length === 0 ? (
          <ProDaySurface variant="module" style={styles.empty}>
            <ProDayText variant="section">Aucun compte lié</ProDayText>
            <ProDayText variant="body" muted style={styles.emptyBody}>
              Aucun compte mineur n’est associé à cet email. Vérifiez que l’adresse
              correspond à celle indiquée lors de l’inscription.
            </ProDayText>
          </ProDaySurface>
        ) : (
          children.map((child) => {
            const limit = resolveDailyLimitMinutes(child.settings);
            const activeToday = isScreenTimeActiveDay(child.settings.active_days);
            const usageLabel = activeToday
              ? `${child.minutesUsedToday} / ${limit} min aujourd’hui`
              : 'Jour hors plage autorisée';

            return (
              <ProDaySurface key={child.uid} variant="module" style={[styles.card, shadows.card]}>
                <View style={styles.cardHeader}>
                  <View>
                    <ProDayText variant="section">{child.display_name}</ProDayText>
                    <ProDayText variant="caption" muted>
                      {usageLabel}
                    </ProDayText>
                  </View>
                  <Switch
                    value={child.settings.screen_time_enabled}
                    disabled={saving}
                    onValueChange={(screen_time_enabled) =>
                      void patchChild(child, { screen_time_enabled })
                    }
                    trackColor={{ false: c.border, true: c.brandSoft }}
                    thumbColor={child.settings.screen_time_enabled ? c.brand : c.surface}
                  />
                </View>

                <ProDayText variant="caption" muted style={styles.limitLine}>
                  Limite : {limit} min · Jours :{' '}
                  {(child.settings.active_days ?? []).join(', ') || '—'}
                </ProDayText>

                <PressableSpring
                  onPress={() => {
                    setSelected(child);
                    setMode('time');
                  }}
                  scaleTo={0.98}
                  haptic
                >
                  <ProDayText variant="caption" accent style={styles.editLink}>
                    Modifier la limite et les jours actifs
                  </ProDayText>
                </PressableSpring>
              </ProDaySurface>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (c: { border: string }) =>
  StyleSheet.create({
    root: { flex: 1 },
    content: {
      padding: spacing.lg,
      gap: spacing.md,
      paddingBottom: spacing.xl,
    },
    hero: {
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.lg,
    },
    heroTitle: { textAlign: 'center' },
    heroBody: { textAlign: 'center', lineHeight: 22 },
    loader: { marginTop: spacing.xl },
    empty: {
      padding: spacing.lg,
      gap: spacing.sm,
      alignItems: 'center',
    },
    emptyBody: { textAlign: 'center', lineHeight: 22 },
    card: {
      padding: spacing.lg,
      gap: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    limitLine: { lineHeight: 18 },
    editLink: { fontWeight: '700', marginTop: spacing.xs },
  });
