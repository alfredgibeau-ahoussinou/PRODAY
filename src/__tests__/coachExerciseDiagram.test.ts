jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: jest.fn(),
}));
jest.mock('../lib/firebase', () => ({ getFirebaseAuth: jest.fn(), getDb: jest.fn() }));
jest.mock('../config/firebase', () => ({ isFirebaseConfigured: jest.fn(() => false) }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  canEditDiagram,
  canViewDiagram,
  cloneDiagram,
  createEmptyDiagram,
  createPresetDiagram,
  normalizeDiagramData,
  type ExerciseDiagramData,
} from '../models/ExerciseDiagram';
import { coachDiagramsService, COACH_DIAGRAMS_STORAGE_KEY } from '../services/coachDiagrams.service';
import { generateDiagramHtml, buildStandaloneSvgString } from '../utils/coachDiagramExport';

describe('Modèle ExerciseDiagram & Normalisation', () => {
  it('crée un schéma vide valide avec repère normalisé', () => {
    const diag = createEmptyDiagram('Circuit test', 'half', 'coach-123', 'club-456', 'team-789');
    expect(diag.id).toMatch(/^diag-/);
    expect(diag.name).toBe('Circuit test');
    expect(diag.pitchTemplate).toBe('half');
    expect(diag.width).toBe(100);
    expect(diag.height).toBe(64);
    expect(diag.elements).toEqual([]);
    expect(diag.ownerUid).toBe('coach-123');
    expect(diag.clubId).toBe('club-456');
    expect(diag.teamId).toBe('team-789');
    expect(diag.legend).toHaveLength(3);
  });

  it('normalise et assainit des données corrompues sans planter', () => {
    const corrupted = {
      id: null,
      name: '  Schéma sale   ',
      pitchTemplate: 'inconnu',
      elements: [
        null,
        { id: 'el-1', type: 'player', x: -50, y: 999, team: 'home' },
        { id: 'el-2', type: 'zone', x: 20, y: 30, width: 40, height: 20 },
      ],
      stages: 'pas un tableau',
    };

    const normalized = normalizeDiagramData(corrupted);
    expect(normalized.id).toBeTruthy();
    expect(normalized.name).toBe('Schéma sale');
    expect(normalized.pitchTemplate).toBe('half'); // repli par défaut
    expect(normalized.elements).toHaveLength(2);
    // Coordonnées bornées
    expect((normalized.elements[0] as any).x).toBe(0);
    expect((normalized.elements[0] as any).y).toBe(64);
    expect(normalized.stages).toEqual([]);
  });
});

describe('Générateur d’ateliers prédéfinis (createPresetDiagram)', () => {
  it('génère un rondo complet avec zone 4v2, cônes et défenseurs', () => {
    const rondo = createPresetDiagram('rondo');
    expect(rondo.pitchTemplate).toBe('box');
    expect(rondo.isTemplate).toBe(true);

    const zones = rondo.elements.filter((e) => e.type === 'zone');
    const cones = rondo.elements.filter((e) => e.type === 'equipment' && (e as any).equipmentType === 'cone');
    const homePlayers = rondo.elements.filter((e) => e.type === 'player' && (e as any).team === 'home');
    const awayPlayers = rondo.elements.filter((e) => e.type === 'player' && (e as any).team === 'away');

    expect(zones).toHaveLength(1);
    expect(cones).toHaveLength(4);
    expect(homePlayers).toHaveLength(4);
    expect(awayPlayers).toHaveLength(2);
    expect(rondo.stages).toHaveLength(2);
  });

  it('génère un atelier de finition avec but officiel, gardien, mannequins et tirs', () => {
    const fin = createPresetDiagram('finishing');
    expect(fin.pitchTemplate).toBe('half');

    const goals = fin.elements.filter((e) => e.type === 'equipment' && (e as any).equipmentType === 'goal');
    const gk = fin.elements.find((e) => e.type === 'player' && (e as any).role === 'GB');
    const mannequins = fin.elements.filter((e) => e.type === 'equipment' && (e as any).equipmentType === 'mannequin');
    const shots = fin.elements.filter((e) => e.type === 'arrow' && (e as any).kind === 'shot');

    expect(goals).toHaveLength(1);
    expect(gk).toBeDefined();
    expect(mannequins).toHaveLength(2);
    expect(shots.length).toBeGreaterThanOrEqual(1);
  });

  it('génère un circuit technique avec mini-but et parcours de slalom', () => {
    const cir = createPresetDiagram('circuit');
    const miniGoals = cir.elements.filter((e) => e.type === 'equipment' && (e as any).equipmentType === 'mini_goal');
    const cones = cir.elements.filter((e) => e.type === 'equipment' && (e as any).equipmentType === 'cone');

    expect(miniGoals).toHaveLength(1);
    expect(cones).toHaveLength(4);
  });
});

describe('Duplication & Isolation des schémas (cloneDiagram)', () => {
  it('génère de nouveaux identifiants uniques et isole la copie', () => {
    const original = createPresetDiagram('rondo', 'Mon Rondo Original', 'coach-1');
    const clone = cloneDiagram(original, 'Rondo Équipe B', 'coach-2');

    expect(clone.id).not.toBe(original.id);
    expect(clone.name).toBe('Rondo Équipe B');
    expect(clone.ownerUid).toBe('coach-2');
    expect(clone.isTemplate).toBe(false);

    // Vérification que tous les éléments ont de nouveaux IDs
    expect(clone.elements).toHaveLength(original.elements.length);
    for (let i = 0; i < clone.elements.length; i++) {
      expect(clone.elements[i].id).not.toBe(original.elements[i].id);
    }

    // Mutation de la copie ne touche pas l'original
    (clone.elements[0] as any).x = 99;
    expect((original.elements[0] as any).x).not.toBe(99);
  });
});

describe('Droits d’accès & Confidentialité (canView / canEdit)', () => {
  const adminUser = { uid: 'admin-1', isAdmin: true };
  const ownerUser = { uid: 'coach-1', clubId: 'club-A', teamId: 'team-U17' };
  const teammateUser = { uid: 'coach-2', clubId: 'club-A', teamId: 'team-U17' };
  const otherClubUser = { uid: 'coach-99', clubId: 'club-Z', teamId: 'team-Z' };

  it('les templates système sont consultables par tous mais non éditables directement', () => {
    const tpl = createPresetDiagram('rondo');
    expect(canViewDiagram(tpl, otherClubUser)).toBe(true);
    expect(canEditDiagram(tpl, otherClubUser)).toBe(false);
    expect(canEditDiagram(tpl, adminUser)).toBe(true);
  });

  it('un schéma privé n’est visible et éditable que par son créateur', () => {
    const privateDiag: ExerciseDiagramData = {
      ...createEmptyDiagram('Schéma Secret', 'half', 'coach-1', 'club-A', 'team-U17'),
      isSharedWithClub: false,
      isSharedWithTeam: false,
    };

    expect(canViewDiagram(privateDiag, ownerUser)).toBe(true);
    expect(canEditDiagram(privateDiag, ownerUser)).toBe(true);

    expect(canViewDiagram(privateDiag, teammateUser)).toBe(false);
    expect(canEditDiagram(privateDiag, teammateUser)).toBe(false);

    expect(canViewDiagram(privateDiag, otherClubUser)).toBe(false);
  });

  it('un schéma partagé avec l’équipe est consultable par les coachs de l’équipe mais modifiable uniquement par le propriétaire', () => {
    const teamDiag: ExerciseDiagramData = {
      ...createEmptyDiagram('Schéma Équipe', 'half', 'coach-1', 'club-A', 'team-U17'),
      isSharedWithTeam: true,
    };

    expect(canViewDiagram(teamDiag, teammateUser)).toBe(true);
    expect(canEditDiagram(teamDiag, teammateUser)).toBe(false);
    expect(canViewDiagram(teamDiag, otherClubUser)).toBe(false);
  });
});

describe('Service de persistance (coachDiagramsService)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('liste les gabarits système et intègre les schémas enregistrés par le coach', async () => {
    const user = { uid: 'coach-test', clubId: 'club-1' };
    const listBefore = await coachDiagramsService.listDiagrams(user);
    expect(listBefore.length).toBeGreaterThanOrEqual(5);

    const custom = createEmptyDiagram('Mon Atelier Spécifique', 'half', user.uid, user.clubId);
    await coachDiagramsService.saveDiagram(custom, user);

    const listAfter = await coachDiagramsService.listDiagrams(user);
    expect(listAfter.some((d) => d.name === 'Mon Atelier Spécifique')).toBe(true);
  });

  it('duplique un schéma pour créer une variante sans altérer le schéma source', async () => {
    const user = { uid: 'coach-test' };
    const initial = createPresetDiagram('rondo', 'Rondo Source', user.uid);
    const savedInitial = await coachDiagramsService.saveDiagram(initial, user);

    const duplicated = await coachDiagramsService.duplicateDiagram(savedInitial.id, 'Rondo V2', user);
    expect(duplicated.id).not.toBe(savedInitial.id);
    expect(duplicated.name).toBe('Rondo V2');

    // Vérifie qu'AsyncStorage contient bien les deux schémas distincts
    const raw = await AsyncStorage.getItem(COACH_DIAGRAMS_STORAGE_KEY);
    const all = JSON.parse(raw || '[]');
    expect(all.some((d: any) => d.id === savedInitial.id)).toBe(true);
    expect(all.some((d: any) => d.id === duplicated.id)).toBe(true);
  });

  it('interdit la suppression d’un schéma si l’utilisateur n’est pas le propriétaire', async () => {
    const owner = { uid: 'coach-owner' };
    const hacker = { uid: 'coach-other' };
    const diag = createEmptyDiagram('Mon Schéma', 'half', owner.uid);
    await coachDiagramsService.saveDiagram(diag, owner);

    await expect(coachDiagramsService.deleteDiagram(diag.id, hacker)).rejects.toThrow();
  });
});

describe('Exportation imprimable & HTML / SVG (coachDiagramExport)', () => {
  it('génère un code SVG autonome avec viewBox et éléments vectoriels', () => {
    const diag = createPresetDiagram('finishing', 'Atelier Centres');
    const svg = buildStandaloneSvgString(diag);

    expect(svg).toContain('<svg viewBox="0 0 100 64"');
    expect(svg).toContain('Pelouse avec bandes d\'herbe');
    expect(svg).toContain('<circle');
    expect(svg).toContain('<marker');
  });

  it('génère un document HTML complet avec styles d’impression, consigne et légende', () => {
    const diag = createPresetDiagram('rondo', 'Conservation Sous Pression');
    const html = generateDiagramHtml(diag, {
      durationMin: 25,
      intensity: 'Intense',
      clubName: 'US Ormesson',
      coachName: 'Coach Gibeau',
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Conservation Sous Pression');
    expect(html).toContain('US Ormesson');
    expect(html).toContain('Coach Gibeau');
    expect(html).toContain('25 min');
    expect(html).toContain('@media print');
    expect(html).toContain('<svg');
  });
});
