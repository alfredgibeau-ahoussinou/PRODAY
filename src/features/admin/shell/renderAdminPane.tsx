import React from 'react';
import type { AdminNavSectionId } from '../navigation/adminNavConfig';
import { AdminDashboardPane } from '../panes/AdminDashboardPane';
import { AdminPlatformPane } from '../panes/AdminPlatformPane';
import { AdminUsersPane } from '../panes/AdminUsersPane';
import { AdminClubsPane } from '../panes/AdminClubsPane';
import { AdminCommercialPane } from '../panes/AdminCommercialPane';
import { AdminFinancePane } from '../panes/AdminFinancePane';
import { AdminProductPane } from '../panes/AdminProductPane';
import { AdminAiPane } from '../panes/AdminAiPane';
import { AdminSupportPane } from '../panes/AdminSupportPane';
import { AdminSecurityPane } from '../panes/AdminSecurityPane';
import { AdminSystemPane } from '../panes/AdminSystemPane';
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
    case 'accueil':
      return (
        <AdminDashboardPane onNavigate={onNavigate} onOpenCommand={onOpenCommand} />
      );
    case 'plateforme':
      return <AdminPlatformPane />;
    case 'utilisateurs':
      return (
        <AdminUsersPane
          focusId={focusId}
          onPreviewPresidentPole={onPreviewPresidentPole}
        />
      );
    case 'clubs':
      return <AdminClubsPane focusId={focusId} />;
    case 'commercial':
      return <AdminCommercialPane focusId={focusId} />;
    case 'finances':
      return <AdminFinancePane />;
    case 'produit':
      return <AdminProductPane />;
    case 'ia':
      return <AdminAiPane onNavigate={onNavigate} />;
    case 'support':
      return <AdminSupportPane onNavigate={onNavigate} />;
    case 'securite':
      return <AdminSecurityPane />;
    case 'systeme':
      return <AdminSystemPane onPreviewUserApp={onPreviewUserApp} />;
    case 'menu':
      return (
        <AdminMenuPane onNavigate={onNavigate} onOpenCommand={onOpenCommand} />
      );
    default:
      return (
        <AdminDashboardPane onNavigate={onNavigate} onOpenCommand={onOpenCommand} />
      );
  }
}
