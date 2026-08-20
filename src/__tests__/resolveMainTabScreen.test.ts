jest.mock('../screens/HomeScreen', () => ({ HomeScreen: 'HomeScreen' }));
jest.mock('../screens/MercatoScreen', () => ({ MercatoScreen: 'MercatoScreen' }));
jest.mock('../screens/MatchsScreen', () => ({ MatchsScreen: 'MatchsScreen' }));
jest.mock('../screens/MessagesScreen', () => ({ MessagesScreen: 'MessagesScreen' }));
jest.mock('../screens/club/ClubPortalScreen', () => ({ ClubPortalScreen: 'ClubPortalScreen' }));
jest.mock('../screens/club/ClubRecruitmentScreen', () => ({
  ClubRecruitmentScreen: 'ClubRecruitmentScreen',
}));
jest.mock('../screens/club/ClubCalendarScreen', () => ({ ClubCalendarScreen: 'ClubCalendarScreen' }));
jest.mock('../screens/club/ClubCommunicationScreen', () => ({
  ClubCommunicationScreen: 'ClubCommunicationScreen',
}));
jest.mock('../screens/club/ClubVitrineScreen', () => ({ ClubVitrineScreen: 'ClubVitrineScreen' }));
jest.mock('../screens/supporterSpace/SupporterSpaceHomeScreen', () => ({
  SupporterSpaceHomeScreen: 'SupporterSpaceHomeScreen',
}));
jest.mock('../screens/supporterSpace/SupporterSpaceMatchsScreen', () => ({
  SupporterSpaceMatchsScreen: 'SupporterSpaceMatchsScreen',
}));
jest.mock('../screens/supporterSpace/SupporterSpaceProDayScreen', () => ({
  SupporterSpaceProDayScreen: 'SupporterSpaceProDayScreen',
}));
jest.mock('../screens/supporterSpace/SupporterSpaceClubsScreen', () => ({
  SupporterSpaceClubsScreen: 'SupporterSpaceClubsScreen',
}));
jest.mock('../screens/supporterSpace/SupporterSpaceProfileScreen', () => ({
  SupporterSpaceProfileScreen: 'SupporterSpaceProfileScreen',
}));
jest.mock('../screens/supporterSpace/SupporterSpaceDebateFeedScreen', () => ({
  SupporterSpaceDebateFeedScreen: 'SupporterSpaceDebateFeedScreen',
}));
jest.mock('../screens/supporter/SupporterExplorerScreen', () => ({
  SupporterExplorerScreen: 'SupporterExplorerScreen',
}));
jest.mock('../screens/supporter/SupporterVideosScreen', () => ({
  SupporterVideosScreen: 'SupporterVideosScreen',
}));
jest.mock('../screens/supporter/SupporterTribuneFeedScreen', () => ({
  SupporterTribuneFeedScreen: 'SupporterTribuneFeedScreen',
}));
jest.mock('../screens/LazyReelsScreen', () => ({ LazyReelsScreen: 'LazyReelsScreen' }));
jest.mock('../screens/ProfilTabScreen', () => ({ ProfilTabScreen: 'ProfilTabScreen' }));
jest.mock('../screens/CarpoolScreen', () => ({ CarpoolScreen: 'CarpoolScreen' }));
jest.mock('../screens/RetiredRoleScreen', () => ({
  RetiredRoleScreen: 'RetiredRoleScreen',
}));
jest.mock('../screens/FamilleTabScreen', () => ({ FamilleTabScreen: 'FamilleTabScreen' }));
jest.mock('../screens/FeedTabScreen', () => ({ FeedTabScreen: 'FeedTabScreen' }));
jest.mock('../screens/ShopScreen', () => ({ ShopScreen: 'ShopScreen' }));
jest.mock('../screens/AmateurClubScreen', () => ({ AmateurClubScreen: 'AmateurClubScreen' }));
jest.mock('../screens/proPlayer/ProPlayerSquadScreen', () => ({
  ProPlayerSquadScreen: 'ProPlayerSquadScreen',
}));
jest.mock('../screens/proPlayer/ProPlayerGroupScreen', () => ({
  ProPlayerGroupScreen: 'ProPlayerGroupScreen',
}));

jest.mock('../screens/coach/CoachPortalScreen', () => ({
  CoachPortalScreen: 'CoachPortalScreen',
}));
jest.mock('../screens/joueur/PlayerFootballHubScreen', () => ({
  PlayerFootballHubScreen: 'PlayerFootballHubScreen',
}));
jest.mock('../screens/joueur/PlayerSaisonScreen', () => ({
  PlayerSaisonScreen: 'PlayerSaisonScreen',
}));
jest.mock('../screens/joueur/PlayerProgressionScreen', () => ({
  PlayerProgressionScreen: 'PlayerProgressionScreen',
}));
jest.mock('../screens/joueur/JoueurPlusHubScreen', () => ({
  JoueurPlusHubScreen: 'JoueurPlusHubScreen',
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
    expect(resolveMainTabScreen('home', 'player', 'pro')).toBe('PlayerFootballHubScreen');
    expect(resolveMainTabScreen('home', 'player', 'pro_player')).toBe('PlayerFootballHubScreen');
    expect(resolveMainTabScreen('recrutement', 'player', 'pro')).toBe('ProPlayerSquadScreen');
    expect(resolveMainTabScreen('reels', 'player', 'pro')).toBe('LazyReelsScreen');
    expect(resolveMainTabScreen('feed', 'player', 'pro')).toBe('PlayerSaisonScreen');
    expect(resolveMainTabScreen('plus', 'player', 'pro')).toBe('JoueurPlusHubScreen');
    expect(resolveMainTabScreen('matchs', 'player', 'pro')).toBe('MatchsScreen');
    expect(resolveMainTabScreen('matchs', 'coach', 'pro')).toBe('MatchsScreen');
  });

  it('mappe le shell Supporter Space Accueil · Matchs · ProDay · Clubs · Profil', () => {
    expect(resolveMainTabScreen('home', 'supporter', 'supporter')).toBe('SupporterSpaceHomeScreen');
    expect(resolveMainTabScreen('matchs', 'supporter', 'supporter')).toBe('SupporterSpaceMatchsScreen');
    expect(resolveMainTabScreen('feed', 'supporter', 'supporter')).toBe('SupporterSpaceProDayScreen');
    expect(resolveMainTabScreen('plus', 'supporter', 'supporter')).toBe('SupporterSpaceClubsScreen');
    expect(resolveMainTabScreen('profil', 'supporter', 'supporter')).toBe('SupporterSpaceProfileScreen');
    expect(resolveMainTabScreen('reels', 'supporter', 'supporter')).toBe('SupporterVideosScreen');
    expect(resolveMainTabScreen('messages', 'supporter', 'supporter')).toBe(
      'SupporterSpaceDebateFeedScreen',
    );
    expect(resolveMainTabScreen('shop', 'supporter', 'supporter')).toBe('ShopScreen');
  });

  it('mappe le portail coach sur home', () => {
    expect(resolveMainTabScreen('home', 'coach', 'pro')).toBe('CoachPortalScreen');
    expect(resolveMainTabScreen('home', 'coach', 'amateur')).toBe('CoachPortalScreen');
    expect(resolveMainTabScreen('matchs', 'coach', 'amateur')).toBe('MatchsScreen');
    expect(resolveMainTabScreen('feed', 'coach', 'amateur')).toBe('SmartTacticsPortalScreen');
    expect(resolveMainTabScreen('feed', 'player', 'amateur')).toBe('PlayerSaisonScreen');
  });
});
