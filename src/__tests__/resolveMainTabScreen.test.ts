jest.mock('../screens/HomeScreen', () => ({ HomeScreen: 'HomeScreen' }));
jest.mock('../screens/MercatoScreen', () => ({ MercatoScreen: 'MercatoScreen' }));
jest.mock('../screens/MatchsScreen', () => ({ MatchsScreen: 'MatchsScreen' }));
jest.mock('../screens/MessagesScreen', () => ({ MessagesScreen: 'MessagesScreen' }));
jest.mock('../screens/ClubStructureScreen', () => ({ ClubStructureScreen: 'ClubStructureScreen' }));
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
jest.mock('../screens/proPlayer/ProPlayerOpportunitiesScreen', () => ({
  ProPlayerOpportunitiesScreen: 'ProPlayerOpportunitiesScreen',
}));
jest.mock('../screens/proPlayer/ProPlayerPortfolioScreen', () => ({
  ProPlayerPortfolioScreen: 'ProPlayerPortfolioScreen',
}));
jest.mock('../screens/proPlayer/ProPlayerGroupScreen', () => ({
  ProPlayerGroupScreen: 'ProPlayerGroupScreen',
}));

import { resolveMainTabScreen } from '../navigation/resolveMainTabScreen';

describe('resolveMainTabScreen', () => {
  it('mappe les 5 onglets shell club pro', () => {
    expect(resolveMainTabScreen('home', 'club', 'pro')).toBe('ClubStructureScreen');
    expect(resolveMainTabScreen('recrutement', 'club', 'pro')).toBe('ClubRecruitmentScreen');
    expect(resolveMainTabScreen('matchs', 'club', 'pro')).toBe('ClubCalendarScreen');
    expect(resolveMainTabScreen('messages', 'club', 'pro')).toBe('ClubCommunicationScreen');
    expect(resolveMainTabScreen('profil', 'club', 'pro')).toBe('ClubVitrineScreen');
  });

  it('utilise les écrans pro joueur hors rôle club', () => {
    expect(resolveMainTabScreen('recrutement', 'player', 'pro')).toBe('ProPlayerOpportunitiesScreen');
    expect(resolveMainTabScreen('matchs', 'player', 'pro')).toBe('ProPlayerGroupScreen');
    expect(resolveMainTabScreen('matchs', 'coach', 'pro')).toBe('MatchsScreen');
  });

  it('mappe le shell supporter avec tribune home', () => {
    expect(resolveMainTabScreen('home', 'supporter', 'supporter')).toBe('SupporterHomeScreen');
    expect(resolveMainTabScreen('matchs', 'supporter', 'supporter')).toBe('SupporterMatchsScreen');
    expect(resolveMainTabScreen('feed', 'supporter', 'supporter')).toBe('SupporterSuivisScreen');
    expect(resolveMainTabScreen('messages', 'supporter', 'supporter')).toBe('SupporterTribuneFeedScreen');
    expect(resolveMainTabScreen('profil', 'supporter', 'supporter')).toBe('SupporterProfileTabScreen');
  });

  it('conserve le fallback générique pour les autres rôles', () => {
    expect(resolveMainTabScreen('home', 'coach', 'pro')).toBe('HomeScreen');
  });
});
