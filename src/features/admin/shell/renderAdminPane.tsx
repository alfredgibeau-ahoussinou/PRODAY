import React from 'react';
import type { AdminNavSectionId } from '../navigation/adminNavConfig';
import { OpsPulsePane } from './OpsPulsePane';
import { AdminUsersPane } from '../panes/AdminUsersPane';
import { AdminClubsPane } from '../panes/AdminClubsPane';
import { AdminIdentityQueuePane } from '../panes/AdminIdentityQueuePane';
import { AdminRosterDataPane } from '../panes/AdminRosterDataPane';
import { AdminStandingsPane } from '../panes/AdminStandingsPane';

type Props = {
  section: AdminNavSectionId;
  focusId?: string;
  onNavigate: (section: AdminNavSectionId, focusId?: string) => void;
  onPreviewUserApp: () => void;
  onPreviewPresidentPole?: () => void;
  onOpenCommand?: () => void;
};

export function renderAdminPane({
  section,
  focusId,
  onNavigate,
  onPreviewUserApp,
  onPreviewPresidentPole,
  onOpenCommand,
}: Props) {
  switch (section) {
    case 'pulse':
      return <OpsPulsePane onNavigate={onNavigate} onOpenCommand={onOpenCommand} />;
    case 'annuaire':
      return <AdminClubsPane focusId={focusId} />;
    case 'file':
      return <AdminIdentityQueuePane focusId={focusId} />;
    case 'effectifs':
      return <AdminRosterDataPane />;
    case 'classements':
      return <AdminStandingsPane />;
    case 'comptes':
      return (
        <AdminUsersPane
          focusId={focusId}
          onPreviewPresidentPole={onPreviewPresidentPole}
          onPreviewUserApp={onPreviewUserApp}
        />
      );
    default:
      return <OpsPulsePane onNavigate={onNavigate} onOpenCommand={onOpenCommand} />;
  }
}
