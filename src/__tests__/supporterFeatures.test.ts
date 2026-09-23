jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
}));
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(),
  connectFunctionsEmulator: jest.fn(),
}));
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));
jest.mock('../lib/firebase', () => ({ getFirebaseAuth: jest.fn(), getDb: jest.fn() }));
jest.mock('../config/firebase', () => ({ isFirebaseConfigured: jest.fn(() => false) }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import fs from 'fs';
import path from 'path';
import { supporterProfileService } from '../services/supporterProfile.service';
import { encouragementsService } from '../services/encouragements.service';
import { SupporterHomeScreen } from '../screens/supporter/SupporterHomeScreen';
import { SupporterMatchsScreen } from '../screens/supporter/SupporterMatchsScreen';
import { SupporterCompetitionsScreen } from '../screens/supporter/SupporterCompetitionsScreen';
import { SupporterClubsScreen } from '../screens/supporter/SupporterClubsScreen';
import { SupporterVideosScreen } from '../screens/supporter/SupporterVideosScreen';
import { SupporterMatchCenterScreen } from '../screens/supporter/SupporterMatchCenterScreen';
import { SupporterStandingsScreen } from '../screens/supporter/SupporterStandingsScreen';
import { SupporterNotificationsScreen } from '../screens/supporter/SupporterNotificationsScreen';

describe('Supporter Services & Screens Architecture', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('1. supporterProfileService (Gestion des clubs suivis)', () => {
    it('retourne une liste vide par défaut', async () => {
      const clubs = await supporterProfileService.getFollowedClubs('user_1');
      expect(clubs).toEqual([]);
      expect(await supporterProfileService.countFollowing('user_1')).toBe(0);
      expect(await supporterProfileService.isFollowing('user_1', 'club_abc')).toBe(false);
    });

    it('permet de suivre un club avec date ISO enregistrée', async () => {
      await supporterProfileService.followClub('user_1', {
        clubId: 'club_fc_proday',
        clubName: 'FC ProDay',
      });

      const clubs = await supporterProfileService.getFollowedClubs('user_1');
      expect(clubs.length).toBe(1);
      expect(clubs[0].clubId).toBe('club_fc_proday');
      expect(clubs[0].clubName).toBe('FC ProDay');
      expect(clubs[0].followedAt).toBeDefined();
      expect(await supporterProfileService.isFollowing('user_1', 'club_fc_proday')).toBe(true);
      expect(await supporterProfileService.countFollowing('user_1')).toBe(1);
    });

    it('évite les doublons lors de plusieurs follow du même club', async () => {
      await supporterProfileService.followClub('user_1', {
        clubId: 'club_fc_proday',
        clubName: 'FC ProDay',
      });
      await supporterProfileService.followClub('user_1', {
        clubId: 'club_fc_proday',
        clubName: 'FC ProDay',
      });

      const count = await supporterProfileService.countFollowing('user_1');
      expect(count).toBe(1);
    });

    it('permet de ne plus suivre un club (unfollow)', async () => {
      await supporterProfileService.followClub('user_1', {
        clubId: 'club_1',
        clubName: 'Club 1',
      });
      await supporterProfileService.followClub('user_1', {
        clubId: 'club_2',
        clubName: 'Club 2',
      });

      expect(await supporterProfileService.countFollowing('user_1')).toBe(2);

      await supporterProfileService.unfollowClub('user_1', 'club_1');
      const clubs = await supporterProfileService.getFollowedClubs('user_1');

      expect(clubs.length).toBe(1);
      expect(clubs[0].clubId).toBe('club_2');
      expect(await supporterProfileService.isFollowing('user_1', 'club_1')).toBe(false);
    });

    it('isole les données entre différents utilisateurs', async () => {
      await supporterProfileService.followClub('user_A', {
        clubId: 'club_A',
        clubName: 'Club A',
      });
      await supporterProfileService.followClub('user_B', {
        clubId: 'club_B',
        clubName: 'Club B',
      });

      const clubsA = await supporterProfileService.getFollowedClubs('user_A');
      const clubsB = await supporterProfileService.getFollowedClubs('user_B');

      expect(clubsA.length).toBe(1);
      expect(clubsA[0].clubId).toBe('club_A');
      expect(clubsB.length).toBe(1);
      expect(clubsB[0].clubId).toBe('club_B');
    });
  });

  describe('2. encouragementsService (Mur des encouragements)', () => {
    it('retourne une liste vide initialement (pas de mock hardcodé)', async () => {
      const list = await encouragementsService.list();
      expect(list).toEqual([]);
    });

    it('publie un encouragement avec id auto-généré, date ISO et 0 clap', async () => {
      const posted = await encouragementsService.post({
        uid: 'user_supporter_42',
        authorName: 'Jean Supporter',
        authorRole: 'Supporter officiel',
        clubOrTeam: 'Seniors 1',
        text: 'Tous derrière les bleus ce dimanche !',
      });

      expect(posted.id).toBeDefined();
      expect(posted.claps).toBe(0);
      expect(posted.clappedByUids).toEqual([]);
      expect(posted.createdAt).toBeDefined();

      const all = await encouragementsService.list();
      expect(all.length).toBe(1);
      expect(all[0].text).toBe('Tous derrière les bleus ce dimanche !');
    });

    it('gère le système de clap (toggle ajout et retrait)', async () => {
      const item = await encouragementsService.post({
        uid: 'author_1',
        authorName: 'Auteur',
        clubOrTeam: 'U17',
        text: 'Bonne chance !',
      });

      // 1. Premier clap par user_x
      await encouragementsService.clap(item.id, 'user_x');
      let current = await encouragementsService.list();
      expect(current[0].claps).toBe(1);
      expect(current[0].clappedByUids).toContain('user_x');
      expect(await encouragementsService.hasClapped(item.id, 'user_x')).toBe(true);

      // 2. Second clap par user_y
      await encouragementsService.clap(item.id, 'user_y');
      current = await encouragementsService.list();
      expect(current[0].claps).toBe(2);

      // 3. Déclap par user_x (toggle)
      await encouragementsService.clap(item.id, 'user_x');
      current = await encouragementsService.list();
      expect(current[0].claps).toBe(1);
      expect(current[0].clappedByUids).not.toContain('user_x');
      expect(await encouragementsService.hasClapped(item.id, 'user_x')).toBe(false);
    });

    it('filtre les encouragements par clubId lorsque fourni', async () => {
      await encouragementsService.post({
        uid: 'u1',
        authorName: 'A',
        clubId: 'club_red',
        clubOrTeam: 'Red Team',
        text: 'Go Red !',
      });
      await encouragementsService.post({
        uid: 'u2',
        authorName: 'B',
        clubId: 'club_blue',
        clubOrTeam: 'Blue Team',
        text: 'Go Blue !',
      });

      const redOnly = await encouragementsService.list('club_red');
      expect(redOnly.length).toBe(1);
      expect(redOnly[0].text).toBe('Go Red !');

      const all = await encouragementsService.list();
      expect(all.length).toBe(2);
    });
  });

  describe('3. Complétude et intégrité du code source des écrans Supporter', () => {
    it('exporte tous les composants d’écrans supporter comme fonctions React valides', () => {
      expect(typeof SupporterHomeScreen).toBe('function');
      expect(typeof SupporterMatchsScreen).toBe('function');
      expect(typeof SupporterCompetitionsScreen).toBe('function');
      expect(typeof SupporterClubsScreen).toBe('function');
      expect(typeof SupporterVideosScreen).toBe('function');
      expect(typeof SupporterMatchCenterScreen).toBe('function');
      expect(typeof SupporterStandingsScreen).toBe('function');
      expect(typeof SupporterNotificationsScreen).toBe('function');
    });

    it('vérifie que SupporterHomeScreen ne contient plus de constantes hardcodées (142, 3, N3 Poule A)', () => {
      const homeCode = fs.readFileSync(
        path.resolve(__dirname, '../screens/supporter/SupporterHomeScreen.tsx'),
        'utf-8',
      );
      expect(homeCode).not.toContain('>142<');
      expect(homeCode).not.toContain('>3<');
      expect(homeCode).not.toContain('>N3<');
      expect(homeCode).not.toContain('>Poule A<');
      expect(homeCode).toContain('encouragementsService');
      expect(homeCode).toContain('supporterProfileService');
    });

    it('vérifie que SupporterEncouragementFeed ne contient plus INITIAL_ENCOURAGEMENTS', () => {
      const feedCode = fs.readFileSync(
        path.resolve(__dirname, '../features/supporter/ui/SupporterEncouragementFeed.tsx'),
        'utf-8',
      );
      expect(feedCode).not.toContain('INITIAL_ENCOURAGEMENTS');
      expect(feedCode).not.toContain('Alexandre M.');
      expect(feedCode).not.toContain('Kop Tribune Nord');
      expect(feedCode).toContain('encouragementsService');
    });

    it('vérifie que SupporterMatchsScreen utilise CalendarMonthGrid', () => {
      const matchsCode = fs.readFileSync(
        path.resolve(__dirname, '../screens/supporter/SupporterMatchsScreen.tsx'),
        'utf-8',
      );
      expect(matchsCode).toContain('CalendarMonthGrid');
      expect(matchsCode).toContain('supporterProfileService');
      expect(matchsCode).toContain('teamEventsService');
    });

    it('vérifie que SupporterCompetitionsScreen intègre EliteLeagueStandings et les ligues FFF', () => {
      const compCode = fs.readFileSync(
        path.resolve(__dirname, '../screens/supporter/SupporterCompetitionsScreen.tsx'),
        'utf-8',
      );
      expect(compCode).toContain('EliteLeagueStandings');
      expect(compCode).toContain('frenchFootballStandingsService');
      expect(compCode).toContain('FRENCH_LEAGUE_CATEGORIES');
    });

    it('vérifie que SupporterClubsScreen permet de suivre et rechercher des clubs', () => {
      const clubsCode = fs.readFileSync(
        path.resolve(__dirname, '../screens/supporter/SupporterClubsScreen.tsx'),
        'utf-8',
      );
      expect(clubsCode).toContain('clubsService');
      expect(clubsCode).toContain('supporterProfileService');
      expect(clubsCode).toContain('handleFollow');
      expect(clubsCode).toContain('handleUnfollow');
    });

    it('vérifie que SupporterVideosScreen intègre le VideoWorkspace', () => {
      const videosCode = fs.readFileSync(
        path.resolve(__dirname, '../screens/supporter/SupporterVideosScreen.tsx'),
        'utf-8',
      );
      expect(videosCode).toContain('VideoWorkspace');
      expect(videosCode).toContain('userRole="supporter"');
    });
  });
});
