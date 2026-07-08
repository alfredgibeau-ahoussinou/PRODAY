import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Share } from 'react-native';
import {
  adminService,
  type BetaWaitlistEntry,
  type SubscriptionPurchase,
} from '../../services/admin.service';
import { adminAuditService } from '../../services/adminAudit.service';
import { useAuth } from '../../context/AuthContext';
import type { ShopOrder } from '../../models/ShopOrder';
import { AdminSectionHeader } from './AdminSectionHeader';
import { AdminEntityCard } from './AdminEntityCard';
import { AdminEmptyState } from './AdminEmptyState';
import { AdminFilterChips } from './AdminFilterChips';
import { AdminBetaWaitlistCard } from './AdminBetaWaitlistCard';
import { ADMIN_SITE_URL } from './AdminPlatformBrief';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { buildBetaProgrammeUrl } from '../../utils/betaWaitlistStatus';
import { getCallableErrorMessage } from '../../lib/firebaseFunctions';
import { useAdminStyles } from './adminStyles';
import { spacing } from '../../theme/designTokens';

type OpsSegment = 'waitlist' | 'subscriptions' | 'shop';
type WaitlistFilter = 'all' | 'pending' | 'approved' | 'rejected';

const SEGMENTS: { id: OpsSegment; label: string }[] = [
  { id: 'waitlist', label: 'Bêta testeurs' },
  { id: 'subscriptions', label: 'Abonnements' },
  { id: 'shop', label: 'Commandes shop' },
];

const WAITLIST_FILTERS: { id: WaitlistFilter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'pending', label: 'En attente' },
  { id: 'approved', label: 'Approuvés' },
  { id: 'rejected', label: 'Refusés' },
];

export const AdminOpsDataPanel: React.FC = () => {
  const { colors: c } = useAdminStyles();
  const { profile, firebaseUser } = useAuth();
  const [segment, setSegment] = useState<OpsSegment>('waitlist');
  const [waitlistFilter, setWaitlistFilter] = useState<WaitlistFilter>('pending');
  const [loading, setLoading] = useState(true);
  const [actionEntryId, setActionEntryId] = useState<string | null>(null);
  const [waitlist, setWaitlist] = useState<BetaWaitlistEntry[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionPurchase[]>([]);
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, s, o] = await Promise.all([
        adminService.listBetaWaitlist(100),
        adminService.listSubscriptionPurchases(100),
        adminService.listShopOrders(100),
      ]);
      setWaitlist(w);
      setSubscriptions(s);
      setShopOrders(o);
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

  const counts = useMemo(
    () => ({ waitlist: waitlist.length, subscriptions: subscriptions.length, shop: shopOrders.length }),
    [waitlist.length, subscriptions.length, shopOrders.length],
  );

  const runAction = async (entryId: string, action: () => Promise<void>) => {
    setActionEntryId(entryId);
    try {
      await action();
      await load();
    } catch (e) {
      Alert.alert('Erreur', getCallableErrorMessage(e));
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
      <AdminFilterChips options={SEGMENTS} value={segment} onChange={setSegment} />

      {loading ? (
        <ActivityIndicator color={c.brand} style={{ marginVertical: spacing.lg }} />
      ) : null}

      {!loading && segment === 'waitlist' ? (
        <>
          <AdminSectionHeader title="Inscriptions bêta" count={counts.waitlist} />
          <AdminFilterChips
            options={WAITLIST_FILTERS.map((f) => ({
              id: f.id,
              label:
                f.id === 'all'
                  ? f.label
                  : `${f.label} (${waitlistCounts[f.id]})`,
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
              />
            ))
          )}
        </>
      ) : null}

      {!loading && segment === 'subscriptions' ? (
        <>
          <AdminSectionHeader title="Achats abonnements" count={counts.subscriptions} />
          {subscriptions.length === 0 ? (
            <AdminEmptyState
              icon="bag"
              title="Aucun achat"
              subtitle="Historique App Store / Play (écriture serveur uniquement)."
            />
          ) : (
            subscriptions.map((purchase) => (
              <AdminEntityCard
                key={purchase.id}
                icon="bag"
                title={purchase.product_id}
                subtitle={`Utilisateur ${purchase.user_uid.slice(0, 10)}…`}
                meta={`${purchase.status}${purchase.amount_eur != null ? ` · ${purchase.amount_eur} €` : ''} · ${formatCalendarDate(purchase.created_at)}`}
              />
            ))
          )}
        </>
      ) : null}

      {!loading && segment === 'shop' ? (
        <>
          <AdminSectionHeader title="Commandes boutique" count={counts.shop} />
          {shopOrders.length === 0 ? (
            <AdminEmptyState icon="bag" title="Aucune commande" subtitle="Commandes ProDay Shop." />
          ) : (
            shopOrders.map((order) => (
              <AdminEntityCard
                key={order.id}
                icon="bag"
                title={`${order.total_eur} € · ${order.status}`}
                subtitle={`${order.product_line} · ${order.lines.length} article(s)`}
                meta={`Acheteur ${order.buyer_uid.slice(0, 10)}… · ${
                  order.created_at ? formatCalendarDate(order.created_at) : '—'
                }`}
              />
            ))
          )}
        </>
      ) : null}
    </>
  );
};
