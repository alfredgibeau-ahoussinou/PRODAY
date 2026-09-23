/**
 * Planificateur d'entraînement — modèle pur + garde-fous de la refonte.
 *
 * L'ancienne page affichait une séance fictive (« Séance N°48 », RPE 7.5,
 * 18 joueurs attendus) et un « générateur IA » qui simule un chargement avec
 * un `setTimeout`. La refonte déplace le modèle dans `utils/coachTrainingPlanner`
 * (testable sans RN), branche la génération sur le service Copilote réel et la
 * programmation sur `teamEventsService.create`.
 */

import fs from 'fs';
import path from 'path';
import {
  INTENSITY_LABELS,
  THEMATIC_DRILLS_LIBRARY,
  defaultSession,
  fromTemplate,
  sessionExercisesFromPhases,
  sessionExercisesFromPlan,
  sessionSummary,
} from '../utils/coachTrainingPlanner';
import { composedPlanFromPrompt } from '../utils/coachSessionPrompt';
import type { TrainingPhase } from '../models/TrainingSession';

const ROOT = path.resolve(__dirname, '..');
function read(relative: string): string {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

const SCREEN = 'screens/coach/CoachTrainingPlannerScreen.tsx';

describe('Bibliothèque d\u2019ateliers — modèle pur', () => {
  it('conserve le contenu pédagogique complet (11 ateliers, 6 thèmes)', () => {
    expect(THEMATIC_DRILLS_LIBRARY).toHaveLength(11);
    const themes = new Set(THEMATIC_DRILLS_LIBRARY.map((t) => t.theme));
    expect(themes.size).toBe(6);
  });

  it('defaultSession retourne des instances uniques, modifiables sans toucher la bibliothèque', () => {
    const session = defaultSession();
    expect(session).toHaveLength(5);
    const ids = new Set(session.map((e) => e.id));
    expect(ids.size).toBe(5);
    /** Copie, pas référence : muter la séance ne mute pas la bibliothèque. */
    expect(session[0].id).not.toBe(THEMATIC_DRILLS_LIBRARY[0].id);
    session[0].durationMin = 99;
    expect(THEMATIC_DRILLS_LIBRARY[0].durationMin).not.toBe(99);
  });

  it('fromTemplate instancie avec un identifiant unique', () => {
    const a = fromTemplate(THEMATIC_DRILLS_LIBRARY[0], 1);
    const b = fromTemplate(THEMATIC_DRILLS_LIBRARY[0], 2);
    expect(a.id).not.toBe(b.id);
    expect(a.name).toBe(b.name);
  });
});

describe('sessionSummary — l\u2019en-tête n\u2019affiche que du dérivé', () => {
  it('somme les durées et révèle l\u2019intensité dominante', () => {
    const summary = sessionSummary([
      { intensity: 'low', durationMin: 10 },
      { intensity: 'high', durationMin: 20 },
      { intensity: 'high', durationMin: 15 },
    ] as any);
    expect(summary.totalMin).toBe(45);
    expect(summary.count).toBe(3);
    expect(summary.dominant).toBe('high');
  });

  it('séance vide : zéro minute, aucune intensité inventée', () => {
    const summary = sessionSummary([]);
    expect(summary.totalMin).toBe(0);
    expect(summary.count).toBe(0);
    expect(summary.dominant).toBeNull();
  });

  it('les libellés d\u2019intensité existent pour chaque niveau', () => {
    expect(INTENSITY_LABELS.low).toBeTruthy();
    expect(INTENSITY_LABELS.medium).toBeTruthy();
    expect(INTENSITY_LABELS.high).toBeTruthy();
  });
});

describe('Conversion des plans Copilote', () => {
  const phases: TrainingPhase[] = [
    {
      name: 'warmup',
      label: 'Échauffement ciblé',
      duration_min: 15,
      exercises: [{ name: 'Activation', description: 'Mise en route', duration_min: 15 }],
    },
    {
      name: 'exercises',
      label: 'Rondo de conservation',
      duration_min: 30,
      exercises: [{ name: 'Rondo 4v2', description: 'Sous pressing', duration_min: 30 }],
    },
  ];

  it('les phases cloud deviennent des ateliers modifiables', () => {
    const exercises = sessionExercisesFromPhases(phases, { playerCount: 16 });
    expect(exercises).toHaveLength(2);
    expect(exercises[0].name).toBe('Échauffement ciblé');
    expect(exercises[0].intensity).toBe('low');
    expect(exercises[1].drillType).toBe('rondo');
    expect(exercises[1].playerCount).toBe(16);
  });

  it('le brouillon local du Copilote convertit ses blocs en ateliers', () => {
    const plan = composedPlanFromPrompt('Pressing haut et récupération immédiate');
    const exercises = sessionExercisesFromPlan(plan, { playerCount: 14 });
    expect(exercises.length).toBeGreaterThan(0);
    expect(exercises[0].durationMin).toBeGreaterThan(0);
    expect(exercises.every((e) => e.playerCount === 14)).toBe(true);
  });

  it('une durée minimale de 5 minutes est garantie', () => {
    const squeezed: TrainingPhase[] = [
      { name: 'exercises', label: 'Mini', duration_min: 2, exercises: [] },
    ];
    const exercises = sessionExercisesFromPhases(squeezed, { playerCount: 10 });
    expect(exercises[0].durationMin).toBe(5);
  });
});

describe('Refonte de l\u2019écran — garde-fous', () => {
  const source = read(SCREEN);

  it('plus aucun contenu fictif', () => {
    expect(source).not.toContain('SÉANCE N°48');
    expect(source).not.toContain('RPE 7.5');
    expect(source).not.toContain('18 Joueurs attendus');
    expect(source).not.toContain('Terrain Synthétique 1');
  });

  it('le faux générateur IA (setTimeout) est remplacé par le service réel', () => {
    expect(source).not.toContain('setTimeout(');
    expect(source).toContain('aiTrainingService.generateCollective');
    expect(source).toContain('composedPlanFromPrompt');
    expect(source).toContain("setAiSource('local')");
  });

  it('la programmation passe par le calendrier réel', () => {
    expect(source).toContain('teamEventsService.create');
    expect(source).toContain("event_type: 'training'");
    expect(source).toContain('defaultRecommendedSessionStart');
  });

  it('la séance et les modèles sont copiés, jamais mutés', () => {
    expect(source).toContain('defaultSession()');
    expect(source).toContain('fromTemplate(');
  });

  it('l\u2019effectif conviable vient des membres réels du club', () => {
    expect(source).toContain('listMembersByClubId');
    expect(source).toContain("member.role === 'player'");
  });
});
