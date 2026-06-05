import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profile.service';
import {
  DEFAULT_PARENTAL_SETTINGS,
  type ParentalSettings,
} from '../models/ParentalSettings';
import { ParentalActivityReportScreen } from './ParentalActivityReportScreen';
import { ParentalTimeLimitScreen } from './ParentalTimeLimitScreen';
import { parentalActivityService } from '../services/parentalActivity.service';
import type { ParentalContact } from '../models/ParentalSettings';
import { spacing, radius, shadows } from '../theme/designTokens';
import { isMinorUser } from '../utils/minor';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';

type ParentalView = 'home' | 'report' | 'time';

interface ParentalControlScreenProps {
  onBack: () => void;
}

export const ParentalControlScreen: React.FC<ParentalControlScreenProps> = ({
  onBack,
}) => {
  const { profile, refreshProfile } = useAuth();
  const { colors: c, productLine, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const isWoman = productLine === 'woman';
  const [view, setView] = useState<ParentalView>('home');
  const [settings, setSettings] = useState<ParentalSettings>(DEFAULT_PARENTAL_SETTINGS);
  const [contacts, setContacts] = useState<ParentalContact[]>([]);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mergeContacts = useCallback(
    (
      discovered: ParentalContact[],
      approved: ParentalContact[] | undefined
    ): ParentalContact[] => {
      const approvedMap = new Map((approved ?? []).map((contact) => [contact.uid, contact]));
      const merged = new Map<string, ParentalContact>();
      for (const contact of discovered) {
        const saved = approvedMap.get(contact.uid);
        merged.set(contact.uid, {
          ...contact,
          approved: saved?.approved ?? contact.approved,
          name: saved?.name ?? contact.name,
          role: saved?.role ?? contact.role,
        });
      }
      for (const contact of approved ?? []) {
        if (!merged.has(contact.uid)) merged.set(contact.uid, contact);
      }
      return Array.from(merged.values());
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = profile?.parental_settings;
      const base: ParentalSettings = stored
        ? {
            ...DEFAULT_PARENTAL_SETTINGS,
            ...stored,
            active_days: stored.active_days?.length
              ? stored.active_days
              : DEFAULT_PARENTAL_SETTINGS.active_days,
          }
        : DEFAULT_PARENTAL_SETTINGS;
      if (!cancelled) setSettings(base);

      if (profile?.uid) {
        const summary = await parentalActivityService.getSummary(profile.uid);
        if (!cancelled) {
          setContacts(mergeContacts(summary.contacts, base.approved_contacts));
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.uid, profile?.parental_settings, mergeContacts]);

  const persist = useCallback(
    (next: ParentalSettings) => {
      if (!profile?.uid) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        await profileService.updateParentalSettings(profile.uid, next);
        await refreshProfile?.();
      }, 400);
    },
    [profile?.uid, refreshProfile]
  );

  const patch = (partial: Partial<ParentalSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      persist(next);
      return next;
    });
  };

  if (!profile || !isMinorUser(profile)) {
    return (
      <View style={[styles.root, rootStyle]}>
        <ScreenHeader title="Contrôle parental" onBack={onBack} centered />
        <View style={styles.restricted}>
          <Text style={styles.restrictedTitle}>Réservé aux comptes mineurs</Text>
          <Text style={styles.restrictedSub}>
            {isWoman
              ? 'Cet espace est accessible uniquement pour les joueuses de moins de 18 ans.'
              : 'Cet espace est accessible uniquement pour les joueurs de moins de 18 ans.'}
          </Text>
        </View>
      </View>
    );
  }

  if (view === 'report' && profile.uid) {
    return (
      <ParentalActivityReportScreen
        childUid={profile.uid}
        childName={profile.display_name}
        onBack={() => setView('home')}
      />
    );
  }

  const toggleContactApproved = (uid: string) => {
    const nextContacts = contacts.map((contact) =>
      contact.uid === uid ? { ...contact, approved: !contact.approved } : contact
    );
    setContacts(nextContacts);
    patch({ approved_contacts: nextContacts });
  };

  if (view === 'time') {
    return (
      <ParentalTimeLimitScreen
        minutes={settings.daily_limit_minutes}
        activeDays={settings.active_days}
        onBack={() => setView('home')}
        onSave={(daily_limit_minutes, active_days) => {
          patch({ daily_limit_minutes, active_days, screen_time_enabled: true });
        }}
      />
    );
  }

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader title="Contrôle parental" onBack={onBack} centered />

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={c.brand} style={styles.loader} />
        ) : (
          <>
            <View style={styles.dashboard}>
              <View style={styles.dashboardIcon}>
                <Icon name="shield" size={28} color={c.brandInverse} />
              </View>
              <Text style={styles.dashboardTitle}>Espace famille ProDay</Text>
              <Text style={styles.dashboardSub}>
                {settings.is_minor
                  ? `Compte mineur${settings.guardian_name ? ` — responsable : ${settings.guardian_name}` : ''}.`
                  : 'Paramètres enregistrés sur le compte. Supervisez l&apos;activité en toute confiance.'}
              </Text>
              {settings.guardian_email ? (
                <Text style={styles.guardianEmail}>Contact tuteur : {settings.guardian_email}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.menuCard, shadows.card]}
              onPress={() => setView('report')}
            >
              <View style={styles.menuIcon}>
                <Icon name="chat" size={22} color={c.brand} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>Rapport d&apos;activité</Text>
                <Text style={styles.menuSub}>Messages, profils, temps passé</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={c.textMuted} />
            </TouchableOpacity>

            <SettingRow
              styles={styles}
              colors={c}
              title="Supervision"
              subtitle="Activer la supervision du compte"
              value={settings.supervision_enabled}
              onValueChange={(supervision_enabled) => patch({ supervision_enabled })}
            />
            <SettingRow
              styles={styles}
              colors={c}
              title="Contacts"
              subtitle="Filtrer les contacts non approuvés"
              value={settings.contacts_filter_enabled}
              onValueChange={(contacts_filter_enabled) => patch({ contacts_filter_enabled })}
            />
            <TouchableOpacity
              style={[styles.menuCard, shadows.card]}
              onPress={() => setView('time')}
            >
              <View style={styles.menuIcon}>
                <Icon name="time" size={22} color={c.brand} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>Temps d&apos;écran</Text>
                <Text style={styles.menuSub}>
                  {settings.screen_time_enabled
                    ? `Limite : ${settings.daily_limit_minutes} min / jour`
                    : 'Limite désactivée'}
                </Text>
              </View>
              <Switch
                value={settings.screen_time_enabled}
                onValueChange={(screen_time_enabled) => patch({ screen_time_enabled })}
                trackColor={{ false: c.border, true: c.brandSoft }}
                thumbColor={settings.screen_time_enabled ? c.brand : c.surface}
              />
            </TouchableOpacity>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Contacts autorisés</Text>
            </View>
            <Text style={styles.contactsHint}>
              Contacts détectés via la messagerie ProDay. Appuyez pour approuver ou retirer.
            </Text>

            {contacts.length === 0 ? (
              <Text style={styles.contactsEmpty}>
                Aucun contact pour le moment. Les conversations apparaîtront ici.
              </Text>
            ) : (
              contacts.map((contact) => (
                <TouchableOpacity
                  key={contact.uid}
                  style={[styles.contactRow, shadows.card]}
                  onPress={() => toggleContactApproved(contact.uid)}
                >
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactLetter}>{contact.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactRole}>{contact.role}</Text>
                  </View>
                  <View
                    style={[
                      styles.approvedBadge,
                      !contact.approved && styles.pendingBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.approvedText,
                        !contact.approved && styles.pendingText,
                      ]}
                    >
                      {contact.approved ? 'Approuvé' : 'En attente'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const SettingRow: React.FC<{
  styles: ReturnType<typeof createStyles>;
  colors: AppColors;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}> = ({ styles, colors, title, subtitle, value, onValueChange }) => (
  <View style={styles.settingRow}>
    <View style={styles.settingText}>
      <Text style={styles.settingTitle}>{title}</Text>
      <Text style={styles.settingSub}>{subtitle}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: colors.brandSoft }}
      thumbColor={value ? colors.brand : colors.surface}
    />
  </View>
);

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    loader: { marginTop: spacing.xl },
    dashboard: {
      backgroundColor: c.brand,
      borderRadius: radius.lg,
      padding: spacing.xl,
      marginBottom: spacing.lg,
      alignItems: 'flex-start',
    },
    dashboardIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    dashboardTitle: { fontSize: 18, fontWeight: '800', color: c.brandInverse },
    dashboardSub: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.85)',
      marginTop: spacing.sm,
      lineHeight: 20,
    },
    guardianEmail: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.75)',
      marginTop: spacing.sm,
      fontWeight: '600',
    },
    menuCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing.md,
    },
    menuIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuText: { flex: 1 },
    menuTitle: { fontSize: 15, fontWeight: '700', color: c.text },
    menuSub: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    settingText: { flex: 1 },
    settingTitle: { fontSize: 15, fontWeight: '700', color: c.text },
    settingSub: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.xl,
      marginBottom: spacing.md,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: c.text },
    contactsHint: {
      fontSize: 12,
      color: c.textMuted,
      marginBottom: spacing.md,
      lineHeight: 18,
    },
    contactsEmpty: {
      fontSize: 13,
      color: c.textMuted,
      marginBottom: spacing.lg,
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing.sm,
    },
    contactAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    contactLetter: { fontSize: 18, fontWeight: '800', color: c.brand },
    contactInfo: { flex: 1 },
    contactName: { fontSize: 14, fontWeight: '700', color: c.text },
    contactRole: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    approvedBadge: {
      backgroundColor: c.successBg,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    approvedText: { fontSize: 10, fontWeight: '700', color: c.success },
    pendingBadge: { backgroundColor: c.warningBg },
    pendingText: { color: c.warning },
    restricted: {
      flex: 1,
      padding: spacing.xl,
      justifyContent: 'center',
      alignItems: 'center',
    },
    restrictedTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: c.text,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    restrictedSub: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 21,
    },
  });
}
