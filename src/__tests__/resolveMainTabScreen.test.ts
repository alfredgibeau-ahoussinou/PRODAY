jest.mock('../screens/HomeScreen', () => ({ HomeScreen: 'HomeScreen' }));
jest.mock('../screens/MercatoScreen', () => ({ MercatoScreen: 'MercatoScreen' }));
jest.mock('../screens/MatchsScreen', () => ({ MatchsScreen: 'MatchsScreen' }));
jest.mock('../screens/MessagesScreen', () => ({ MessagesScreen: 'MessagesScreen' }));
jest.mock('../screens/ClubStructureScreen', () => ({ ClubStructureScreen: 'ClubStructureScreen' }));
jest.mock('../screens/club/ClubPortalScreen', () => ({ ClubPortalScreen: 'ClubPortalScreen' }));
jest.mock('../screens/club/ClubRecruitmentScreen', () => ({
  ClubRecruitmentScreen: 'ClubRecruitmentScreen',
}));
jest.mock('../screens/club/ClubCalendarScreen', () => ({ ClubCalendarScreen: 'ClubCalendarScreen' }));
jest.mock('../screens/club/ClubCommunicationScreen', () => ({
  ClubCommunicationScreen: 'ClubCommunicationScreen',
}));
jest.mock('../screens/club/ClubVitrineScreen', () => ({ ClubVitrineScreen: 'ClubVitrineScreen' }));
jest.mock('../screens/supporter/SupporterHomeScreen', () => ({
  SupporterHomeScreen: 'SupporterHomeScreen',
}));
jest.mock('../screens/SupporterMatchsScreen', () => ({
  SupporterMatchsScreen: 'SupporterMatchsScreen',
}));
jest.mock('../screens/SupporterSuivisScreen', () => ({
  SupporterSuivisScreen: 'SupporterSuivisScreen',
}));
jest.mock('../screens/supporter/SupporterTribuneFeedScreen', () => ({
  SupporterTribuneFeedScreen: 'SupporterTribuneFeedScreen',
}));
jest.mock('../screens/SupporterProfileTabScreen', () => ({
  SupporterProfileTabScreen: 'SupporterProfileTabScreen',
}));
jest.mock('../screens/LazyReelsScreen', () => ({ LazyReelsScreen: 'LazyReelsScreen' }));
jest.mock('../screens/ProfilTabScreen', () => ({ ProfilTabScreen: 'ProfilTabScreen' }));
jest.mock('../screens/CarpoolScreen', () => ({ CarpoolScreen: 'CarpoolScreen' }));
jest.mock('../screens/HealthProfessionalsScreen', () => ({
  HealthProfessionalsScreen: 'HealthProfessionalsScreen',
}));
jest.mock('../screens/FamilleTabScreen', () => ({ FamilleTabScreen: 'FamilleTabScreen' }));
jest.mock('../screens/FeedTabScreen', () => ({ FeedTabScreen: 'FeedTabScreen' }));
jest.mock('../screens/ShopScreen', () => ({ ShopScreen: 'ShopScreen' }));
jest.mock('../screens/medical/PhysioAgendaScreen', () => ({
  PhysioAgendaScreen: 'PhysioAgendaScreen',
}));
jest.mock('../screens/medical/PhysioMessagesScreen', () => ({
  PhysioMessagesScreen: 'PhysioMessagesScreen',
}));
jest.mock('../screens/medical/PhysioProfileTabScreen', () => ({
  PhysioProfileTabScreen: 'PhysioProfileTabScreen',
}));
jest.mock('../screens/medical/PhysioRequestsScreen', () => ({
  PhysioRequestsScreen: 'PhysioRequestsScreen',
}));
jest.mock('../screens/AmateurClubScreen', () => ({ AmateurClubScreen: 'AmateurClubScreen' }));
jest.mock('../screens/proPlayer/ProPlayerCareerScreen', () => ({
  ProPlayerCareerScreen: 'ProPlayerCareerScreen',
}));
jest.mock('../screens/proPlayer/ProPlayerSquadScreen', () => ({
  ProPlayerSquadScreen: 'ProPlayerSquadScreen',
}));
jest.mock('../screens/proPlayer/ProPlayerOpportunitiesScreen', () => ({
  ProPlayerOpportunitiesScreen: 'ProPlayerOpportunitiesScreen',
}));
jest.mock('../screens/proPlayer/ProPlayerGroupScreen', () => ({
  ProPlayerGroupScreen: 'ProPlayerGroupScreen',
}));

