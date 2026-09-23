import { Platform, Share } from 'react-native';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props: any) => React.createElement(Text, props, props.name),
    MaterialCommunityIcons: (props: any) => React.createElement(Text, props, props.name),
  };
});

import { generateMatchSheetHtml, exportOrPrintMatchSheet } from '../utils/coachMatchSheetExport';
import { CoachMatchTalkPresentationModal } from '../components/coach/match/CoachMatchTalkPresentationModal';
import type { TeamEvent } from '../models/TeamEvent';
import type { User } from '../models/User';
import type { MatchTalkBrief } from '../models/MatchTalkBrief';

describe('coachMatchSheetExport & Match Talk', () => {
  const mockCoach: User = {
    uid: 'coach-1',
    display_name: 'Zinédine Zidane',
    email: 'coach.zidane@proday.club',
    phone: '06 12 34 56 78',
    role: 'coach',
    is_verified: true,
    verification_status: 'VERIFIED',
    is_active: true,
    profile: {
      diploma: 'UEFA Pro License',
    },
    documents: [],
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
  };

  const mockMembers: User[] = [
    {
      uid: 'player-gk',
      display_name: 'Mike Maignan',
      email: 'maignan@proday.club',
      role: 'player',
      is_verified: true,
      verification_status: 'VERIFIED',
      is_active: true,
      profile: { jersey_number: 16, position: 'Gardien' },
      documents: [],
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      uid: 'player-cb',
      display_name: 'William Saliba',
      email: 'saliba@proday.club',
      role: 'player',
      is_verified: true,
      verification_status: 'VERIFIED',
      is_active: true,
      profile: { jersey_number: 4, position: 'Défenseur central' },
      documents: [],
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      uid: 'player-mid',
      display_name: 'Aurélien Tchouaméni',
      email: 'tchouameni@proday.club',
      role: 'player',
      is_verified: true,
      verification_status: 'VERIFIED',
      is_active: true,
      profile: { jersey_number: 8, position: 'Milieu défensif' },
      documents: [],
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      uid: 'player-att',
      display_name: 'Kylian Mbappé',
      email: 'mbappe@proday.club',
      role: 'player',
      is_verified: true,
      verification_status: 'VERIFIED',
      is_active: true,
      profile: { jersey_number: 10, position: 'Attaquant' },
      documents: [],
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      uid: 'player-sub1',
      display_name: 'Eduardo Camavinga',
      email: 'camavinga@proday.club',
      role: 'player',
      is_verified: true,
      verification_status: 'VERIFIED',
      is_active: true,
      profile: { jersey_number: 12, position: 'Milieu relayeur' },
      documents: [],
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  const mockEvent: TeamEvent = {
    id: 'event-101',
    title: 'ProDay FC vs Paris Saint-Germain',
    event_type: 'competition',
    organizer_uid: 'coach-1',
    organizer_name: 'Zinédine Zidane',
    club_id: 'club-proday',
    club_name: 'ProDay FC',
    starts_at: new Date('2026-10-15T15:00:00Z'),
    city: 'Paris',
    location_label: 'Parc des Princes - Terrain Honneur',
    invitee_uids: ['player-gk', 'player-cb', 'player-mid', 'player-att', 'player-sub1'],
    rsvps: {},
    competition_fixture_id: 'fix-99',
    lineup: {
      formation: '4-3-3',
      slots: [
        { uid: 'player-gk', display_name: 'Mike Maignan', role: 'starter', position_label: 'Gardien' },
        { uid: 'player-cb', display_name: 'William Saliba', role: 'starter', position_label: 'Défenseur central' },
        { uid: 'player-mid', display_name: 'Aurélien Tchouaméni', role: 'starter', position_label: 'Milieu défensif' },
        { uid: 'player-att', display_name: 'Kylian Mbappé', role: 'starter', position_label: 'Attaquant' },
        { uid: 'player-sub1', display_name: 'Eduardo Camavinga', role: 'sub', position_label: 'Milieu relayeur' },
      ],
    },
    live_state: {
      status: 'scheduled',
      home_score: 0,
      away_score: 0,
      home_label: 'ProDay FC',
      opponent_name: 'Paris Saint-Germain',
    },
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockTalkBrief: MatchTalkBrief = {
    id: 'talk-101',
    event_id: 'event-101',
    title: 'Causerie d’avant-match - Choc au sommet',
    match_objective: 'Prendre les 3 points avec intensité et pressing haut dès la première minute',
    key_points: [
      'Pressing étouffant dès la perte de balle',
      'Verticalité vers Kylian dans les couloirs',
      'Solidité du bloc défensif à 25 mètres',
    ],
    formation: '4-3-3 Attaque',
    opponent_notes: 'Paris Saint-Germain vulnérable dans le dos des latéraux',
    tactical_phase_ids: [],
    messages_by_uid: {
      'player-att': 'Focalise-toi sur les appels tranchants au premier poteau.',
    },
    clips: [],
    consignes: [],
    shared: true,
    created_by: 'coach-1',
    updated_at: new Date(),
    phase_instructions: {
      attack: [
        'Écarter les lignes et percuter dans les 30 derniers mètres',
        'Centres à mi-hauteur au premier poteau',
      ],
      defense: [
        'Bloc médian compact et agressivité sur les seconds ballons',
        'Cadrer le porteur sans se jeter',
      ],
    },
    set_pieces: {
      penalties: ['Kylian Mbappé (N°10)', 'Aurélien Tchouaméni (N°8)'],
      corners_left: ['Kylian Mbappé (Pied droit)'],
      corners_right: ['Aurélien Tchouaméni (Pied gauche)'],
      free_kicks_direct: ['Kylian Mbappé (Axe & distance)'],
      first_post_roles: ['William Saliba (Coupe agressive 1er poteau)'],
    },
  };

  describe('generateMatchSheetHtml', () => {
    it('génère un document HTML A4 valide avec les balises structurelles requises', () => {
      const html = generateMatchSheetHtml(
        mockEvent,
        {
          starterUids: ['player-gk', 'player-cb', 'player-mid', 'player-att'],
          subUids: ['player-sub1'],
        },
        mockMembers,
        mockTalkBrief,
        mockCoach,
      );

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="fr">');
      expect(html).toContain('</html>');
      expect(html).toContain('ProDay Football');
      expect(html).toContain('Feuille de Match');
    });

    it('inclut le format A4 CSS pour l’impression et le PDF', () => {
      const html = generateMatchSheetHtml(
        mockEvent,
        {
          starterUids: ['player-gk'],
          subUids: [],
        },
        mockMembers,
      );

      expect(html).toMatch(/@page\s*\{\s*size:\s*A4\s*portrait/i);
      expect(html).toContain('-webkit-print-color-adjust: exact');
      expect(html).toContain('print-color-adjust: exact');
    });

    it('affiche correctement l’en-tête, les logos, la date, le lieu, la compétition et les équipes', () => {
      const html = generateMatchSheetHtml(
        mockEvent,
        {
          starterUids: ['player-gk'],
          subUids: [],
        },
        mockMembers,
        mockTalkBrief,
        mockCoach,
      );

      // Compétition
      expect(html).toContain('Championnat Officiel');
      // Lieu
      expect(html).toContain('Parc des Princes - Terrain Honneur');
      // Équipes Domicile vs Extérieur
      expect(html).toContain('ProDay FC');
      expect(html).toContain('Paris Saint-Germain');
      expect(html).toContain('VS');
      // Logo vectoriel ProDay
      expect(html).toContain('<svg class="brand-logo-svg"');
      // Schéma tactique
      expect(html).toContain('4-3-3 Attaque');
    });

    it('affiche les joueurs titulaires et remplaçants avec leurs numéros et postes', () => {
      const html = generateMatchSheetHtml(
        mockEvent,
        {
          starterUids: ['player-gk', 'player-cb', 'player-att'],
          subUids: ['player-sub1'],
        },
        mockMembers,
        mockTalkBrief,
        mockCoach,
      );

      // Titulaires
      expect(html).toContain('XI Titulaires');
      expect(html).toContain('Mike Maignan');
      expect(html).toContain('William Saliba');
      expect(html).toContain('Kylian Mbappé');
      expect(html).toContain('16');
      expect(html).toContain('Gardien');
      expect(html).toContain('10');

      // Remplaçants
      expect(html).toContain('Banc des Remplaçants');
      expect(html).toContain('Eduardo Camavinga');
      expect(html).toContain('12');
      expect(html).toContain('Milieu relayeur');
    });

    it('affiche la section causerie avec les 3 consignes clés, les phases et les coups arrêtés', () => {
      const html = generateMatchSheetHtml(
        mockEvent,
        {
          starterUids: ['player-gk', 'player-cb'],
          subUids: [],
        },
        mockMembers,
        mockTalkBrief,
        mockCoach,
      );

      // Causerie
      expect(html).toContain("Causerie d'Avant-Match");
      // 3 principes de jeu
      expect(html).toContain('Pressing étouffant dès la perte de balle');
      expect(html).toContain('Verticalité vers Kylian dans les couloirs');
      expect(html).toContain('Solidité du bloc défensif à 25 mètres');

      // Phases Attaque & Défense
      expect(html).toContain('Phase Attaque');
      expect(html).toContain('Phase Défense');
      expect(html).toContain('Écarter les lignes et percuter dans les 30 derniers mètres');
      expect(html).toContain('Bloc médian compact et agressivité sur les seconds ballons');

      // Coups arrêtés
      expect(html).toContain('Coups de Pied Arrêtés');
      expect(html).toContain('Penaltys :');
      expect(html).toContain('Corners Gauche :');
      expect(html).toContain('Corners Droit :');
      expect(html).toContain('C. Francs Directs :');
      expect(html).toContain('1er Poteau / Rôles :');
      expect(html).toContain('William Saliba (Coupe agressive 1er poteau)');
    });

    it('affiche le staff encadrant et les contacts d’urgence officiels', () => {
      const html = generateMatchSheetHtml(
        mockEvent,
        {
          starterUids: ['player-gk'],
          subUids: [],
        },
        mockMembers,
        mockTalkBrief,
        mockCoach,
      );

      // Staff
      expect(html).toContain('Staff Technique');
      expect(html).toContain('Zinédine Zidane');
      expect(html).toContain('UEFA Pro License');
      expect(html).toContain('06 12 34 56 78');

      // Contacts d'urgence
      expect(html).toContain('SAMU 15');
      expect(html).toContain('POMPIERS 18');
      expect(html).toContain('URGENCES 112');
      expect(html).toContain('Défibrillateur');
    });

    it('gère gracieusement les valeurs manquantes avec des fallbacks robustes', () => {
      const minimalEvent: TeamEvent = {
        id: 'e-minimal',
        title: 'Entraînement',
        event_type: 'other',
        organizer_uid: 'org-1',
        organizer_name: 'Coach Inconnu',
        starts_at: new Date('invalid date'),
        city: '',
        invitee_uids: [],
        rsvps: {},
        created_at: new Date(),
        updated_at: new Date(),
      };

      const html = generateMatchSheetHtml(
        minimalEvent,
        { starterUids: [], subUids: [] },
        [],
      );

      expect(html).toContain('Date à définir');
      expect(html).toContain('Aucun titulaire assigné');
      expect(html).toContain('Aucun remplaçant');
      expect(html).toContain('3 Principes de Jeu Clés');
      expect(html).toContain('SAMU 15');
    });
  });

  describe('exportOrPrintMatchSheet', () => {
    it('utilise window.print sur le Web', async () => {
      const origPlatform = Platform.OS;
      (Platform as any).OS = 'web';

      const mockPrint = jest.fn();
      const mockWrite = jest.fn();
      const mockClose = jest.fn();
      const mockFocus = jest.fn();

      const mockWindow = {
        document: {
          write: mockWrite,
          close: mockClose,
        },
        focus: mockFocus,
        print: mockPrint,
      };

      const origWindowOpen = (globalThis as any).window?.open;
      if (!(globalThis as any).window) {
        (globalThis as any).window = {};
      }
      (globalThis as any).window.open = jest.fn().mockReturnValue(mockWindow);

      jest.useFakeTimers();

      try {
        await exportOrPrintMatchSheet(
          mockEvent,
          { starterUids: ['player-gk'], subUids: [] },
          mockMembers,
          mockTalkBrief,
          mockCoach,
        );

        expect((globalThis as any).window.open).toHaveBeenCalledWith('', '_blank');
        expect(mockWrite).toHaveBeenCalled();
        expect(mockClose).toHaveBeenCalled();
        expect(mockFocus).toHaveBeenCalled();

        jest.advanceTimersByTime(300);
        expect(mockPrint).toHaveBeenCalled();
      } finally {
        (globalThis as any).window.open = origWindowOpen;
        (Platform as any).OS = origPlatform;
        jest.useRealTimers();
      }
    });

    it('utilise Share.share sur mobile avec le résumé du match', async () => {
      const origPlatform = Platform.OS;
      (Platform as any).OS = 'ios';

      const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });

      try {
        await exportOrPrintMatchSheet(
          mockEvent,
          {
            starterUids: ['player-gk', 'player-cb'],
            subUids: ['player-sub1'],
          },
          mockMembers,
          mockTalkBrief,
          mockCoach,
        );

        expect(shareSpy).toHaveBeenCalledTimes(1);
        const callArgs = shareSpy.mock.calls[0][0];
        expect(callArgs.title).toContain('Feuille de match');
        expect(callArgs.message).toContain('FEUILLE DE MATCH PRODAY');
        expect(callArgs.message).toContain('Mike Maignan');
        expect(callArgs.message).toContain('Eduardo Camavinga');
        expect(callArgs.message).toContain('CONSIGNES CLÉS DU MATCH');
        expect(callArgs.message).toContain('Zinédine Zidane');
      } finally {
        shareSpy.mockRestore();
        (Platform as any).OS = origPlatform;
      }
    });
  });

  describe('CoachMatchTalkPresentationModal component', () => {
    it('monte et affiche les onglets tactiques sans erreur', async () => {
      const React = require('react');
      const renderer = require('react-test-renderer');

      let tree: any;
      await renderer.act(async () => {
        tree = renderer.create(
          React.createElement(CoachMatchTalkPresentationModal, {
            visible: true,
            onClose: jest.fn(),
            event: mockEvent,
            lineup: {
              starterUids: ['player-gk', 'player-cb', 'player-mid', 'player-att'],
              subUids: ['player-sub1'],
            },
            members: mockMembers,
            talkBrief: mockTalkBrief,
            coachProfile: mockCoach,
          }),
        );
      });

      expect(tree).toBeDefined();
      const str = JSON.stringify(tree.toJSON());
      expect(str).toContain('VESTIAIRE LIVE');
      expect(str).toContain('Le Onze');
      expect(str).toContain('Consignes clés');
      expect(str).toContain('Coups Arrêtés');
      expect(str).toContain('Imprimer la feuille de match');
      expect(str).toContain('Mike');
      expect(str).toContain('William');
      expect(str).toContain('Eduardo');
    });
  });
});
