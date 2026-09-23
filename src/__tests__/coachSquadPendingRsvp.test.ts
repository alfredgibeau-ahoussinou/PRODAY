/**
 * Réponses en attente sur la page Effectif Coach — même logique que l'accueil.
 *
 * Le badge vit **à côté de la convocation du prochain match** et compte les
 * invités sans réponse (`getPendingInviteeUids`, définition partagée avec le
 * Match Center, l'accueil et les rappels) — pas les joueurs « en attente » de
 * l'effectif, qui incluent les membres non convoqués. Le tap déroule la liste
 * nominative avec relance individuelle (`CoachPendingRsvpSheet`, déjà utilisée
 * sur l'accueil).
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');
function read(relative: string): string {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

const HOOK = 'hooks/useCoachSquadRoster.ts';
const SCREEN = 'screens/coach/CoachSquadScreen.tsx';

describe('Hook effectif — le compteur est la définition partagée', () => {
  it('expose pendingInviteeUids dérivé du prochain match via getPendingInviteeUids', () => {
    const source = read(HOOK);
    expect(source).toContain("import { getPendingInviteeUids } from '../models/TeamEvent'");
    expect(source).toContain('pendingInviteeUids: string[];');
    expect(source).toContain(
      '() => (nextMatch ? getPendingInviteeUids(nextMatch) : []),',
    );
  });

  it('le compteur lit les RSVP de la convocation, jamais la composition', () => {
    const source = read(HOOK);
    /** pendingInviteeUids est calculé sur nextMatch, indépendamment de lineup. */
    const memoBlock = source.match(
      /const pendingInviteeUids = useMemo\(([\s\S]*?)\);/,
    );
    expect(memoBlock).not.toBeNull();
    expect(memoBlock?.[1]).toContain('nextMatch');
    expect(memoBlock?.[1]).not.toContain('lineup');
  });
});

describe('Page Effectif — badge de convocation et feuille nominative', () => {
  it('affiche le badge à côté de la convocation, avec la définition partagée', () => {
    const source = read(SCREEN);
    expect(source).toContain('roster.pendingInviteeUids');
    expect(source).toContain('pendingRsvpCount > 0');
    expect(source).toContain('matchMetaRow');
    expect(source).toContain('réponse');
    expect(source).toContain('en attente');
  });

  it('le badge est tactile et déroule la liste nominative', () => {
    const source = read(SCREEN);
    expect(source).toContain("setPendingRsvpSheetOpen(true)");
    expect(source).toContain('accessibilityLabel={`Voir les ${pendingRsvpCount} réponses en attente pour la convocation`}');
    expect(source).toContain('<CoachPendingRsvpSheet');
    expect(source).toContain('event={publishTarget}');
    expect(source).toContain('visible={pendingRsvpSheetOpen}');
  });

  it('le compteur de convocation est distinct du compteur d’effectif', () => {
    const source = read(SCREEN);
    /**
     * L'effectif garde son « en attente » (joueurs non convoqués inclus) ;
     * le badge de convocation vient du hook, pas d'un filtre local sur squad.
     */
    expect(source).toContain("squad.filter((player) => player.availability === 'pending').length");
    const badgeSource = source.slice(source.indexOf('pendingRsvpUids = roster'));
    expect(badgeSource).not.toContain("squad.filter((player) => player.availability === 'pending')");
  });

  it('la feuille réutilisée est celle de l’accueil — une seule implémentation', () => {
    const source = read(SCREEN);
    expect(source).toContain(
      "import { CoachPendingRsvpSheet } from '../../components/coach/CoachPendingRsvpSheet';",
    );
    const home = read('screens/coach/CoachHomeScreen.tsx');
    expect(home).toContain(
      "import { CoachPendingRsvpSheet } from '../../components/coach/CoachPendingRsvpSheet';",
    );
  });
});
