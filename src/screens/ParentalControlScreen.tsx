import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Alert,
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
import type { ParentalActivitySummary } from '../services/parentalActivity.service';
import { parentalActivityJournalService } from '../services/parentalActivityJournal.service';
import { parentalGuardianService } from '../services/parentalGuardian.service';
import type { ParentalContact, ParentalJournalEntry } from '../models/ParentalSettings';
import { spacing, radius, shadows } from '../theme/designTokens';
import { isMinorUser } from '../utils/minor';
import {
  getScreenTimeMinutesUsed,
  isScreenTimeActiveDay,
  resolveDailyLimitMinutes,
  resolveRuntimeMinutesUsed,
} from '../utils/parentalScreenTime';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';

type ParentalView = 'home' | 'report' | 'time';

const SAFETY_TIPS: { icon: 'shield' | 'chat' | 'lock' | 'time'; title: string; body: string }[] = [
  {
    icon: 'shield',
    title: 'Supervision active',
    body: 'Votre activité est suivie pour garantir un usage sûr de ProDay.',
  },
  {
    icon: 'chat',
    title: 'Contacts approuvés',
    body: 'Seuls les contacts validés peuvent vous écrire lorsque le filtre est activé.',
  },
  {
    icon: 'time',
    title: 'Temps d’écran',
    body: 'Une limite quotidienne protège votre équilibre entre sport, école et repos.',
  },
  {
    icon: 'lock',
    title: 'Données protégées',
    body: 'Votre tuteur est informé des réglages mais ne lit pas le contenu de vos messages.',
  },
];

interface ParentalControlScreenProps {
  onBack?: () => void;
  /** Intégré dans l’onglet Famille — sans en-tête retour. */
  embedded?: boolean;
}

