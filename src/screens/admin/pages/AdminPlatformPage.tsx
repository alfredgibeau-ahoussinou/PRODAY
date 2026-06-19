import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useAdminData } from '../../../context/AdminDataContext';
import { useTranslation } from '../../../context/LocaleContext';
import { adminService } from '../../../services/admin.service';
import { sponsorUpgradeService } from '../../../services/sponsorUpgrade.service';
import type { SponsorUpgradeRequest, SponsorUpgradeRequestStatus } from '../../../models/SponsorUpgradeRequest';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminEntityCard } from '../../../components/admin/AdminEntityCard';
import { AdminSectionHeader } from '../../../components/admin/AdminSectionHeader';
import { AdminEmptyState } from '../../../components/admin/AdminEmptyState';
import { AdminFilterChips } from '../../../components/admin/AdminFilterChips';
import { AdminKpiStrip } from '../../../components/admin/AdminKpiStrip';
import { adminConfirmDelete } from '../../../utils/adminConfirm';
import { formatCalendarDate } from '../../../utils/seasonCalendar';
import { useAdminStyles } from '../../../components/admin/adminStyles';
import type { AdminContentSegment } from '../../../navigation/adminTabConfig';

type PlatformSegment = Extract<
  AdminContentSegment,
  'events' | 'mercato' | 'matches' | 'applications' | 'payments' | 'sponsors'
>;

const SEGMENTS: { id: PlatformSegment; label: string }[] = [
  { id: 'events', label: 'Événements' },
  { id: 'mercato', label: 'Mercato' },
  { id: 'matches', label: 'Matchs' },
  { id: 'applications', label: 'Candidatures' },
  { id: 'payments', label: 'Paiements' },
  { id: 'sponsors', label: 'Sponsors' },
];

interface AdminPlatformPageProps {
  activeSegment?: AdminContentSegment;
  onSegmentChange?: (segment: AdminContentSegment) => void;
}

