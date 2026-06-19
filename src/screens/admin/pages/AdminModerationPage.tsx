import React, { useEffect, useMemo, useState } from 'react';
import { useAdminData } from '../../../context/AdminDataContext';
import { useAuth } from '../../../context/AuthContext';
import { adminService } from '../../../services/admin.service';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminEntityCard } from '../../../components/admin/AdminEntityCard';
import { AdminReelModerationCard } from '../../../components/admin/AdminReelModerationCard';
import { AdminMessagesPanel } from '../../../components/admin/AdminMessagesPanel';
import { AdminSectionHeader } from '../../../components/admin/AdminSectionHeader';
import { AdminEmptyState } from '../../../components/admin/AdminEmptyState';
import { AdminFilterChips } from '../../../components/admin/AdminFilterChips';
import { AdminWeeklyQuestionPanel } from '../../../components/admin/AdminWeeklyQuestionPanel';
import { AdminKpiStrip } from '../../../components/admin/AdminKpiStrip';
import { adminConfirmDelete } from '../../../utils/adminConfirm';
import { formatCalendarDate } from '../../../utils/seasonCalendar';
import type { CommunityReelStatus } from '../../../models/CommunityReel';
import type { AdminContentSegment } from '../../../navigation/adminTabConfig';

type ModerationSegment = Extract<AdminContentSegment, 'reels' | 'reports' | 'weekly' | 'messages'>;

const SEGMENTS: { id: ModerationSegment; label: string }[] = [
  { id: 'reels', label: 'Reels' },
  { id: 'reports', label: 'Signalements' },
  { id: 'weekly', label: 'Question fil' },
  { id: 'messages', label: 'Messages' },
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

interface AdminModerationPageProps {
  activeSegment?: AdminContentSegment;
  onSegmentChange?: (segment: AdminContentSegment) => void;
}

export const AdminModerationPage: React.FC<AdminModerationPageProps> = ({
  activeSegment,
  onSegmentChange,
}) => {
  const { profile, firebaseUser } = useAuth();
  const actor = useMemo(
    () => ({ uid: profile?.uid ?? '', email: firebaseUser?.email ?? profile?.email }),
    [profile, firebaseUser],
  );
  const { loading, stats, communityReels, reelReports, refresh } = useAdminData();
  const [segment, setSegment] = useState<ModerationSegment>(
    (activeSegment as ModerationSegment) ?? 'reels',
  );
  const [reelFilter, setReelFilter] = useState<CommunityReelStatus | 'all'>('pending');
  const [playingReelId, setPlayingReelId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeSegment) return;
    if (['reels', 'reports', 'weekly', 'messages'].includes(activeSegment)) {
      setSegment(activeSegment as ModerationSegment);
    }
  }, [activeSegment]);

  const handleSegment = (next: ModerationSegment) => {
    setSegment(next);
    onSegmentChange?.(next);
  };

  const filteredReels = useMemo(() => {
    if (reelFilter === 'all') return communityReels;
    return communityReels.filter((r) => r.status === reelFilter);
  }, [communityReels, reelFilter]);

  return (
    <AdminPageScaffold loading={loading}>
      {stats ? (
        <AdminKpiStrip
          items={[
            {
              key: 'reels',
              label: 'Reels en attente',
              value: stats.pendingCommunityReels,
              icon: 'warning',
              alert: stats.pendingCommunityReels > 0,
            },
            {
              key: 'reports',
              label: 'Signalements',
              value: stats.reelReports,
              icon: 'warning',
              alert: stats.reelReports > 0,
            },
            {
              key: 'approved',
              label: 'Reels publiés',
              value: communityReels.filter((r) => r.status === 'approved').length,
              icon: 'time',
            },
            {
              key: 'total',
              label: 'Total reels',
              value: communityReels.length,
              icon: 'document',
            },
          ]}
        />
      ) : null}

      <AdminFilterChips options={SEGMENTS} value={segment} onChange={handleSegment} />

      {segment === 'reels' ? (
        <>
          <AdminFilterChips options={REEL_FILTERS} value={reelFilter} onChange={setReelFilter} compact />
          <AdminSectionHeader title="Reels communauté" count={filteredReels.length} />
          {filteredReels.length === 0 ? (
            <AdminEmptyState
              icon="time"
              title="Aucun reel"
              subtitle="Les publications soumises par les joueurs apparaissent ici avant diffusion."
            />
          ) : (
            filteredReels.map((reel) => (
              <AdminReelModerationCard
                key={reel.id}
                reel={reel}
                statusLabel={STATUS_LABEL[reel.status]}
                meta={`${reel.theme} · ${formatCalendarDate(reel.created_at)}`}
                playing={playingReelId === reel.id}
                onTogglePlay={() =>
                  setPlayingReelId((prev) => (prev === reel.id ? null : reel.id))
                }
                onApprove={
                  reel.status === 'pending'
                    ? () =>
                        adminService
                          .updateCommunityReelStatus(reel.id, 'approved', actor)
                          .then(() => refresh())
                    : undefined
                }
                onReject={
                  reel.status !== 'rejected'
                    ? () =>
                        adminService
                          .updateCommunityReelStatus(reel.id, 'rejected', actor)
                          .then(() => refresh())
                    : undefined
                }
                onDelete={() =>
                  adminConfirmDelete(
                    'Supprimer le reel',
                    reel.caption.slice(0, 40) || reel.author_name,
                    () => adminService.deleteCommunityReel(reel.id, actor),
                    refresh,
                  )
                }
              />
            ))
          )}
        </>
      ) : null}

      {segment === 'reports' ? (
        <>
          <AdminSectionHeader title="Signalements reels" count={reelReports.length} />
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
                    refresh,
                  )
                }
              />
            ))
          )}
        </>
      ) : null}

      {segment === 'weekly' ? <AdminWeeklyQuestionPanel /> : null}
      {segment === 'messages' ? <AdminMessagesPanel /> : null}
    </AdminPageScaffold>
  );
};