export const ParentalControlScreen: React.FC<ParentalControlScreenProps> = ({
  onBack,
  embedded = false,
}) => {
  const { profile, refreshProfile } = useAuth();
  const { colors: c, productLine, isWoman, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  
  const [view, setView] = useState<ParentalView>('home');
  const [settings, setSettings] = useState<ParentalSettings>(DEFAULT_PARENTAL_SETTINGS);
  const [contacts, setContacts] = useState<ParentalContact[]>([]);
  const [activity, setActivity] = useState<ParentalActivitySummary | null>(null);
  const [minutesUsedToday, setMinutesUsedToday] = useState(0);
  const [journal, setJournal] = useState<ParentalJournalEntry[]>([]);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
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
          setActivity(summary);
          setContacts(mergeContacts(summary.contacts, base.approved_contacts));
          const localMinutes = await getScreenTimeMinutesUsed(profile.uid);
          const remoteMinutes = resolveRuntimeMinutesUsed(profile.parental_runtime);
          setMinutesUsedToday(Math.max(localMinutes, remoteMinutes));
          const entries = await parentalActivityJournalService.list(
            profile.uid,
            base.activity_journal,
          );
          setJournal(entries);
          const code = await parentalGuardianService.ensureInviteCode(profile.uid, {
            ...base,
            is_minor: true,
          });
          setInviteCode(code);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.uid, profile?.parental_settings, profile?.parental_runtime, mergeContacts]);

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
      if (partial.contacts_filter_enabled === false || partial.supervision_enabled === false) {
        Alert.alert(
          'Paramètre verrouillé',
          'Les protections de supervision et de filtrage des contacts ne peuvent pas être désactivées depuis un compte mineur.',
        );
        return prev;
      }
      const next = { ...prev, ...partial };
      persist(next);
      return next;
    });
  };

  if (!profile || !isMinorUser(profile)) {
    if (embedded) return null;
    return (
      <View style={[styles.root, rootStyle]}>
        <ScreenHeader title="Contrôle parental" onBack={onBack!} centered />
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

  const limitMinutes = resolveDailyLimitMinutes(settings);
  const screenTimeActiveToday = isScreenTimeActiveDay(settings.active_days);
  const pendingContacts = contacts.filter((contact) => !contact.approved).length;
  const approvedContacts = contacts.filter((contact) => contact.approved).length;
  const screenProgress =
    settings.screen_time_enabled && screenTimeActiveToday && limitMinutes > 0
      ? Math.min(100, Math.round((minutesUsedToday / limitMinutes) * 100))
      : 0;
  const playerAge = profile.profile?.age;

  return (
    <View style={[styles.root, rootStyle, embedded && styles.embeddedRoot]}>
      {!embedded ? (
        <ScreenHeader title="Contrôle parental" onBack={onBack!} centered />
      ) : null}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={c.brand} style={styles.loader} />
        ) : (
          <>
            <View style={styles.dashboard}>
              <View style={styles.dashboardTop}>
                <View style={styles.dashboardIcon}>
                  <Icon name="shield" size={28} color={c.brandInverse} />
                </View>
                <View style={styles.dashboardBadges}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Compte mineur</Text>
                  </View>
                  {settings.supervision_enabled ? (
                    <View style={[styles.badge, styles.badgeOn]}>
                      <Text style={[styles.badgeText, styles.badgeTextOn]}>Protégé</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <Text style={styles.dashboardTitle}>Espace famille ProDay</Text>
              <Text style={styles.dashboardSub}>
                {playerAge
                  ? `${profile.display_name}, ${playerAge} ans — votre compte est encadré pour un usage sportif sûr.`
                  : `${profile.display_name} — votre compte est encadré pour un usage sportif sûr.`}
              </Text>
              {settings.guardian_name || settings.guardian_email ? (
                <View style={styles.guardianCard}>
                  <Icon name="person" size={18} color={c.brandInverse} />
                  <View style={styles.guardianCopy}>
                    <Text style={styles.guardianTitle}>
                      {settings.guardian_name ?? 'Tuteur enregistré'}
                    </Text>
                    {settings.guardian_email ? (
                      <Text style={styles.guardianEmail}>{settings.guardian_email}</Text>
                    ) : null}
                  </View>
                </View>
              ) : (
                <Text style={styles.guardianMissing}>
                  Aucun tuteur enregistré — demandez à un parent de compléter l’inscription
                  familiale.
                </Text>
              )}
              {inviteCode ? (
                <View style={styles.inviteCard}>
                  <Text style={styles.inviteTitle}>Code famille (co-tuteur)</Text>
                  <Text style={styles.inviteCode}>{inviteCode}</Text>
                  <Text style={styles.inviteHint}>
                    Partagez ce code à 6 chiffres pour qu’un second tuteur lie votre compte.
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>Vue d’ensemble</Text>
            <View style={styles.statsRow}>
              <StatPill
                styles={styles}
                icon="chat"
                value={String(activity?.messagesCount ?? 0)}
                label="Conversations"
                colors={c}
              />
              <StatPill
                styles={styles}
                icon="people"
                value={String(approvedContacts)}
                label="Contacts OK"
                colors={c}
              />
              <StatPill
                styles={styles}
                icon="time"
                value={
                  settings.screen_time_enabled && screenTimeActiveToday
                    ? `${minutesUsedToday}/${limitMinutes}`
                    : '—'
                }
                label="Min. aujourd’hui"
                colors={c}
              />
            </View>

            {settings.screen_time_enabled ? (
              <View style={[styles.screenCard, shadows.card]}>
                <View style={styles.screenHeader}>
                  <View>
                    <Text style={styles.screenTitle}>Temps d’écran</Text>
                    <Text style={styles.screenSub}>
                      {screenTimeActiveToday
                        ? `${minutesUsedToday} min utilisées sur ${limitMinutes} min`
                        : `Limite de ${limitMinutes} min — jour hors plage autorisée`}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setView('time')} hitSlop={8}>
                    <Text style={styles.linkAction}>Modifier</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: c.surfaceMuted }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${screenProgress}%`,
                        backgroundColor:
                          screenProgress >= 90 ? c.warning : screenProgress >= 100 ? c.error : c.brand,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.activeDays}>
                  Jours actifs : {(settings.active_days ?? []).join(' · ') || '—'}
                </Text>
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>Actions rapides</Text>
            <TouchableOpacity
              style={[styles.menuCard, shadows.card]}
              onPress={() => setView('report')}
            >
              <View style={styles.menuIcon}>
                <Icon name="document" size={22} color={c.brand} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>Rapport d&apos;activité</Text>
                <Text style={styles.menuSub}>
                  {activity?.recent.length
                    ? `${activity.recent.length} événement(s) récent(s)`
                    : 'Messages, candidatures et convocations'}
                </Text>
              </View>
              <Icon name="chevron-forward" size={20} color={c.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuCard, shadows.card]}
              onPress={() => setView('time')}
            >
              <View style={styles.menuIcon}>
                <Icon name="time" size={22} color={c.brand} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>Limite & jours actifs</Text>
                <Text style={styles.menuSub}>
                  {settings.screen_time_enabled
                    ? `${limitMinutes} min / jour · ${(settings.active_days ?? []).length} jour(s)`
                    : 'Configurer le temps d’écran'}
                </Text>
              </View>
              <Switch
                value={settings.screen_time_enabled}
                onValueChange={(screen_time_enabled) => patch({ screen_time_enabled })}
                trackColor={{ false: c.border, true: c.brandSoft }}
                thumbColor={settings.screen_time_enabled ? c.brand : c.surface}
              />
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Protections actives</Text>
            <ProtectionCard
              styles={styles}
              colors={c}
              icon="shield"
              title="Supervision du compte"
              subtitle="Activité suivie et alertes en cas d’usage à risque"
              locked
            />
            <ProtectionCard
              styles={styles}
              colors={c}
              icon="chat"
              title="Filtrage des contacts"
              subtitle={
                pendingContacts > 0
                  ? `${pendingContacts} contact(s) en attente de validation`
                  : 'Seuls les contacts approuvés peuvent écrire'
              }
              locked
            />

            {activity?.recent.length ? (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, styles.sectionTitleInline]}>
                    Activité récente
                  </Text>
                  <TouchableOpacity onPress={() => setView('report')}>
                    <Text style={styles.linkAction}>Tout voir</Text>
                  </TouchableOpacity>
                </View>
                {activity.recent.slice(0, 3).map((item, index) => (
                  <View key={`${item.title}-${index}`} style={[styles.activityRow, shadows.card]}>
                    <View style={[styles.activityDot, styles.dotSafe]} />
                    <View style={styles.activityCopy}>
                      <Text style={styles.activityTitle}>{item.title}</Text>
                      <Text style={styles.activityMeta}>{item.meta}</Text>
                    </View>
                  </View>
                ))}
              </>
            ) : null}

            {journal.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Journal simplifié</Text>
                <Text style={styles.contactsHint}>
                  Connexions, messages envoyés et temps par section — sans contenu des messages.
                </Text>
                {journal.slice(0, 6).map((entry) => (
                  <View key={entry.id} style={[styles.activityRow, shadows.card]}>
                    <View style={[styles.activityDot, styles.dotSafe]} />
                    <View style={styles.activityCopy}>
                      <Text style={styles.activityTitle}>{entry.label}</Text>
                      <Text style={styles.activityMeta}>
                        {entry.type === 'section_time' && entry.minutes
                          ? `${entry.minutes} min · `
                          : ''}
                        {new Date(entry.at).toLocaleString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            ) : null}

            <Text style={styles.sectionTitle}>Contacts autorisés</Text>
            <Text style={styles.contactsHint}>
              Appuyez sur un contact pour l’approuver ou le retirer. Les contacts en attente ne
              peuvent pas vous écrire si le filtre est actif.
            </Text>

            {contacts.length === 0 ? (
              <View style={[styles.emptyCard, shadows.card]}>
                <Icon name="chat" size={28} color={c.textMuted} />
                <Text style={styles.emptyTitle}>Aucun contact pour le moment</Text>
                <Text style={styles.emptyBody}>
                  Dès que vous échangez sur la messagerie ProDay, vos contacts apparaîtront ici
                  pour validation.
                </Text>
              </View>
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

            <Text style={styles.sectionTitle}>Bon à savoir</Text>
            {SAFETY_TIPS.map((tip) => (
              <View key={tip.title} style={[styles.tipRow, shadows.card]}>
                <View style={styles.tipIcon}>
                  <Icon name={tip.icon} size={18} color={c.brand} />
                </View>
                <View style={styles.tipCopy}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipBody}>{tip.body}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const StatPill: React.FC<{
  styles: ReturnType<typeof createStyles>;
  colors: AppColors;
  icon: 'chat' | 'people' | 'time';
  value: string;
  label: string;
}> = ({ styles, colors, icon, value, label }) => (
  <View style={[styles.statPill, { borderColor: colors.border, backgroundColor: colors.surface }]}>
    <Icon name={icon} size={16} color={colors.brand} />
    <Text style={styles.statPillValue}>{value}</Text>
    <Text style={styles.statPillLabel}>{label}</Text>
  </View>
);

const ProtectionCard: React.FC<{
  styles: ReturnType<typeof createStyles>;
  colors: AppColors;
  icon: 'shield' | 'chat';
  title: string;
  subtitle: string;
  locked?: boolean;
}> = ({ styles, colors, icon, title, subtitle, locked }) => (
  <View style={[styles.protectionCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
    <View style={[styles.menuIcon, { marginBottom: 0 }]}>
      <Icon name={icon} size={20} color={colors.brand} />
    </View>
    <View style={styles.protectionCopy}>
      <Text style={styles.settingTitle}>{title}</Text>
      <Text style={styles.settingSub}>{subtitle}</Text>
    </View>
    {locked ? (
      <View style={[styles.lockBadge, { backgroundColor: colors.brandSoft }]}>
        <Icon name="lock" size={14} color={colors.brand} />
      </View>
    ) : null}
  </View>
);

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    embeddedRoot: { flex: 1 },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    loader: { marginTop: spacing.xl },
    dashboard: {
      backgroundColor: c.brand,
      borderRadius: radius.lg,
      padding: spacing.xl,
      marginBottom: spacing.lg,
    },
    dashboardTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    dashboardBadges: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', justifyContent: 'flex-end' },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.sm,
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    badgeOn: { backgroundColor: 'rgba(255,255,255,0.9)' },
    badgeText: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.3 },
    badgeTextOn: { color: c.brand },
    dashboardIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    dashboardTitle: { fontSize: 20, fontWeight: '800', color: c.brandInverse },
    dashboardSub: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.88)',
      marginTop: spacing.sm,
      lineHeight: 21,
    },
    guardianCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    guardianCopy: { flex: 1, gap: 2 },
    guardianTitle: { fontSize: 14, fontWeight: '700', color: c.brandInverse },
    guardianEmail: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
      fontWeight: '600',
    },
    guardianMissing: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
      marginTop: spacing.md,
      lineHeight: 18,
    },
    inviteCard: {
      marginTop: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      gap: spacing.xs,
    },
    inviteTitle: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
    inviteCode: {
      fontSize: 28,
      fontWeight: '900',
      color: c.brandInverse,
      letterSpacing: 6,
    },
    inviteHint: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.75)',
      textAlign: 'center',
      lineHeight: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
      marginBottom: spacing.md,
      marginTop: spacing.sm,
    },
    sectionTitleInline: { marginTop: 0, marginBottom: 0 },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    statPill: {
      flex: 1,
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.md,
      alignItems: 'center',
      gap: 4,
    },
    statPillValue: { fontSize: 18, fontWeight: '900', color: c.text },
    statPillLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: c.textMuted,
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    screenCard: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing.sm,
    },
    screenHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    screenTitle: { fontSize: 15, fontWeight: '700', color: c.text },
    screenSub: { fontSize: 12, color: c.textMuted, marginTop: 2, lineHeight: 18 },
    progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },
    activeDays: { fontSize: 11, color: c.textMuted, fontWeight: '600' },
    linkAction: { fontSize: 13, fontWeight: '700', color: c.brand },
    protectionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      gap: spacing.md,
    },
    protectionCopy: { flex: 1 },
    lockBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activityRow: {
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
    activityDot: { width: 8, height: 8, borderRadius: 4 },
    dotSafe: { backgroundColor: c.success },
    activityCopy: { flex: 1 },
    activityTitle: { fontSize: 14, fontWeight: '700', color: c.text },
    activityMeta: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    emptyCard: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing.sm,
    },
    emptyTitle: { fontSize: 15, fontWeight: '700', color: c.text, textAlign: 'center' },
    emptyBody: {
      fontSize: 13,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
    tipRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing.md,
    },
    tipIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tipCopy: { flex: 1, gap: 2 },
    tipTitle: { fontSize: 14, fontWeight: '700', color: c.text },
    tipBody: { fontSize: 12, color: c.textMuted, lineHeight: 18 },
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
    settingTitle: { fontSize: 15, fontWeight: '700', color: c.text },
    settingSub: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    contactsHint: {
      fontSize: 12,
      color: c.textMuted,
      marginBottom: spacing.md,
      lineHeight: 18,
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
