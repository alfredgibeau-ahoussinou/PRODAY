import {
  composedPlanFromPrompt,
  formatTrainingPhasesAsSessionNotes,
  isCoachCreateSessionIntent,
  parseCoachSessionPrompt,
  phasesFromComposedBlocks,
} from '../utils/coachSessionPrompt';

describe('coachSessionPrompt', () => {
  it('détecte les intentions de création de séance', () => {
    expect(isCoachCreateSessionIntent('crée une séance bloc bas')).toBe(true);
    expect(isCoachCreateSessionIntent('Génère une séance bas du corps')).toBe(true);
    expect(isCoachCreateSessionIntent('séance bloc bas')).toBe(true);
    expect(isCoachCreateSessionIntent('Prochains matchs')).toBe(false);
  });

  it('mappe bloc bas → tactique structuré', () => {
    const parsed = parseCoachSessionPrompt('crée une séance bloc bas 75 min');
    expect(parsed.isCreateIntent).toBe(true);
    expect(parsed.theme).toBe('bloc_bas');
    expect(parsed.objective).toBe('tactique');
    expect(parsed.focus).toMatch(/bloc bas/i);
    expect(parsed.duration_min).toBe(75);

    const plan = composedPlanFromPrompt('crée une séance bloc bas 75 min');
    expect(plan.archetype).toBe('tactical');
    expect(plan.title).toMatch(/bloc bas/i);
    expect(plan.blocks.length).toBeGreaterThanOrEqual(4);
    expect(plan.blocks.some((b) => /bloc|ligne basse/i.test(b.label + (b.objective ?? '')))).toBe(
      true,
    );
    expect(plan.totalMinutes).toBeGreaterThan(0);
    expect(plan.reason).toMatch(/brouillon local/i);
  });

  it('mappe bas du corps / lower body → physique', () => {
    const a = parseCoachSessionPrompt('séance bas du corps');
    expect(a.theme).toBe('physique_bas');
    expect(a.objective).toBe('physique');

    const b = parseCoachSessionPrompt('create lower body session');
    expect(b.theme).toBe('physique_bas');
  });

  it('formate des phases appliquables au session_plan', () => {
    const plan = composedPlanFromPrompt('crée une séance pressing');
    const phases = phasesFromComposedBlocks(plan);
    expect(phases.length).toBe(plan.blocks.filter((b) => b.minutes > 0).length);

    const notes = formatTrainingPhasesAsSessionNotes(phases, {
      focus: plan.focus,
      source: 'local',
      objectiveLabel: 'Tactique',
    });
    expect(notes).toMatch(/brouillon local/i);
    expect(notes).toMatch(/Focus/);
    expect(notes.length).toBeGreaterThan(40);
  });
});
