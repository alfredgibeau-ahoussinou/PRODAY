jest.mock('../screens/joueur/PlayerHomeScreenV4', () => ({
  PlayerHomeScreenV4: 'PlayerHomeScreenV4',
}));
jest.mock('../screens/joueur/PlayerCalendarScreenV4', () => ({
  PlayerCalendarScreenV4: 'PlayerCalendarScreenV4',
}));
jest.mock('../screens/joueur/PlayerMyCardScreenV4', () => ({
  PlayerMyCardScreenV4: 'PlayerMyCardScreenV4',
}));
jest.mock('../screens/coach/CoachHomeScreen', () => ({
  CoachHomeScreen: 'CoachHomeScreen',
}));
jest.mock('../screens/coach/CoachTrainingPlannerScreen', () => ({
  CoachTrainingPlannerScreen: 'CoachTrainingPlannerScreen',
}));
jest.mock('../screens/coach/CoachSquadScreen', () => ({
  CoachSquadScreen: 'CoachSquadScreen',
}));
jest.mock('../screens/coach/CoachDynamicTacticsScreenV4', () => ({
  CoachDynamicTacticsScreenV4: 'CoachDynamicTacticsScreenV4',
}));
jest.mock('../screens/club/ClubTeamsScreen', () => ({
  ClubTeamsScreen: 'ClubTeamsScreen',
}));
jest.mock('../screens/club/ClubMatchesScreen', () => ({
  ClubMatchesScreen: 'ClubMatchesScreen',
}));

