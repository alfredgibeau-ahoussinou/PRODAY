import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useAdminData } from '../../../context/AdminDataContext';
import { useTranslation } from '../../../context/LocaleContext';
import { adminService } from '../../../services/admin.service';
import { recruitmentService } from '../../../services/recruitment.service';
import { sponsorUpgradeService } from '../../../services/sponsorUpgrade.service';
import type { SponsorUpgradeRequest, SponsorUpgradeRequestStatus } from '../../../models/SponsorUpgradeRequest';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminEntityCard } from '../../../components/admin/AdminEntityCard';
import { AdminSectionHeader } from '../../../components/admin/AdminSectionHeader';
import { AdminEmptyState } from '../../../components/admin/AdminEmptyState';
import { AdminFilterChips } from '../../../components/admin/AdminFilterChips';
import { AdminKpiStrip } from '../../../components/admin/AdminKpiStrip';
import { AdminPageHero } from '../../../components/admin/AdminPageHero';
import { AdminPlatformFeedPanel } from '../../../components/admin/AdminPlatformFeedPanel';
import { AdminSponsorQuotePanel } from '../../../components/admin/AdminSponsorQuotePanel';
import { adminConfirmDelete } from '../../../utils/adminConfirm';
import { formatCalendarDate } from '../../../utils/seasonCalendar';
import { useAdminStyles } from '../../../components/admin/adminStyles';
import type { AdminContentSegment } from '../../../navigation/adminTabConfig';
import { STAGE_APPLICATION_STATUS_LABEL } from '../../../services/stages.service';

type PlatformSegment = Extract<
  AdminContentSegment,
  'events' | 'mercato' | 'matches' | 'applications' | 'payments' | 'sponsors' | 'feed' | 'stages' | 'tournaments'
>;

