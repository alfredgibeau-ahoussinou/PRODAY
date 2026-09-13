import React from 'react';
import { PresidentDashboardScreen } from '../../../screens/president/PresidentDashboardScreen';
import {
  PresidentAiScreen,
  PresidentAlertsScreen,
  PresidentBoardScreen,
  PresidentCommunicationScreen,
  PresidentDocumentsScreen,
  PresidentEventsScreen,
  PresidentFinanceScreen,
  PresidentGoalsScreen,
  PresidentInsightsScreen,
  PresidentMembersScreen,
  PresidentOverviewScreen,
  PresidentRecruitmentScreen,
  PresidentReportsScreen,
  PresidentSeasonScreen,
  PresidentSettingsScreen,
  PresidentSponsorsScreen,
  PresidentSportScreen,
  PresidentStaffScreen,
  PresidentTeamsScreen,
  PresidentVideoScreen,
} from '../../../screens/president/PresidentSections';
import {
  AdminHomeScreen,
  AdminStaffScreen,
  AdminSystemScreen,
} from '../../../screens/admin';
import { PresidentMenuPane } from './PresidentMenuPane';
import type { PresidentNavItemId } from '../navigation/presidentNavConfig';
import type { PresidentNavResolvedItem } from '../navigation/resolvePresidentNavAccess';

export function renderPresidentPane(
  navId: PresidentNavItemId,
  menuItems: PresidentNavResolvedItem[],
  onSelect: (id: PresidentNavItemId) => void,
  onExitClub: () => void,
): React.ReactNode {
  switch (navId) {
    case 'cockpit':
      return <AdminHomeScreen />;
    case 'overview':
      return <PresidentOverviewScreen />;
    case 'sport':
      return <PresidentSportScreen />;
    case 'finance':
      return <PresidentFinanceScreen />;
    case 'members':
      return <PresidentMembersScreen />;
    case 'teams':
      return <PresidentTeamsScreen />;
    case 'staff':
      return <AdminStaffScreen />;
    case 'sponsors':
      return <PresidentSponsorsScreen />;
    case 'communication':
      return <PresidentCommunicationScreen />;
    case 'events':
      return <PresidentEventsScreen />;
    case 'recruitment':
      return <PresidentRecruitmentScreen />;
    case 'video':
      return <PresidentVideoScreen />;
    case 'documents':
      return <PresidentDocumentsScreen />;
    case 'reports':
      return <PresidentReportsScreen />;
    case 'insights':
      return <PresidentInsightsScreen />;
    case 'ai':
      return <PresidentAiScreen />;
    case 'settings':
      return <AdminSystemScreen />;
    case 'board':
      return <PresidentBoardScreen />;
    case 'season':
      return <PresidentSeasonScreen />;
    case 'goals':
      return <PresidentGoalsScreen />;
    case 'alerts':
      return <PresidentAlertsScreen />;
    case 'menu':
      return (
        <PresidentMenuPane items={menuItems} onSelect={onSelect} onExitClub={onExitClub} />
      );
    default:
      return <PresidentDashboardScreen />;
  }
}
