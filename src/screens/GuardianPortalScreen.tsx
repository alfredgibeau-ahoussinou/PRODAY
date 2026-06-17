import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../context/LocaleContext';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import { ProDayText } from '../components/ui/ProDayText';
import { ProDaySurface } from '../components/ui/ProDaySurface';
import { PressableSpring } from '../components/motion';
import { ParentalTimeLimitScreen } from './ParentalTimeLimitScreen';
import { ParentalActivityReportScreen } from './ParentalActivityReportScreen';
import {
  parentalGuardianService,
  type LinkedMinorProfile,
} from '../services/parentalGuardian.service';
import { normalizeGuardianEmail } from '../utils/guardianEmail';
import {
  resolveDailyLimitMinutes,
  isScreenTimeActiveDay,
  resolveEffectiveLimitMinutes,
} from '../utils/parentalScreenTime';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { spacing, radius, shadows } from '../theme/designTokens';
import type { ParentalContact } from '../models/ParentalSettings';

interface GuardianPortalScreenProps {
  onBack: () => void;
}

type ViewMode = 'list' | 'time' | 'report' | 'contacts';

export const GuardianPortalScreen: React.FC<GuardianPortalScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const { profile, firebaseUser } = useAuth();
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const guardianEmail = normalizeGuardianEmail(profile?.email ?? firebaseUser?.email);

  const [mode, setMode] = useState<ViewMode>('list');
  const [children, setChildren] = useState<LinkedMinorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LinkedMinorProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [linking, setLinking] = useState(false);

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

  const totalAlerts = useMemo(
    () => children.reduce((sum, child) => sum + child.alerts.length, 0),
    [children],
  );

  const patchChild = async (
    child: LinkedMinorProfile,
    patch: Parameters<typeof parentalGuardianService.updateChildScreenTime>[2],
  ) => {
    if (!guardianEmail) return;
    setSaving(true);
    try {
      await parentalGuardianService.updateChildScreenTime(child.uid, guardianEmail, patch);
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Modification impossible.');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkCode = async () => {
    if (!guardianEmail) return;
    setLinking(true);
    try {
      const name = await parentalGuardianService.linkWithInviteCode(guardianEmail, inviteCode);
      setInviteCode('');
      Alert.alert(t('guardian.linked'), t('guardian.linkedBody', { name }));
      await load();
    } catch (e) {
      Alert.alert('Liaison impossible', e instanceof Error ? e.message : 'Code invalide.');
    } finally {
      setLinking(false);
    }
  };

  const toggleContact = (child: LinkedMinorProfile, uid: string) => {
    const contacts = (child.settings.approved_contacts ?? []).map((contact) =>
      contact.uid === uid ? { ...contact, approved: !contact.approved } : contact,
    );
    void patchChild(child, { approved_contacts: contacts });
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

  if (mode === 'report' && selected) {
    return (
      <ParentalActivityReportScreen
        childUid={selected.uid}
        childName={selected.display_name}
        onBack={() => setMode('list')}
      />
    );
  }

  if (mode === 'contacts' && selected) {
    const contacts = selected.settings.approved_contacts ?? [];
    return (
      <View style={[styles.root, rootStyle]}>
        <ScreenHeader title={t('guardian.approvedContacts')} onBack={() => setMode('list')} centered />
        <ScrollView contentContainerStyle={styles.content}>
          {contacts.length === 0 ? (
            <ProDayText variant="body" muted>
              Aucun contact enregistré pour le moment.
            </ProDayText>
          ) : (
            contacts.map((contact: ParentalContact) => (
              <ProDaySurface key={contact.uid} variant="module" style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <ProDayText variant="section">{contact.name}</ProDayText>
                    <ProDayText variant="caption" muted>
                      {contact.role}
                    </ProDayText>
                  </View>
                  <Switch
                    value={contact.approved}
                    disabled={saving}
                    onValueChange={() => toggleContact(selected, contact.uid)}
                    trackColor={{ false: c.border, true: c.brandSoft }}
                    thumbColor={contact.approved ? c.brand : c.surface}
                  />
                </View>
              </ProDaySurface>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title="Espace tuteur" onBack={onBack} centered />

      <ScrollView contentContainerStyle={styles.content}>
        <ProDaySurface variant="module" style={styles.hero}>
          <Icon name="shield" size={32} color={c.brand} />
          <ProDayText variant="section" style={styles.heroTitle}>
            Famille ProDay
          </ProDayText>
          <ProDayText variant="body" muted style={styles.heroBody}>
            Gérez le temps d’écran, validez les contacts et répondez aux demandes de déblocage
            de vos enfants.
          </ProDayText>
          {guardianEmail ? (
            <ProDayText variant="caption" accent>
              Compte tuteur : {guardianEmail}
            </ProDayText>
          ) : null}
          {totalAlerts > 0 ? (
            <View style={[styles.alertPill, { backgroundColor: c.accentSoft }]}>
              <ProDayText variant="caption" accent style={{ fontWeight: '700' }}>
                {totalAlerts} alerte{totalAlerts > 1 ? 's' : ''}
              </ProDayText>
            </View>
          ) : null}
        </ProDaySurface>

        <ProDaySurface variant="module" style={styles.linkCard}>
          <ProDayText variant="section">Lier un compte avec un code</ProDayText>
          <ProDayText variant="caption" muted>
            Demandez le code à 6 chiffres affiché sur le téléphone de l’enfant.
          </ProDayText>
          <TextInput
            value={inviteCode}
            onChangeText={setInviteCode}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="123456"
            placeholderTextColor={c.textMuted}
            style={[styles.codeInput, { borderColor: c.border, color: c.text }]}
          />
          <PressableSpring onPress={() => void handleLinkCode()} scaleTo={0.98} haptic disabled={linking}>
            <ProDayText variant="caption" accent style={styles.editLink}>
              {linking ? 'Liaison…' : 'Valider le code'}
            </ProDayText>
          </PressableSpring>
        </ProDaySurface>

        {loading ? (
          <ActivityIndicator color={c.brand} style={styles.loader} />
        ) : children.length === 0 ? (
          <ProDaySurface variant="module" style={styles.empty}>
            <ProDayText variant="section">{t('guardian.noLinked')}</ProDayText>
            <ProDayText variant="body" muted style={styles.emptyBody}>
              Utilisez l’email enregistré comme tuteur ou un code famille pour lier un compte
              mineur.
            </ProDayText>
          </ProDaySurface>
        ) : (
          children.map((child) => {
            const limit = resolveEffectiveLimitMinutes(child.settings);
            const activeToday = isScreenTimeActiveDay(child.settings.active_days);
            const usageLabel = activeToday
              ? `${child.minutesUsedToday} / ${limit} min aujourd’hui`
              : t('guardian.offDay');
            const pendingUnlock = child.settings.unlock_request?.status === 'pending';

            return (
              <ProDaySurface key={child.uid} variant="module" style={[styles.card, shadows.card]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleCol}>
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

                {child.alerts.map((alert) => (
                  <View key={alert} style={[styles.alertRow, { backgroundColor: c.accentSoft }]}>
                    <Icon name="alert-circle" size={14} color={c.accent} />
                    <ProDayText variant="caption" accent style={{ flex: 1 }}>
                      {alert}
                    </ProDayText>
                  </View>
                ))}

                {pendingUnlock ? (
                  <View style={styles.unlockRow}>
                    <ProDayText variant="caption" muted style={{ flex: 1 }}>
                      Demande +{child.settings.unlock_request?.minutes ?? 15} min
                    </ProDayText>
                    <PressableSpring
                      onPress={() =>
                        void parentalGuardianService
                          .approveUnlock(child.uid, guardianEmail!)
                          .then(load)
                      }
                      scaleTo={0.97}
                      haptic
                    >
                      <ProDayText variant="caption" accent style={styles.actionLink}>
                        Accorder
                      </ProDayText>
                    </PressableSpring>
                    <PressableSpring
                      onPress={() =>
                        void parentalGuardianService
                          .denyUnlock(child.uid, guardianEmail!)
                          .then(load)
                      }
                      scaleTo={0.97}
                    >
                      <ProDayText variant="caption" muted style={styles.actionLink}>
                        Refuser
                      </ProDayText>
                    </PressableSpring>
                  </View>
                ) : null}

                <ProDayText variant="caption" muted style={styles.limitLine}>
                  Limite : {resolveDailyLimitMinutes(child.settings)} min · Jours :{' '}
                  {(child.settings.active_days ?? []).join(', ') || '—'}
                </ProDayText>

                <View style={styles.linksRow}>
                  <PressableSpring
                    onPress={() => {
                      setSelected(child);
                      setMode('time');
                    }}
                    scaleTo={0.98}
                    haptic
                  >
                    <ProDayText variant="caption" accent style={styles.editLink}>
                      Limites
                    </ProDayText>
                  </PressableSpring>
                  <PressableSpring
                    onPress={() => {
                      setSelected(child);
                      setMode('report');
                    }}
                    scaleTo={0.98}
                  >
                    <ProDayText variant="caption" accent style={styles.editLink}>
                      Activité
                    </ProDayText>
                  </PressableSpring>
                  <PressableSpring
                    onPress={() => {
                      setSelected(child);
                      setMode('contacts');
                    }}
                    scaleTo={0.98}
                  >
                    <ProDayText variant="caption" accent style={styles.editLink}>
                      Contacts
                    </ProDayText>
                  </PressableSpring>
                </View>
              </ProDaySurface>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (c: { border: string; warning?: string; warningSoft?: string }) =>
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
    alertPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      marginTop: spacing.xs,
    },
    linkCard: {
      padding: spacing.lg,
      gap: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    codeInput: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 18,
      letterSpacing: 4,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
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
    cardTitleCol: { flex: 1 },
    limitLine: { lineHeight: 18 },
    editLink: { fontWeight: '700' },
    actionLink: { fontWeight: '700', marginLeft: spacing.sm },
    linksRow: {
      flexDirection: 'row',
      gap: spacing.lg,
      marginTop: spacing.xs,
    },
    alertRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      padding: spacing.sm,
      borderRadius: radius.md,
    },
    unlockRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
  });
