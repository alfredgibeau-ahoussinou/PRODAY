import React from 'react';
import type { AdminNavSectionId } from '../navigation/adminNavConfig';
import { AdminTowerPane } from '../panes/AdminTowerPane';
import { AdminUsersPane } from '../panes/AdminUsersPane';
import { AdminClubsPane } from '../panes/AdminClubsPane';
import { AdminIdentityQueuePane } from '../panes/AdminIdentityQueuePane';
import { AdminRosterDataPane } from '../panes/AdminRosterDataPane';
import { AdminStandingsPane } from '../panes/AdminStandingsPane';
import { AdminMenuPane } from '../panes/AdminMenuPane';

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
    case 'tour':
      return (
        <AdminTowerPane onNavigate={onNavigate} onOpenCommand={onOpenCommand} />
      );
    case 'clubs':
      return <AdminClubsPane focusId={focusId} />;
    case 'identite':
      return <AdminIdentityQueuePane focusId={focusId} />;
    case 'effectifs':
      return <AdminRosterDataPane />;
    case 'classements':
      return <AdminStandingsPane />;
    case 'utilisateurs':
      return (
        <AdminUsersPane
          focusId={focusId}
          onPreviewPresidentPole={onPreviewPresidentPole}
          onPreviewUserApp={onPreviewUserApp}
        />
      );
    case 'menu':
      return (
        <AdminMenuPane onNavigate={onNavigate} onOpenCommand={onOpenCommand} />
      );
    default:
      return (
        <AdminTowerPane onNavigate={onNavigate} onOpenCommand={onOpenCommand} />
      );
  }
}
