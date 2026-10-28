/**
 * WAVE 4 — P-005 Entraînements + SP-004…007 : garde-fous proto / GAP-PROPOSAL.
 */
import fs from 'fs';
import path from 'path';

const read = (relative: string) =>
  fs.readFileSync(path.resolve(__dirname, '..', relative), 'utf8');

describe('WAVE 4 — Entraînements (P-005 + SP-004…007)', () => {
  const home = read('features/coach/training/CoachTrainingHome.tsx');
  const composer = read('features/coach/training/CoachTrainingComposerScreen.tsx');
  const field = read('features/coach/training/CoachFieldModeOverlay.tsx');
  const debrief = read('features/coach/training/CoachSessionDebriefModal.tsx');
  const library = read('features/coach/training/CoachExerciseLibraryModal.tsx');

  it('aligne l’accueil sur proto training (CTA + À venir + bibliothèque)', () => {
    expect(home).toContain('Préparer une séance');
    expect(home).toContain('À venir');
    expect(home).toContain('Votre bibliothèque');
    expect(home).toContain('Parcourir les exercices');
    expect(home).not.toContain('Séances à thème animées');
    expect(home).toContain('testID="coach-training-home"');
    // Proto home = list rows, pas de grille « Séances vedettes » / Mode terrain.
    expect(home).not.toContain('Séances vedettes');
    expect(home).not.toContain('Mode terrain (Chrono & Bilan)');
    expect(home).not.toContain('Composer ma séance');
  });

  it('expose le builder proto sans CTA proposal (GAP-PROPOSAL)', () => {
    expect(home).toContain('Trouver une séance adaptée');
    expect(home).toContain('Composer librement avec la bibliothèque');
    expect(home).toContain('GAP-PROPOSAL');
    expect(home).not.toMatch(/setView\(['"]proposal['"]\)/);
    expect(home).not.toContain('Votre proposition');
    expect(home).toContain('desktopFormSplit');
    expect(home).toContain('testID="coach-training-builder"');
  });

  it('impose les layouts desktop training / builder / session', () => {
    expect(home).toContain('desktopFormSplit');
    expect(home).toContain('desktopTrainingLayout');
    expect(home).toContain('coach-training-home-aside');
    expect(home).toContain('coach-training-builder-aside');
    expect(composer).toContain('desktopTrainingLayout');
    expect(composer).toContain('composer-session-preview');
  });

  it('préserve save / Firebase et création libre (builder → free)', () => {
    expect(home).toContain('CoachTrainingComposerScreen');
    expect(home).toContain('<CoachTrainingFreeEditor onDone={onDone} />');
    expect(home).toContain('accessibilityLabel="Création libre"');
    expect(home).toContain("setView('free')");
    expect(home).toContain('Composer librement avec la bibliothèque');
    expect(composer).toContain('teamEventsService');
    expect(composer).toContain('toCreateTrainingEventInput');
  });

  it('aligne le mode terrain sur proto field (atelier courant + Suivant + bilan)', () => {
    expect(field).toContain('Atelier');
    expect(field).toContain('Suivant');
    expect(field).toContain('Terminer et faire le bilan');
    expect(field).toContain('La consigne essentielle');
    expect(field).toContain('styles.timerColumn');
    expect(field).toContain('styles.schemaColumn');
    expect(field).toContain('<TacticalSchemaPreview scene={exercise.tacticalScene} />');
  });

  it('aligne le bilan sur proto debrief (présences + mention + enregistrement)', () => {
    expect(debrief).toContain('Confirmez les présences');
    expect(debrief).toContain('Mention du jour');
    expect(debrief).toContain('Enregistrer le bilan');
    expect(debrief).toContain('coachSessionDebriefService.saveDebrief');
    expect(debrief).toContain('debrief-presences-first');
    // Mobile : CTA en flux après le formulaire (pas de flex:1 / sticky overlap RN Web).
    expect(debrief).toContain('debrief-save-in-flow');
    expect(debrief).toContain('desktop ? { flex: 1.35 }');
    expect(debrief).toContain('desktop ? { flex: 1 }');
  });

  it('conserve bibliothèque / exercice (search + filtres + schéma/vidéo)', () => {
    expect(library).toContain('Rechercher un exercice');
    expect(library).toContain("'Tous'");
    expect(library).toContain("'Conservation'");
    expect(library).toContain("'Finition'");
    expect(library).toContain('Schéma animé');
    expect(library).toContain('Personnaliser cet exercice');
    expect(library).toContain('Présentation vestiaire');
  });
});