export const AdminPlatformPage: React.FC<AdminPlatformPageProps> = ({
  activeSegment,
  onSegmentChange,
}) => {
  const { colors: c } = useAdminStyles();
  const { t } = useTranslation();
  const {
    loading,
    stats,
    events,
    posts,
    matches,
    applications,
    sponsorOffers,
    fundingGoals,
    payments,
    refresh,
  } = useAdminData();
  const [segment, setSegment] = useState<PlatformSegment>(
    (activeSegment as PlatformSegment) ?? 'events',
  );
  const [upgradeRequests, setUpgradeRequests] = useState<SponsorUpgradeRequest[]>([]);

  useEffect(() => {
    if (!activeSegment) return;
    if (SEGMENTS.some((s) => s.id === activeSegment)) {
      setSegment(activeSegment as PlatformSegment);
    }
  }, [activeSegment]);

  useEffect(() => {
    if (segment !== 'sponsors') return;
    void sponsorUpgradeService.listActiveForAdmin(20).then(setUpgradeRequests);
  }, [segment, sponsorOffers.length]);

  const refreshUpgradeRequests = useCallback(() => {
    void sponsorUpgradeService.listActiveForAdmin(20).then(setUpgradeRequests);
  }, []);

  const statusLabel = (status: SponsorUpgradeRequestStatus) => {
    switch (status) {
      case 'contacted':
        return t('admin.upgrade.status.contacted');
      case 'approved':
        return t('admin.upgrade.status.approved');
      case 'rejected':
        return t('admin.upgrade.status.rejected');
      default:
        return t('admin.upgrade.status.pending');
    }
  };

  const runUpgradeAction = async (
    request: SponsorUpgradeRequest,
    action: 'contacted' | 'approved' | 'rejected',
  ) => {
    const res =
      action === 'contacted'
        ? await sponsorUpgradeService.markContacted(request.id)
        : action === 'approved'
          ? await sponsorUpgradeService.approveRequest(request.id)
          : await sponsorUpgradeService.rejectRequest(request.id);

    if (!res.ok) {
      Alert.alert(t('admin.upgrade.section'), t(res.messageKey));
      return;
    }
    Alert.alert(t('admin.upgrade.section'), t(res.messageKey));
    refreshUpgradeRequests();
  };

  const confirmReject = (request: SponsorUpgradeRequest) => {
    Alert.alert(
      t('admin.upgrade.confirm.reject.title'),
      t('admin.upgrade.confirm.reject.message', { company: request.company }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.upgrade.action.reject'),
          style: 'destructive',
          onPress: () => void runUpgradeAction(request, 'rejected'),
        },
      ],
    );
  };

  const handleSegment = (next: PlatformSegment) => {
    setSegment(next);
    onSegmentChange?.(next);
  };

  return (
    <AdminPageScaffold loading={loading}>
      {stats ? (
        <AdminKpiStrip
          items={[
            {
              key: 'events',
              label: 'Événements',
              value: stats.teamEvents,
              icon: 'calendar',
            },
            {
              key: 'posts',
              label: 'Annonces Mercato',
              value: stats.recruitmentPosts,
              icon: 'briefcase',
            },
            {
              key: 'apps',
              label: 'Candidatures',
              value: stats.applications,
              icon: 'document',
            },
            {
              key: 'pay',
              label: 'Paiements pending',
              value: stats.pendingPayments,
              icon: 'bag',
              alert: stats.pendingPayments > 0,
            },
          ]}
        />
      ) : null}

      <AdminFilterChips options={SEGMENTS} value={segment} onChange={handleSegment} />

      {segment === 'events' && (
        <>
          <AdminSectionHeader title="Événements saison" count={events.length} />
          {events.length === 0 ? (
            <AdminEmptyState icon="calendar" title="Aucun événement" subtitle="Convocations et détections." />
          ) : (
            events.map((e) => (
              <AdminEntityCard
                key={e.id}
                icon="calendar"
                title={e.title}
                subtitle={`${e.event_type} · ${formatCalendarDate(e.starts_at)}`}
                meta={`${e.city} · ${e.organizer_name}`}
                onDelete={() =>
                  adminConfirmDelete('Supprimer', e.title, () => adminService.deleteTeamEvent(e.id), refresh)
                }
              />
            ))
          )}
        </>
      )}

      {segment === 'mercato' && (
        <>
          <AdminSectionHeader title="Annonces Mercato" count={posts.length} />
          {posts.length === 0 ? (
            <AdminEmptyState icon="briefcase" title="Aucune annonce" subtitle="Posts de recrutement." />
          ) : (
            posts.map((p) => (
              <AdminEntityCard
                key={p.id}
                icon="briefcase"
                title={`${p.club_name} — ${p.position}`}
                subtitle={`${p.city} · ${p.category}`}
                meta={`Statut : ${p.status}`}
                secondaryLabel={p.status === 'OPEN' ? 'Clôturer' : 'Rouvrir'}
                onSecondary={() =>
                  adminService
                    .updateRecruitmentPost(p.id, p.status === 'OPEN' ? 'CLOSED' : 'OPEN')
                    .then(() => refresh())
                }
                onDelete={() =>
                  adminConfirmDelete('Supprimer', p.club_name, () => adminService.deleteRecruitmentPost(p.id), refresh)
                }
              />
            ))
          )}
        </>
      )}

      {segment === 'matches' && (
        <>
          <AdminSectionHeader title="Matchs amicaux" count={matches.length} />
          {matches.length === 0 ? (
            <AdminEmptyState icon="handshake" title="Aucun match" subtitle="Propositions de matchs amicaux." />
          ) : (
            matches.map((m) => (
              <AdminEntityCard
                key={m.id}
                icon="handshake"
                title={`${m.requester_club_name} vs ${m.opponent_club_name ?? '—'}`}
                subtitle={formatCalendarDate(m.date)}
                meta={`${m.city} · ${m.status}`}
                onDelete={() =>
                  adminConfirmDelete('Supprimer', 'Match amical', () => adminService.deleteFriendlyMatch(m.id), refresh)
                }
              />
            ))
          )}
        </>
      )}

      {segment === 'applications' && (
        <>
          <AdminSectionHeader title="Candidatures Mercato" count={applications.length} />
          {applications.length === 0 ? (
            <AdminEmptyState icon="document" title="Aucune candidature" subtitle="Postulations joueurs." />
          ) : (
            applications.map((a) => (
              <AdminEntityCard
                key={a.id}
                icon="document"
                title={a.player_name ?? a.player_uid}
                subtitle={a.cover_letter.slice(0, 100) || '—'}
                meta={`${a.status} · post ${a.post_id.slice(0, 8)}…`}
                onDelete={() =>
                  adminConfirmDelete('Supprimer', 'Candidature', () => adminService.deleteApplication(a.id), refresh)
                }
              />
            ))
          )}
        </>
      )}

      {segment === 'payments' && (
        <>
          <AdminSectionHeader title="Paiements club" count={payments.length} />
          {payments.length === 0 ? (
            <AdminEmptyState icon="bag" title="Aucun paiement" subtitle="Cotisations et frais d’équipe." />
          ) : (
            payments.map((pay) => (
              <AdminEntityCard
                key={pay.id}
                icon="bag"
                title={pay.label}
                subtitle={`${pay.member_name} · ${pay.amount_eur} €`}
                meta={`Échéance ${formatCalendarDate(pay.due_at)} · ${pay.status}`}
                secondaryLabel={pay.status === 'pending' ? 'Marquer payé' : undefined}
                onSecondary={
                  pay.status === 'pending'
                    ? () => adminService.updatePaymentStatus(pay.id, 'paid').then(() => refresh())
                    : undefined
                }
                onDelete={() =>
                  adminConfirmDelete('Supprimer', pay.label, () => adminService.deletePaymentRequest(pay.id), refresh)
                }
              />
            ))
          )}
        </>
      )}

      {segment === 'sponsors' && (
        <>
          <AdminSectionHeader title={t('admin.upgrade.section')} count={upgradeRequests.length} />
          {upgradeRequests.length === 0 ? (
            <AdminEmptyState
              icon="mail"
              title={t('admin.upgrade.empty.title')}
              subtitle={t('admin.upgrade.empty.subtitle')}
            />
          ) : (
            upgradeRequests.map((r) => (
              <AdminEntityCard
                key={r.id}
                icon="mail"
                title={r.company}
                subtitle={`${r.city} · ${r.tier}`}
                meta={`${statusLabel(r.status)} · ${formatCalendarDate(r.created_at)}`}
                primaryLabel={
                  r.status === 'pending' ? t('admin.upgrade.action.contact') : t('admin.upgrade.action.approve')
                }
                onPrimary={() =>
                  void runUpgradeAction(r, r.status === 'pending' ? 'contacted' : 'approved')
                }
                secondaryLabel={t('admin.upgrade.action.reject')}
                onSecondary={() => confirmReject(r)}
              />
            ))
          )}
          <AdminSectionHeader title="Offres sponsors" count={sponsorOffers.length} />
          {sponsorOffers.length === 0 ? (
            <AdminEmptyState icon="star" title="Aucune offre" subtitle="Offres sponsors." />
          ) : (
            sponsorOffers.map((o) => (
              <AdminEntityCard
                key={o.id}
                icon="star"
                title={o.company_name}
                subtitle={`${o.city} · ${o.offer_type}`}
                meta={o.active ? 'Active' : 'Inactive'}
                onDelete={() =>
                  adminConfirmDelete('Supprimer', o.company_name, () => adminService.deleteSponsorOffer(o.id), refresh)
                }
              />
            ))
          )}
          <AdminSectionHeader title="Campagnes financement" count={fundingGoals.length} />
          {fundingGoals.length === 0 ? (
            <Text style={{ color: c.textMuted, fontSize: 13, marginBottom: 12 }}>
              Aucune campagne de financement club.
            </Text>
          ) : (
            fundingGoals.map((g) => (
              <AdminEntityCard
                key={g.id}
                icon="business"
                title={g.title}
                subtitle={g.club_id}
                meta={`${g.raised_amount_eur} € / ${g.target_amount_eur} €`}
                onDelete={() =>
                  adminConfirmDelete('Supprimer', g.title, () => adminService.deleteFundingGoal(g.id), refresh)
                }
              />
            ))
          )}
        </>
      )}
    </AdminPageScaffold>
  );
};
