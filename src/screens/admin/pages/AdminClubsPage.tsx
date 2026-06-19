import React, { useMemo, useState } from 'react';
import { useTranslation } from '../../../context/LocaleContext';
import { useAdminData } from '../../../context/AdminDataContext';
import { adminService } from '../../../services/admin.service';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminEntityCard } from '../../../components/admin/AdminEntityCard';
import { AdminSectionHeader } from '../../../components/admin/AdminSectionHeader';
import { AdminEmptyState } from '../../../components/admin/AdminEmptyState';
import { AdminFilterChips } from '../../../components/admin/AdminFilterChips';
import { adminConfirmDelete } from '../../../utils/adminConfirm';

type ClubsSegment = 'clubs' | 'announcements';

const SEGMENTS: { id: ClubsSegment; label: string }[] = [
  { id: 'clubs', label: 'Clubs' },
  { id: 'announcements', label: 'Annonces' },
];

export const AdminClubsPage: React.FC = () => {
  const { t } = useTranslation();
  const { loading, clubs, announcements, refresh } = useAdminData();
  const [segment, setSegment] = useState<ClubsSegment>('clubs');

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
