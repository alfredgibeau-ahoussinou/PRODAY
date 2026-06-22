import type { HealthState } from '../../../core/types/health';

export type HealthProgramId = 'recovery' | 'match_prep' | 'prevention' | 'mental';

export interface HealthProgramDay {
  day: number;
  title: string;
  task: string;
  durationMin: number;
}

export interface HealthProgram {
  id: HealthProgramId;
  label: string;
  description: string;
  days: HealthProgramDay[];
}

const PROGRAMS: Record<HealthProgramId, HealthProgram> = {
  recovery: {
    id: 'recovery',
    label: 'Récupération 7 jours',
    description: 'Retour progressif après charge élevée ou fatigue.',
    days: [
      { day: 1, title: 'Repos actif', task: 'Marche 20 min + étirements légers', durationMin: 25 },
      { day: 2, title: 'Mobilité', task: 'Circuit hanches/chevilles — 15 min', durationMin: 15 },
      { day: 3, title: 'Renforcement léger', task: 'Gainage + proprioception', durationMin: 20 },
      { day: 4, title: 'Footing léger', task: 'Course continue Z2 — 25 min', durationMin: 25 },
      { day: 5, title: 'Technique', task: 'Touches de balle + passes courtes', durationMin: 30 },
      { day: 6, title: 'Activation', task: 'Échauffement match + petit-sided game', durationMin: 35 },
      { day: 7, title: 'Bilan', task: 'Auto-évaluation fatigue + RDV kiné si besoin', durationMin: 15 },
    ],
  },
  match_prep: {
    id: 'match_prep',
    label: 'Prépa match 7 jours',
    description: 'Optimiser la forme avant un match important.',
    days: [
      { day: 1, title: 'Force', task: 'Renforcement bas du corps', durationMin: 30 },
      { day: 2, title: 'Vitesse', task: 'Sprints courts + récupération longue', durationMin: 25 },
      { day: 3, title: 'Tactique', task: 'Vidéo + passes en mouvement', durationMin: 40 },
      { day: 4, title: 'Endurance', task: 'Footing modéré 30 min', durationMin: 30 },
      { day: 5, title: 'Affûtage', task: 'Séance courte haute intensité', durationMin: 20 },
      { day: 6, title: 'Veille', task: 'Activation légère + sommeil prioritaire', durationMin: 15 },
      { day: 7, title: 'Match day', task: 'Échauffement structuré + hydratation', durationMin: 25 },
    ],
  },
  prevention: {
    id: 'prevention',
    label: 'Prévention blessure',
    description: 'Routine hebdo pour joueurs réguliers.',
    days: [
      { day: 1, title: 'Échauffement type', task: 'Routine FIFA 11+ simplifiée', durationMin: 20 },
      { day: 2, title: 'Renfo', task: 'Chaîne postérieure + core', durationMin: 25 },
      { day: 3, title: 'Souplesse', task: 'Yoga foot — 20 min', durationMin: 20 },
      { day: 4, title: 'Repos', task: 'Marche + auto-massage', durationMin: 20 },
      { day: 5, title: 'Pliométrie légère', task: 'Sauts contrôlés', durationMin: 15 },
      { day: 6, title: 'Match/entraînement', task: 'Appliquer l’échauffement complet', durationMin: 30 },
      { day: 7, title: 'Check-in', task: 'Noter douleurs et charge ressentie', durationMin: 10 },
    ],
  },
  mental: {
    id: 'mental',
    label: 'Mental 7 jours',
    description: 'Confiance, focus et gestion du stress avant match.',
    days: [
      { day: 1, title: 'Respiration', task: 'Cohérence cardiaque 5-5-5 — 10 min', durationMin: 10 },
      { day: 2, title: 'Visualisation', task: 'Scénario match réussi — yeux fermés', durationMin: 15 },
      { day: 3, title: 'Focus', task: 'Exercice attention sélective — 12 min', durationMin: 12 },
      { day: 4, title: 'Routine pré-match', task: 'Écrire votre rituel personnel', durationMin: 10 },
      { day: 5, title: 'Gestion pression', task: 'Reformulation positive — 3 situations', durationMin: 15 },
      { day: 6, title: 'Sommeil', task: 'Couvre-feu écrans + relaxation guidée', durationMin: 20 },
      { day: 7, title: 'Bilan mental', task: 'Auto-évaluation confiance 1–10 + notes', durationMin: 10 },
    ],
  },
};

export function listHealthPrograms(): HealthProgram[] {
  return Object.values(PROGRAMS);
}

/** Programme recommandé selon l'état santé (pattern Nike Training Club). */
export function pickHealthProgram(healthState: HealthState): HealthProgram {
  if (
    healthState === 'INJURY_RISK' ||
    healthState === 'OVERLOADED' ||
    healthState === 'FATIGUED' ||
    healthState === 'RECOVERY'
  ) {
    return PROGRAMS.recovery;
  }
  if (healthState === 'ACTIVE') return PROGRAMS.match_prep;
  return PROGRAMS.prevention;
}

/** Programme mental — toujours disponible indépendamment de l'état physique. */
export function pickMentalProgram(): HealthProgram {
  return PROGRAMS.mental;
}

export function programProgress(completedDays: number[], total = 7): number {
  return Math.round((completedDays.length / total) * 100);
}
