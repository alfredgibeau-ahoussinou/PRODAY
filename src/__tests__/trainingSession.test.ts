import {
  totalSessionMinutes,
  phaseLabel,
  TRAINING_OBJECTIVE_LABELS,
  TRAINING_LEVEL_LABELS,
  COLLECTIVE_OBJECTIVES,
  INDIVIDUAL_OBJECTIVES,
  COLLECTIVE_DURATIONS,
  INDIVIDUAL_DURATIONS,
  EQUIPMENT_OPTIONS,
  type TrainingSession,
  type TrainingPhase,
} from '../models/TrainingSession';

describe('TrainingSession model', () => {
  const samplePhases: TrainingPhase[] = [
    {
      name: 'warmup',
      label: 'Échauffement',
      duration_min: 10,
      exercises: [{ name: 'Rondo', description: 'Passes en cercle' }],
    },
    {
      name: 'exercises',
      label: 'Exercices',
      duration_min: 30,
      exercises: [
        { name: 'Passes courtes', description: '2 touches', reps: 10, sets: 3, rest_sec: 30 },
      ],
    },
    {
      name: 'game',
      label: 'Opposition',
      duration_min: 20,
      exercises: [{ name: '5v5', description: 'Jeu réduit' }],
    },
    {
      name: 'cooldown',
      label: 'Retour au calme',
      duration_min: 10,
      exercises: [{ name: 'Étirements', description: 'Statiques 20s' }],
    },
  ];

  const session: TrainingSession = {
    id: 'test-1',
    type: 'collective',
    objective: 'technique',
    duration_min: 70,
    level: 'intermediate',
    player_count: 18,
    phases: samplePhases,
    generated_by: 'ai',
    created_at: new Date(),
  };

  it('calculates total session minutes from phases', () => {
    expect(totalSessionMinutes(session)).toBe(70);
  });

  it('returns correct phase labels', () => {
    expect(phaseLabel('warmup')).toBe('Échauffement');
    expect(phaseLabel('exercises')).toBe('Exercices');
    expect(phaseLabel('game')).toBe('Opposition');
    expect(phaseLabel('cooldown')).toBe('Retour au calme');
  });

  it('has labels for all objectives', () => {
    for (const obj of [...COLLECTIVE_OBJECTIVES, ...INDIVIDUAL_OBJECTIVES]) {
      expect(TRAINING_OBJECTIVE_LABELS[obj]).toBeTruthy();
    }
  });

  it('has labels for all levels', () => {
    for (const lvl of ['beginner', 'intermediate', 'advanced'] as const) {
      expect(TRAINING_LEVEL_LABELS[lvl]).toBeTruthy();
    }
  });

  it('has valid collective durations', () => {
    expect(COLLECTIVE_DURATIONS).toEqual([60, 75, 90]);
  });

  it('has valid individual durations', () => {
    expect(INDIVIDUAL_DURATIONS).toEqual([15, 30, 45, 60]);
  });

  it('has equipment options', () => {
    expect(EQUIPMENT_OPTIONS.length).toBeGreaterThanOrEqual(5);
    expect(EQUIPMENT_OPTIONS).toContain('ballon');
    expect(EQUIPMENT_OPTIONS).toContain('rien');
  });

  it('supports individual session type', () => {
    const individual: TrainingSession = {
      id: 'ind-1',
      player_uid: 'p1',
      type: 'individual',
      objective: 'pied_faible',
      duration_min: 30,
      level: 'beginner',
      phases: [
        { name: 'warmup', label: 'Échauffement', duration_min: 5, exercises: [] },
        { name: 'exercises', label: 'Exercices', duration_min: 20, exercises: [] },
        { name: 'cooldown', label: 'Retour au calme', duration_min: 5, exercises: [] },
      ],
      generated_by: 'ai',
      individual_params: {
        available_duration_min: 30,
        equipment: ['ballon'],
        partner: false,
        position: 'MC',
      },
      created_at: new Date(),
    };
    expect(totalSessionMinutes(individual)).toBe(30);
    expect(individual.individual_params?.partner).toBe(false);
  });
});