jest.mock('../screens/coach/CoachPortalScreen', () => ({
  CoachPortalScreen: 'CoachPortalScreen',
}));
jest.mock('../screens/smartTactics/SmartTacticsPortalScreen', () => ({
  SmartTacticsPortalScreen: 'SmartTacticsPortalScreen',
}));

import { resolveMainTabScreen } from '../navigation/resolveMainTabScreen';

describe('resolveMainTabScreen', () => {
  it('mappe les 5 onglets shell club pro', () => {
    expect(resolveMainTabScreen('home', 'club', 'pro')).toBe('ClubPortalScreen');
    expect(resolveMainTabScreen('recrutement', 'club', 'pro')).toBe('ClubRecruitmentScreen');
    expect(resolveMainTabScreen('matchs', 'club', 'pro')).toBe('ClubCalendarScreen');
    expect(resolveMainTabScreen('messages', 'club', 'pro')).toBe('ClubCommunicationScreen');
    expect(resolveMainTabScreen('profil', 'club', 'pro')).toBe('ClubVitrineScreen');
  });

  it('mappe le shell club amateur (portail + kanban + perf)', () => {
    expect(resolveMainTabScreen('home', 'club', 'amateur')).toBe('ClubPortalScreen');
    expect(resolveMainTabScreen('recrutement', 'club', 'amateur')).toBe('ClubRecruitmentScreen');
    expect(resolveMainTabScreen('matchs', 'club', 'amateur')).toBe('ClubCalendarScreen');
    expect(resolveMainTabScreen('feed', 'club', 'amateur')).toBe('SmartTacticsPortalScreen');
    expect(resolveMainTabScreen('profil', 'club', 'amateur')).toBe('ClubVitrineScreen');
  });

  it('utilise les écrans pro joueur hors rôle club', () => {
    expect(resolveMainTabScreen('home', 'player', 'pro')).toBe('HomeScreen');
    expect(resolveMainTabScreen('home', 'player', 'pro_player')).toBe('HomeScreen');
    expect(resolveMainTabScreen('recrutement', 'player', 'pro')).toBe('ProPlayerSquadScreen');
    expect(resolveMainTabScreen('reels', 'player', 'pro')).toBe('LazyReelsScreen');
    expect(resolveMainTabScreen('matchs', 'player', 'pro')).toBe('MatchsScreen');
    expect(resolveMainTabScreen('matchs', 'coach', 'pro')).toBe('MatchsScreen');
  });

  it('mappe le shell supporter avec tribune home', () => {
    expect(resolveMainTabScreen('home', 'supporter', 'supporter')).toBe('SupporterHomeScreen');
    expect(resolveMainTabScreen('matchs', 'supporter', 'supporter')).toBe('SupporterMatchsScreen');
    expect(resolveMainTabScreen('feed', 'supporter', 'supporter')).toBe('SupporterSuivisScreen');
    expect(resolveMainTabScreen('messages', 'supporter', 'supporter')).toBe('SupporterTribuneFeedScreen');
    expect(resolveMainTabScreen('profil', 'supporter', 'supporter')).toBe('SupporterProfileTabScreen');
  });

  it('mappe le portail coach sur home', () => {
    expect(resolveMainTabScreen('home', 'coach', 'pro')).toBe('CoachPortalScreen');
    expect(resolveMainTabScreen('home', 'coach', 'amateur')).toBe('CoachPortalScreen');
    expect(resolveMainTabScreen('matchs', 'coach', 'amateur')).toBe('MatchsScreen');
    expect(resolveMainTabScreen('feed', 'coach', 'amateur')).toBe('SmartTacticsPortalScreen');
    expect(resolveMainTabScreen('feed', 'player', 'amateur')).toBe('SmartTacticsPortalScreen');
  });
});
