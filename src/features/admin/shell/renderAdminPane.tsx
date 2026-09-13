import React from 'react';
import type { AdminNavSectionId } from '../navigation/adminNavConfig';
import { AdminUsersPane } from '../panes/AdminUsersPane';
import { AdminClubsPane } from '../panes/AdminClubsPane';
import { AdminRosterDataPane } from '../panes/AdminRosterDataPane';
import { AdminStandingsPane } from '../panes/AdminStandingsPane';
import {
  AdminOverviewPane,
  AdminQueuePane,
  AdminHealthPane,
  AdminAuditPane,
  AdminUserCreatePane,
  AdminClubCreatePane,
  AdminVerificationsPane,
  AdminMembershipsPane,
  AdminBetaPane,
  AdminTeamsPane,
  AdminCamerasPane,
  AdminClaimsPane,
  AdminDirectoryPane,
  AdminSyncJobsPane,
  AdminPaymentsPane,
  AdminSubscriptionsPane,
  AdminQuotesPane,
  AdminShopPane,
  AdminSponsorsPane,
  AdminReelsPane,
  AdminFeedPane,
  AdminMessagesPane,
  AdminStagesPane,
  AdminRecruitmentPane,
  AdminConfigPane,
  AdminTrafficPane,
  AdminTournamentsPane,
} from '../panes/AdminOpsPanes';
import { AdminSponsorQuotesPane } from '../panes/AdminSponsorQuotesPane';
import { AdminSystemScreen } from '../../../screens/admin';

type Props = {
  section: AdminNavSectionId;
  focusId?: string;
  onNavigate: (section: AdminNavSectionId, focusId?: string) => void;
  onPreviewUserApp: () => void;
  onPreviewPresidentPole?: () => void;
};

export function renderAdminPane({
  section,
  focusId,
  onNavigate,
  onPreviewUserApp,
  onPreviewPresidentPole,
}: Props) {
  switch (section) {
    case 'overview':
      return <AdminOverviewPane onNavigate={onNavigate} />;
    case 'queue':
      return <AdminQueuePane onNavigate={onNavigate} />;
    case 'health':
      return <AdminHealthPane />;
    case 'audit':
      return <AdminAuditPane />;
    case 'users':
      return (
        <AdminUsersPane
          focusId={focusId}
          onPreviewPresidentPole={onPreviewPresidentPole}
          onPreviewUserApp={onPreviewUserApp}
        />
      );
    case 'user_create':
      return (
        <AdminUserCreatePane
          onPreviewPresidentPole={onPreviewPresidentPole}
          onPreviewUserApp={onPreviewUserApp}
        />
      );
    case 'verifications':
      return <AdminVerificationsPane focusId={focusId} />;
    case 'memberships':
      return <AdminMembershipsPane focusId={focusId} />;
    case 'beta':
      return <AdminBetaPane />;
    case 'clubs':
      return <AdminClubsPane focusId={focusId} />;
    case 'club_create':
      return <AdminClubCreatePane />;
    case 'teams':
      return <AdminTeamsPane />;
    case 'cameras':
      return <AdminCamerasPane />;
    case 'claims':
      return <AdminClaimsPane focusId={focusId} />;
    case 'effectifs':
      return <AdminRosterDataPane />;
    case 'classements':
      return <AdminStandingsPane />;
    case 'directory':
      return <AdminDirectoryPane />;
    case 'sync':
      return <AdminSyncJobsPane />;
    case 'payments':
      return <AdminPaymentsPane />;
    case 'subscriptions':
      return <AdminSubscriptionsPane onNavigate={onNavigate} />;
    case 'quotes':
      return <AdminQuotesPane onNavigate={onNavigate} />;
    case 'sponsor_quotes':
      return <AdminSponsorQuotesPane focusId={focusId} />;
    case 'shop':
      return <AdminShopPane />;
    case 'sponsors':
      return <AdminSponsorsPane onNavigate={onNavigate} />;
    case 'reels':
      return <AdminReelsPane />;
    case 'feed':
      return <AdminFeedPane />;
    case 'messages':
      return <AdminMessagesPane />;
    case 'stages':
      return <AdminStagesPane />;
    case 'recruitment':
      return <AdminRecruitmentPane />;
    case 'config':
      return <AdminSystemScreen />;
    case 'traffic':
      return <AdminTrafficPane />;
    case 'tournaments':
      return <AdminTournamentsPane />;
    default:
      return <AdminOverviewPane onNavigate={onNavigate} />;
  }
}