jest.mock('../screens/HomeScreen', () => ({ HomeScreen: 'HomeScreen' }));
jest.mock('../screens/MercatoScreen', () => ({ MercatoScreen: 'MercatoScreen' }));
jest.mock('../screens/MatchsScreen', () => ({ MatchsScreen: 'MatchsScreen' }));
jest.mock('../screens/MessagesScreen', () => ({ MessagesScreen: 'MessagesScreen' }));
jest.mock('../screens/club/ClubHomeScreen', () => ({ ClubHomeScreen: 'ClubHomeScreen' }));
jest.mock('../screens/club/ClubRecruitmentScreen', () => ({
  ClubRecruitmentScreen: 'ClubRecruitmentScreen',
}));
jest.mock('../screens/club/ClubCalendarScreen', () => ({ ClubCalendarScreen: 'ClubCalendarScreen' }));
jest.mock('../screens/club/ClubCommunicationScreen', () => ({
  ClubCommunicationScreen: 'ClubCommunicationScreen',
}));
jest.mock('../screens/club/ClubHubScreen', () => ({ ClubHubScreen: 'ClubHubScreen' }));
jest.mock('../screens/supporter/SupporterHomeScreen', () => ({
  SupporterHomeScreen: 'SupporterHomeScreen',
}));
jest.mock('../screens/supporter/SupporterMatchsScreen', () => ({
  SupporterMatchsScreen: 'SupporterMatchsScreen',
}));
jest.mock('../screens/supporter/SupporterCompetitionsScreen', () => ({
  SupporterCompetitionsScreen: 'SupporterCompetitionsScreen',
}));
jest.mock('../screens/supporter/SupporterClubsScreen', () => ({
  SupporterClubsScreen: 'SupporterClubsScreen',
}));
jest.mock('../screens/supporter/SupporterVideosScreen', () => ({
  SupporterVideosScreen: 'SupporterVideosScreen',
}));
jest.mock('../screens/supporter/SupporterProfileScreen', () => ({
  SupporterProfileScreen: 'SupporterProfileScreen',
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
jest.mock('../screens/menu/ProDayMenuScreen', () => ({
  ProDayMenuScreen: 'ProDayMenuScreen',
}));

import { resolveMainTabScreen } from '../navigation/resolveMainTabScreen';

describe('resolveMainTabScreen', () => {
  it('mappe les onglets shell club pro', () => {
    expect(resolveMainTabScreen('home', 'club', 'pro')).toBe('ClubHomeScreen');
    expect(resolveMainTabScreen('recrutement', 'club', 'pro')).toBe('ClubTeamsScreen');
    expect(resolveMainTabScreen('matchs', 'club', 'pro')).toBe('ClubMatchesScreen');
    expect(resolveMainTabScreen('messages', 'club', 'pro')).toBe('ClubCommunicationScreen');
    expect(resolveMainTabScreen('profil', 'club', 'pro')).toBe('ClubHubScreen');
    expect(resolveMainTabScreen('plus', 'club', 'pro')).toBe('ProDayMenuScreen');
  });

  it('mappe le shell club amateur (portail + kanban + perf)', () => {
    expect(resolveMainTabScreen('home', 'club', 'amateur')).toBe('ClubHomeScreen');
    expect(resolveMainTabScreen('recrutement', 'club', 'amateur')).toBe('ClubTeamsScreen');
    expect(resolveMainTabScreen('matchs', 'club', 'amateur')).toBe('ClubMatchesScreen');
    expect(resolveMainTabScreen('feed', 'club', 'amateur')).toBe('CoachDynamicTacticsScreenV4');
    expect(resolveMainTabScreen('profil', 'club', 'amateur')).toBe('ClubHubScreen');
    expect(resolveMainTabScreen('plus', 'club', 'amateur')).toBe('ProDayMenuScreen');
  });

  it('utilise les écrans pro joueur hors rôle club', () => {
    expect(resolveMainTabScreen('home', 'player', 'pro')).toBe('PlayerHomeScreenV4');
    expect(resolveMainTabScreen('home', 'player', 'pro_player')).toBe('PlayerHomeScreenV4');
    expect(resolveMainTabScreen('recrutement', 'player', 'pro')).toBe('ProPlayerSquadScreen');
    expect(resolveMainTabScreen('reels', 'player', 'pro')).toBe('LazyReelsScreen');
    expect(resolveMainTabScreen('feed', 'player', 'pro')).toBe('PlayerSaisonScreen');
    expect(resolveMainTabScreen('plus', 'player', 'pro')).toBe('ProDayMenuScreen');
    expect(resolveMainTabScreen('matchs', 'player', 'pro')).toBe('PlayerCalendarScreenV4');
    expect(resolveMainTabScreen('matchs', 'coach', 'pro')).toBe('CoachTrainingPlannerScreen');
  });

  it('mappe le shell supporter Accueil · Matchs · Compétitions · Clubs · Vidéos · Profil', () => {
    expect(resolveMainTabScreen('home', 'supporter', 'supporter')).toBe('SupporterHomeScreen');
    expect(resolveMainTabScreen('matchs', 'supporter', 'supporter')).toBe('SupporterMatchsScreen');
    expect(resolveMainTabScreen('feed', 'supporter', 'supporter')).toBe(
      'SupporterCompetitionsScreen',
    );
    expect(resolveMainTabScreen('plus', 'supporter', 'supporter')).toBe('SupporterClubsScreen');
    expect(resolveMainTabScreen('reels', 'supporter', 'supporter')).toBe('SupporterVideosScreen');
    expect(resolveMainTabScreen('profil', 'supporter', 'supporter')).toBe('SupporterProfileScreen');
  });

  it('mappe le scaffold supporter pour parent guest (role parent + line supporter)', () => {
    expect(resolveMainTabScreen('home', 'parent', 'supporter')).toBe('SupporterHomeScreen');
    expect(resolveMainTabScreen('matchs', 'parent', 'supporter')).toBe('SupporterMatchsScreen');
    expect(resolveMainTabScreen('feed', 'parent', 'supporter')).toBe(
      'SupporterCompetitionsScreen',
    );
    expect(resolveMainTabScreen('plus', 'parent', 'supporter')).toBe('SupporterClubsScreen');
    expect(resolveMainTabScreen('reels', 'parent', 'supporter')).toBe('SupporterVideosScreen');
    expect(resolveMainTabScreen('profil', 'parent', 'supporter')).toBe('SupporterProfileScreen');
    // Ne doit pas retomber sur l’ancien shell générique (Home / Feed / Reels).
    expect(resolveMainTabScreen('home', 'parent', 'supporter')).not.toBe('PlayerHomeScreenV4');
    expect(resolveMainTabScreen('feed', 'parent', 'supporter')).not.toBe('FeedTabScreen');
    expect(resolveMainTabScreen('reels', 'parent', 'supporter')).not.toBe('LazyReelsScreen');
  });

  it('laisse les invités anonymes sur Discover/Auth (jamais scaffold supporter ni retired)', () => {
    expect(resolveMainTabScreen('home', null, 'supporter')).toBe('PlayerHomeScreenV4');
    expect(resolveMainTabScreen('profil', null, 'supporter')).toBe('PlayerMyCardScreenV4');
    expect(resolveMainTabScreen('home', undefined, 'supporter')).toBe('PlayerHomeScreenV4');
    expect(resolveMainTabScreen('home', null, 'sante')).toBe('PlayerHomeScreenV4');
    expect(resolveMainTabScreen('profil', null, 'sante')).toBe('PlayerMyCardScreenV4');
    expect(resolveMainTabScreen('home', null, 'amateur')).toBe('PlayerHomeScreenV4');
  });

  it('mappe le portail coach sur home', () => {
    expect(resolveMainTabScreen('home', 'coach', 'pro')).toBe('CoachHomeScreen');
    expect(resolveMainTabScreen('home', 'coach', 'amateur')).toBe('CoachHomeScreen');
    expect(resolveMainTabScreen('matchs', 'coach', 'amateur')).toBe('CoachTrainingPlannerScreen');
    expect(resolveMainTabScreen('feed', 'coach', 'amateur')).toBe('CoachDynamicTacticsScreenV4');
    expect(resolveMainTabScreen('feed', 'player', 'amateur')).toBe('PlayerSaisonScreen');
  });
});