const SEGMENTS: { id: PlatformSegment; label: string }[] = [
  { id: 'events', label: 'Événements' },
  { id: 'mercato', label: 'Mercato' },
  { id: 'matches', label: 'Matchs' },
  { id: 'applications', label: 'Candidatures' },
  { id: 'payments', label: 'Paiements' },
  { id: 'sponsors', label: 'Sponsors' },
  { id: 'feed', label: 'Annonces' },
  { id: 'stages', label: 'Stages' },
  { id: 'tournaments', label: 'Tournois' },
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
  const [stageOffers, setStageOffers] = useState<Awaited<ReturnType<typeof adminService.listAllStageOffers>>>([]);
  const [stageApplications, setStageApplications] = useState<
    Awaited<ReturnType<typeof adminService.listAllStageApplications>>
  >([]);
  const [tournaments, setTournaments] = useState<Awaited<ReturnType<typeof adminService.listAllTournaments>>>([]);

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

  const loadStageData = useCallback(async () => {
    const [offers, apps] = await Promise.all([
      adminService.listAllStageOffers(80),
      adminService.listAllStageApplications(100),
    ]);
    setStageOffers(offers);
    setStageApplications(apps);
  }, []);

  const loadTournaments = useCallback(async () => {
    setTournaments(await adminService.listAllTournaments(80));
  }, []);

  useEffect(() => {
    if (segment === 'stages') void loadStageData();
    if (segment === 'tournaments') void loadTournaments();
  }, [segment, loadStageData, loadTournaments]);

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
      <AdminPageHero
        kicker="PLATEFORME"
        title="Contenu live"
        subtitle="Événements · Mercato · Matchs · Paiements · Sponsors"
        actions={[
          { label: 'Événements', icon: 'calendar', onPress: () => handleSegment('events') },
          { label: 'Mercato', icon: 'briefcase', variant: 'ghost', onPress: () => handleSegment('mercato') },
        ]}
      />
      {stats ? (
        <AdminKpiStrip
          items={[
            {
              key: 'events',
              label: 'Événements',
              value: stats.teamEvents,
              icon: 'calendar',
              onPress: () => handleSegment('events'),
            },
            {
              key: 'posts',
              label: 'Annonces Mercato',
              value: stats.recruitmentPosts,
              icon: 'briefcase',
              onPress: () => handleSegment('mercato'),
            },
            {
              key: 'apps',
              label: 'Candidatures',
              value: stats.applications,
              icon: 'document',
              onPress: () => handleSegment('applications'),
            },
            {
              key: 'pay',
              label: 'Paiements pending',
              value: stats.pendingPayments,
              icon: 'bag',
              alert: stats.pendingPayments > 0,
              onPress: () => handleSegment('payments'),
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
                title={`${p.club_name}. ${p.position}`}
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
                title={`${m.requester_club_name} vs ${m.opponent_club_name ?? '. '}`}
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
                subtitle={a.cover_letter.slice(0, 100) || '…'}
                meta={`${a.status} · post ${a.post_id.slice(0, 8)}…`}
                primaryLabel={a.status === 'PENDING' || a.status === 'VIEWED' ? 'Accepter' : undefined}
                onPrimary={
                  a.status === 'PENDING' || a.status === 'VIEWED'
                    ? () =>
                        void recruitmentService
                          .updateApplicationStatus(a.id, 'ACCEPTED')
                          .then(() => refresh())
                          .catch((err) =>
                            Alert.alert('Erreur', err instanceof Error ? err.message : 'Action impossible'),
                          )
                    : undefined
                }
                secondaryLabel={a.status === 'PENDING' || a.status === 'VIEWED' ? 'Refuser' : undefined}
                onSecondary={
                  a.status === 'PENDING' || a.status === 'VIEWED'
                    ? () =>
                        void recruitmentService
                          .updateApplicationStatus(a.id, 'REJECTED')
                          .then(() => refresh())
                          .catch((err) =>
                            Alert.alert('Erreur', err instanceof Error ? err.message : 'Action impossible'),
                          )
                    : undefined
                }
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
          <AdminSponsorQuotePanel />
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

      {segment === 'feed' ? <AdminPlatformFeedPanel /> : null}

      {segment === 'stages' && (
        <>
          <AdminSectionHeader title="Offres de stage" count={stageOffers.length} />
          {stageOffers.length === 0 ? (
            <AdminEmptyState icon="calendar" title="Aucune offre" subtitle="Stages publiés par les clubs." />
          ) : (
            stageOffers.map((offer) => (
              <AdminEntityCard
                key={offer.id}
                icon="calendar"
                title={offer.title}
                subtitle={`${offer.club_name} · ${offer.city}`}
                meta={`${offer.status} · ${offer.spots_taken}/${offer.spots_total} places · ${formatCalendarDate(offer.start_date)}`}
                secondaryLabel={offer.status === 'OPEN' ? 'Clôturer' : 'Rouvrir'}
                onSecondary={() =>
                  adminService
                    .updateStageOfferStatus(offer.id, offer.status === 'OPEN' ? 'CLOSED' : 'OPEN')
                    .then(() => loadStageData())
                }
                onDelete={() =>
                  adminConfirmDelete('Supprimer', offer.title, () => adminService.deleteStageOffer(offer.id), loadStageData)
                }
              />
            ))
          )}
          <AdminSectionHeader title="Candidatures stage" count={stageApplications.length} />
          {stageApplications.length === 0 ? (
            <AdminEmptyState icon="document" title="Aucune candidature" subtitle="Postulations joueurs." />
          ) : (
            stageApplications.map((app) => (
              <AdminEntityCard
                key={app.id}
                icon="document"
                title={app.player_name}
                subtitle={app.message.slice(0, 100) || '…'}
                meta={`${STAGE_APPLICATION_STATUS_LABEL[app.status]} · stage ${app.stage_id.slice(0, 8)}…`}
                onDelete={() =>
                  adminConfirmDelete(
                    'Supprimer',
                    app.player_name,
                    () => adminService.deleteStageApplication(app.id),
                    loadStageData,
                  )
                }
              />
            ))
          )}
        </>
      )}

      {segment === 'tournaments' && (
        <>
          <AdminSectionHeader title="Tournois" count={tournaments.length} />
          {tournaments.length === 0 ? (
            <AdminEmptyState icon="star-four-points" title="Aucun tournoi" subtitle="Compétitions organisées." />
          ) : (
            tournaments.map((t) => (
              <AdminEntityCard
                key={t.id}
                icon="star-four-points"
                title={t.name}
                subtitle={t.city ?? '…'}
                meta={`${t.status ?? '. '} · org. ${t.organizer_uid.slice(0, 8)}… · ${formatCalendarDate(t.created_at)}`}
                onDelete={() =>
                  adminConfirmDelete('Supprimer', t.name, () => adminService.deleteTournament(t.id), loadTournaments)
                }
              />
            ))
          )}
        </>
      )}
    </AdminPageScaffold>
  );
};
