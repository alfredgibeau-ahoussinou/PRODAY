import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useAdminData } from '../../../context/AdminDataContext';
import { adminService } from '../../../services/admin.service';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminEntityCard } from '../../../components/admin/AdminEntityCard';
import { AdminSectionHeader } from '../../../components/admin/AdminSectionHeader';
import { AdminEmptyState } from '../../../components/admin/AdminEmptyState';
import { adminConfirmDelete } from '../../../utils/adminConfirm';
import { formatCalendarDate } from '../../../utils/seasonCalendar';
import { CarpoolFilterChips } from '../../../components/carpool/carpoolUi';
import { ProDayText } from '../../../components/ui/ProDayText';
import type { CommunityReelStatus } from '../../../models/CommunityReel';

type ContentSegment =
  | 'reels'
  | 'reports'
  | 'events'
  | 'mercato'
  | 'matches'
  | 'applications'
  | 'payments'
  | 'sponsors';

const SEGMENTS: { id: ContentSegment; label: string }[] = [
  { id: 'reels', label: 'Reels' },
  { id: 'reports', label: 'Signalements' },
  { id: 'events', label: 'Événements' },
  { id: 'mercato', label: 'Mercato' },
  { id: 'matches', label: 'Matchs' },
  { id: 'applications', label: 'Candidatures' },
  { id: 'payments', label: 'Paiements' },
  { id: 'sponsors', label: 'Sponsors' },
];

const REEL_FILTERS: { id: CommunityReelStatus | 'all'; label: string }[] = [
  { id: 'pending', label: 'En attente' },
  { id: 'approved', label: 'Publiés' },
  { id: 'rejected', label: 'Refusés' },
  { id: 'all', label: 'Tous' },
];

const STATUS_LABEL: Record<CommunityReelStatus, string> = {
  pending: 'En attente',
  approved: 'Publié',
  rejected: 'Refusé',
};

export const AdminContentPage: React.FC = () => {
  const {
    loading,
    events,
    posts,
    matches,
    applications,
    sponsorOffers,
    fundingGoals,
    payments,
    communityReels,
    reelReports,
    refresh,
  } = useAdminData();
  const [segment, setSegment] = useState<ContentSegment>('reels');
  const [reelFilter, setReelFilter] = useState<CommunityReelStatus | 'all'>('pending');

  const filteredReels = useMemo(() => {
    if (reelFilter === 'all') return communityReels;
    return communityReels.filter((r) => r.status === reelFilter);
  }, [communityReels, reelFilter]);

  return (
    <AdminPageScaffold
      title="Modération & contenu"
      subtitle="Reels ProDay · signalements · mercato · événements"
      loading={loading}
    >
      <CarpoolFilterChips options={SEGMENTS} value={segment} onChange={setSegment} />

      {segment === 'reels' ? (
        <>
          <View style={{ marginBottom: 8 }}>
            <CarpoolFilterChips options={REEL_FILTERS} value={reelFilter} onChange={setReelFilter} />
          </View>
          <AdminSectionHeader title="REELS COMMUNAUTÉ" count={filteredReels.length} />
          {filteredReels.length === 0 ? (
            <AdminEmptyState
              icon="time"
              title="Aucun reel"
              subtitle="Les publications soumises par les joueurs apparaissent ici avant diffusion."
            />
          ) : (
            filteredReels.map((reel) => (
              <AdminEntityCard
                key={reel.id}
                icon="time"
                title={reel.author_name}
                subtitle={reel.caption || 'Sans légende'}
                meta={`${STATUS_LABEL[reel.status]} · ${reel.theme} · ${formatCalendarDate(reel.created_at)}`}
                primaryLabel={reel.status === 'pending' ? 'Approuver' : undefined}
                onPrimary={
                  reel.status === 'pending'
                    ? () =>
                        adminService
                          .updateCommunityReelStatus(reel.id, 'approved')
                          .then(() => refresh())
                    : undefined
                }
                secondaryLabel={reel.status !== 'rejected' ? 'Refuser' : undefined}
                onSecondary={
                  reel.status !== 'rejected'
                    ? () =>
                        adminService
                          .updateCommunityReelStatus(reel.id, 'rejected')
                          .then(() => refresh())
                    : undefined
                }
                onDelete={() =>
                  adminConfirmDelete(
                    'Supprimer le reel',
                    reel.caption.slice(0, 40) || reel.author_name,
                    () => adminService.deleteCommunityReel(reel.id),
                    refresh
                  )
                }
              />
            ))
          )}
        </>
      ) : null}

      {segment === 'reports' ? (
        <>
          <AdminSectionHeader title="SIGNALEMENTS REELS" count={reelReports.length} />
          {reelReports.length === 0 ? (
            <AdminEmptyState
              icon="warning"
              title="Aucun signalement"
              subtitle="Les utilisateurs peuvent signaler un reel depuis le fil."
            />
          ) : (
            reelReports.map((report) => (
              <AdminEntityCard
                key={report.id}
                icon="warning"
                title={report.reason}
                subtitle={report.source_url}
                meta={`${report.bookmark_key.slice(0, 24)}… · ${formatCalendarDate(report.created_at)}`}
                onDelete={() =>
                  adminConfirmDelete(
                    'Archiver le signalement',
                    report.reason,
                    () => adminService.deleteReelReport(report.id),
                    refresh
                  )
                }
              />
            ))
          )}
        </>
      ) : null}

      {segment === 'events' && (
        <>
          <AdminSectionHeader title="ÉVÉNEMENTS SAISON" count={events.length} />
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
          <AdminSectionHeader title="ANNONCES MERCATO" count={posts.length} />
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
          <AdminSectionHeader title="MATCHS AMICAUX" count={matches.length} />
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
          <AdminSectionHeader title="CANDIDATURES MERCATO" count={applications.length} />
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
          <AdminSectionHeader title="DEMANDES DE PAIEMENT CLUB" count={payments.length} />
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
          <AdminSectionHeader title="OFFRES SPONSORS" count={sponsorOffers.length} />
          {sponsorOffers.length === 0 ? (
            <AdminEmptyState icon="star" title="Aucune offre" subtitle="Offres partenaires." />
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
          <AdminSectionHeader title="CAMPAGNES FINANCEMENT" count={fundingGoals.length} />
          {fundingGoals.length === 0 ? (
            <ProDayText variant="caption" muted style={{ marginBottom: 12 }}>
              Aucune campagne de financement club.
            </ProDayText>
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
