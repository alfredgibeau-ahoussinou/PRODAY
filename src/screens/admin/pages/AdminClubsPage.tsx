import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../../context/LocaleContext';
import { useAdminData } from '../../../context/AdminDataContext';
import { adminService, type AdminTeam } from '../../../services/admin.service';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminEntityCard } from '../../../components/admin/AdminEntityCard';
import { AdminSectionHeader } from '../../../components/admin/AdminSectionHeader';
import { AdminEmptyState } from '../../../components/admin/AdminEmptyState';
import { AdminFilterChips } from '../../../components/admin/AdminFilterChips';
import { adminConfirmDelete } from '../../../utils/adminConfirm';

type ClubsSegment = 'clubs' | 'teams' | 'announcements';

const SEGMENTS: { id: ClubsSegment; label: string }[] = [
  { id: 'clubs', label: 'Clubs' },
  { id: 'teams', label: 'Équipes' },
  { id: 'announcements', label: 'Annonces' },
];

export const AdminClubsPage: React.FC = () => {
  const { t } = useTranslation();
  const { loading, clubs, announcements, refresh } = useAdminData();
  const [segment, setSegment] = useState<ClubsSegment>('clubs');
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  const loadTeams = useCallback(async () => {
    setTeamsLoading(true);
    try {
      setTeams(await adminService.listAllTeams(120));
    } finally {
      setTeamsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (segment === 'teams') void loadTeams();
  }, [segment, loadTeams]);

  return (
    <AdminPageScaffold loading={loading}>
      <AdminFilterChips options={SEGMENTS} value={segment} onChange={setSegment} />

      {segment === 'clubs' && (
        <>
          <AdminSectionHeader title="Clubs" count={clubs.length} />
          {clubs.length === 0 ? (
            <AdminEmptyState icon="business" title={t('admin.clubs.empty')} subtitle={t('admin.clubs.emptySub')} />
          ) : (
            clubs.map((club) => (
              <AdminEntityCard
                key={club.id}
                icon="business"
                title={club.name}
                subtitle={`${club.city}${club.verified ? t('admin.clubs.verified') : ''}`}
                meta={`${club.categories.join(', ') || '—'} · owner ${club.owner_uid.slice(0, 8)}…`}
                primaryLabel={club.verified ? 'Retirer badge' : 'Vérifier'}
                onPrimary={() =>
                  void adminService
                    .updateClubVerified(club.id, !club.verified)
                    .then(() => refresh())
                }
                onDelete={() =>
                  adminConfirmDelete('Supprimer le club', club.name, () => adminService.deleteClub(club.id), refresh)
                }
              />
            ))
          )}
        </>
      )}

      {segment === 'teams' && (
        <>
          <AdminSectionHeader title="Équipes" count={teams.length} />
          {teamsLoading ? null : teams.length === 0 ? (
            <AdminEmptyState icon="people" title="Aucune équipe" subtitle="Équipes rattachées aux clubs." />
          ) : (
            teams.map((team) => (
              <AdminEntityCard
                key={team.id}
                icon="people"
                title={team.name}
                subtitle={`Club ${team.club_id.slice(0, 10)}…`}
                meta={team.category ?? '—'}
                onDelete={() =>
                  adminConfirmDelete('Supprimer', team.name, () => adminService.deleteTeam(team.id), loadTeams)
                }
              />
            ))
          )}
        </>
      )}

      {segment === 'announcements' && (
        <>
          <AdminSectionHeader title="Annonces club" count={announcements.length} />
          {announcements.length === 0 ? (
            <AdminEmptyState icon="notifications" title={t('admin.clubs.postsEmpty')} subtitle={t('admin.clubs.postsEmptySub')} />
          ) : (
            announcements.map((a) => (
              <AdminEntityCard
                key={a.id}
                icon="notifications"
                title={a.title}
                subtitle={a.body.slice(0, 80)}
                meta={`${a.author_name} · ${a.club_id.slice(0, 8)}…`}
                onDelete={() =>
                  adminConfirmDelete('Supprimer', a.title, () => adminService.deleteClubAnnouncement(a.id), refresh)
                }
              />
            ))
          )}
        </>
      )}
    </AdminPageScaffold>
  );
};
