import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Share, Text, View, StyleSheet } from 'react-native';
import { adminService, type BetaWaitlistEntry } from '../../services/admin.service';
import { adminAuditService } from '../../services/adminAudit.service';
import { useAuth } from '../../context/AuthContext';
import { AdminSectionHeader } from './AdminSectionHeader';
import { AdminEmptyState } from './AdminEmptyState';
import { AdminFilterChips } from './AdminFilterChips';
import { AdminBetaWaitlistCard } from './AdminBetaWaitlistCard';
import { AdminKpiStrip } from './AdminKpiStrip';
import { ADMIN_SITE_URL } from './AdminPlatformBrief';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { buildBetaProgrammeUrl } from '../../utils/betaWaitlistStatus';
import { getCallableErrorMessage } from '../../lib/firebaseFunctions';
import { useAdminStyles } from './adminStyles';
import { spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

type WaitlistFilter = 'all' | 'pending' | 'approved' | 'rejected';

const WAITLIST_FILTERS: { id: WaitlistFilter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'pending', label: 'En attente' },
  { id: 'approved', label: 'Approuvés' },
  { id: 'rejected', label: 'Refusés' },
];

export const AdminBetaProgramPanel: React.FC = () => {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const { profile, firebaseUser } = useAuth();
  const [waitlistFilter, setWaitlistFilter] = useState<WaitlistFilter>('pending');
  const [loading, setLoading] = useState(true);
  const [actionEntryId, setActionEntryId] = useState<string | null>(null);
  const [waitlist, setWaitlist] = useState<BetaWaitlistEntry[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const entries = await adminService.listBetaWaitlist(100);
      setWaitlist(entries);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredWaitlist = useMemo(() => {
    if (waitlistFilter === 'all') return waitlist;
    return waitlist.filter((entry) => entry.status === waitlistFilter);
  }, [waitlist, waitlistFilter]);

  const waitlistCounts = useMemo(
    () => ({
      all: waitlist.length,
      pending: waitlist.filter((e) => e.status === 'pending').length,
      approved: waitlist.filter((e) => e.status === 'approved').length,
      rejected: waitlist.filter((e) => e.status === 'rejected').length,
    }),
    [waitlist],
  );

  const runAction = async (entryId: string, action: () => Promise<void>) => {
    setActionEntryId(entryId);
    try {
      await action();
      await load();
    } catch (e) {
      const detail = getCallableErrorMessage(e);
      Alert.alert('Erreur bêta', detail);
      if (__DEV__) console.warn('[AdminBetaProgramPanel]', detail, e);
    } finally {
      setActionEntryId(null);
    }
  };

  const handleApprove = (entry: BetaWaitlistEntry) => {
    Alert.alert(
      'Approuver l\'accès bêta',
      `Envoyer l'email de bienvenue à ${entry.email} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Approuver',
          onPress: () =>
            void runAction(entry.id, async () => {
              const result = await adminService.approveBetaWaitlistEntry(entry.id);
              await adminAuditService.log({
                action: 'beta_approved',
                actor_uid: profile?.uid ?? '',
                actor_email: firebaseUser?.email ?? profile?.email,
                target_type: 'beta_waitlist',
                target_id: entry.id,
                summary: `Accès bêta approuvé — ${entry.email}`,
              });
              if (result.emailSent) {
                Alert.alert('Bêta', `Accès validé. Email envoyé à ${entry.email}.`);
              } else {
                Alert.alert(
                  'Bêta',
                  `Accès validé mais email non envoyé${result.emailError ? ` : ${result.emailError}` : '.'}`,
                );
              }
            }),
        },
      ],
    );
  };

  const handleReject = (entry: BetaWaitlistEntry) => {
    Alert.alert('Rejeter l\'inscription', `Refuser ${entry.email} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Rejeter',
        style: 'destructive',
        onPress: () =>
          void runAction(entry.id, async () => {
            await adminService.rejectBetaWaitlistEntry(entry.id);
            await adminAuditService.log({
              action: 'beta_rejected',
              actor_uid: profile?.uid ?? '',
              actor_email: firebaseUser?.email ?? profile?.email,
              target_type: 'beta_waitlist',
              target_id: entry.id,
              summary: `Inscription bêta refusée — ${entry.email}`,
            });
            Alert.alert('Bêta', 'Inscription refusée.');
          }),
      },
    ]);
  };

  const handleResend = (entry: BetaWaitlistEntry) => {
    Alert.alert('Renvoyer l\'email', `Renvoyer le lien bêta à ${entry.email} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Renvoyer',
        onPress: () =>
          void runAction(entry.id, async () => {
            const result = await adminService.resendBetaWelcomeEmail(entry.id);
            if (result.emailSent) {
              Alert.alert('Bêta', 'Email renvoyé.');
            } else {
              Alert.alert(
                'Erreur',
                result.emailError ?? 'Envoi email impossible. Vérifiez la config EmailJS / Resend.',
              );
            }
          }),
      },
    ]);
  };

  const handleDelete = (entry: BetaWaitlistEntry) => {
    Alert.alert(
      'Supprimer l\'inscription',
      `Retirer définitivement ${entry.email} de la bêta ? Le lien d'accès sera révoqué.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () =>
            void runAction(entry.id, async () => {
              await adminService.deleteBetaWaitlistEntry(entry.id);
              await adminAuditService.log({
                action: 'beta_deleted',
                actor_uid: profile?.uid ?? '',
                actor_email: firebaseUser?.email ?? profile?.email,
                target_type: 'beta_waitlist',
                target_id: entry.id,
                summary: `Inscription bêta supprimée — ${entry.email}`,
              });
              Alert.alert('Bêta', 'Inscription supprimée.');
            }),
        },
      ],
    );
  };

  const handleShareLink = async (entry: BetaWaitlistEntry) => {
    if (!entry.access_token) {
      Alert.alert('Lien indisponible', 'Aucun jeton d\'accès — approuvez d\'abord l\'inscription.');
      return;
    }
    const url = buildBetaProgrammeUrl(ADMIN_SITE_URL, entry.access_token);
    await Share.share({ message: url, title: 'Lien bêta ProDay' });
  };

  return (
    <>
      <View style={styles.intro}>
        <Text style={styles.introTitle}>Programme bêta ProDay</Text>
        <Text style={styles.introBody}>
          Inscriptions depuis {ADMIN_SITE_URL}/beta · validation manuelle · lien d'accès personnel par
          testeur.
        </Text>
      </View>

      {!loading ? (
        <AdminKpiStrip
          items={[
            {
              key: 'pending',
              label: 'En attente',
              value: waitlistCounts.pending,
              icon: 'time',
              alert: waitlistCounts.pending > 0,
            },
            {
              key: 'approved',
              label: 'Approuvés',
              value: waitlistCounts.approved,
              icon: 'mail',
            },
            {
              key: 'rejected',
              label: 'Refusés',
              value: waitlistCounts.rejected,
              icon: 'warning',
            },
            {
              key: 'all',
              label: 'Total inscriptions',
              value: waitlistCounts.all,
              icon: 'people',
            },
          ]}
        />
      ) : null}

      <AdminSectionHeader title="Inscriptions waitlist" count={waitlistCounts.all} />

      {loading ? (
        <ActivityIndicator color={c.brand} style={{ marginVertical: spacing.lg }} />
      ) : (
        <>
          <AdminFilterChips
            options={WAITLIST_FILTERS.map((f) => ({
              id: f.id,
              label:
                f.id === 'all' ? f.label : `${f.label} (${waitlistCounts[f.id]})`,
            }))}
            value={waitlistFilter}
            onChange={setWaitlistFilter}
            compact
          />
          {filteredWaitlist.length === 0 ? (
            <AdminEmptyState
              icon="mail"
              title="Aucune inscription"
              subtitle={
                waitlistFilter === 'pending'
                  ? 'Les nouvelles inscriptions depuis proday75.fr apparaissent ici en attente de validation.'
                  : 'Aucune entrée pour ce filtre.'
              }
            />
          ) : (
            filteredWaitlist.map((entry) => (
              <AdminBetaWaitlistCard
                key={entry.id}
                entry={entry}
                meta={`${formatCalendarDate(entry.created_at)}${entry.welcome_email_sent ? ' · email envoyé' : ''}`}
                busy={actionEntryId === entry.id}
                onApprove={entry.status === 'pending' ? () => handleApprove(entry) : undefined}
                onReject={entry.status === 'pending' ? () => handleReject(entry) : undefined}
                onResend={entry.status === 'approved' ? () => handleResend(entry) : undefined}
                onShareLink={
                  entry.status === 'approved' && entry.access_token
                    ? () => void handleShareLink(entry)
                    : undefined
                }
                onDelete={() => handleDelete(entry)}
              />
            ))
          )}
        </>
      )}
    </>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    intro: {
      marginBottom: spacing.md,
      padding: spacing.md,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    introTitle: { fontSize: 15, fontWeight: '800', color: c.text, marginBottom: 4 },
    introBody: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  });
}
