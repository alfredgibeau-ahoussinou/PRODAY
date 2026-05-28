import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useAdminData } from '../../../context/AdminDataContext';
import { adminService } from '../../../services/admin.service';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminEntityCard } from '../../../components/admin/AdminEntityCard';
import { AdminSectionHeader } from '../../../components/admin/AdminSectionHeader';
import { AdminEmptyState } from '../../../components/admin/AdminEmptyState';
import { adminConfirmDelete } from '../../../utils/adminConfirm';
import { formatCalendarDate } from '../../../utils/seasonCalendar';
import { colors, spacing, radius } from '../../../theme/designTokens';

type ContentSegment =
  | 'events'
  | 'mercato'
  | 'matches'
  | 'arena'
  | 'applications'
  | 'sponsors';

const SEGMENTS: { id: ContentSegment; label: string }[] = [
  { id: 'events', label: 'Événements' },
  { id: 'mercato', label: 'Mercato' },
  { id: 'matches', label: 'Matchs' },
  { id: 'arena', label: 'Arena' },
  { id: 'applications', label: 'Candidatures' },
  { id: 'sponsors', label: 'Sponsors' },
];

export const AdminContentPage: React.FC = () => {
  const { loading, events, posts, matches, tournaments, applications, sponsorOffers, fundingGoals, refresh } =
    useAdminData();
  const [segment, setSegment] = useState<ContentSegment>('events');

  return (
    <AdminPageScaffold
      title="Contenu plateforme"
      subtitle="Événements · mercato · matchs · arena · candidatures · sponsors"
      loading={loading}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.segments}>
        {SEGMENTS.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.pill, segment === s.id && styles.pillOn]}
            onPress={() => setSegment(s.id)}
          >
            <Text style={[styles.pillText, segment === s.id && styles.pillTextOn]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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

      {segment === 'arena' && (
        <>
          <AdminSectionHeader title="TOURNOIS ARENA" count={tournaments.length} />
          {tournaments.length === 0 ? (
            <AdminEmptyState icon="trophy" title="Aucun tournoi" subtitle="Tournois Arena." />
          ) : (
            tournaments.map((t) => (
              <AdminEntityCard
                key={t.id}
                icon="trophy"
                title={t.name}
                subtitle={`${t.city} · ${formatCalendarDate(t.date_start)}`}
                meta={`${t.status} · ${t.subscriber_uids?.length ?? 0} club(s)`}
                onDelete={() =>
                  adminConfirmDelete('Supprimer', t.name, () => adminService.deleteTournament(t.id), refresh)
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
            <AdminEmptyState icon="business" title="Aucune campagne" subtitle="Objectifs financement club." />
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

const styles = StyleSheet.create({
  segments: { maxHeight: 44, marginBottom: spacing.md },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  pillOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  pillText: { fontSize: 12, fontWeight: '800', color: colors.text },
  pillTextOn: { color: colors.brandInverse },
});
