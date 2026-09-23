import fs from 'fs';
import path from 'path';
import { clubForm } from '../features/club/theme/clubDesignSystem';

/**
 * Cohérence des **puces de filtre** du pôle Club.
 *
 * Constat de la recette du 15/09/2026 (audit géométrique du DOM dans l'aperçu) :
 * cinq écrans club avaient recopié leur propre puce — `paddingHorizontal: 14,
 * paddingVertical: 8, borderRadius: 20`, soit **34 px de haut**, avec un état
 * actif en **remplissage plein accent**. La référence de forme dit l'inverse :
 * `clubForm.chipHeight` (44), `clubForm.chipRadius` (pilule), et une sélection
 * qui se lit au **contour d'accent**, jamais à l'aplat.
 *
 * Ces tests verrouillent l'usage de la primitive partagée `ClubPill` et
 * interdisent le retour des puces locales. Ils sont volontairement lus depuis
 * les sources : `hitSlop` et styles ne sont pas observables autrement en Jest.
 */

const read = (relative: string) =>
  fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');

const CLUB_UI = 'features/club/ui/clubUi.tsx';

/**
 * Écrans dont la puce locale a été remplacée par `ClubPill`.
 *
 * `ClubPlayersDirectory` n'y figure plus : l'annuaire des joueurs est passé au
 * module **partagé** avec le pôle Coach (`features/roster/rosterDirectory`), qui
 * tient sa puce de `proChip` — la recette du socle commun. Un fichier club
 * supprimé ne peut plus être vérifié ici.
 */
const MIGRATED = [
  'features/club/ui/ClubTeamsHierarchy.tsx',
  'features/club/ui/ClubAuxiliaryModules.tsx',
  'features/club/ui/ClubChannelsHub.tsx',
  'features/club/ui/ClubMatchesCenter.tsx',
];

describe('Puce de filtre club — spec partagée', () => {
  it('expose des mesures de puce conformes à la référence', () => {
    expect(clubForm.chipHeight).toBe(44);
    expect(clubForm.chipRadius).toBe(999);
  });

  it('ClubPill porte l’état sélectionné en contour d’accent, pas en aplat', () => {
    const src = read(CLUB_UI);
    expect(src).toMatch(/active\?: boolean/);
    expect(src).toMatch(/active && styles\.pillActive/);
    expect(src).toMatch(/pillActive: \{ borderColor: tokens\.accent \}/);
    expect(src).toMatch(/pillLabelActive: \{ color: tokens\.accent/);
  });

  it.each(MIGRATED)('%s utilise ClubPill et non une puce locale', (file) => {
    const src = read(file);
    expect(src).toMatch(/import \{ ClubPill \} from '\.\/clubUi';/);
    expect(src).toMatch(/<ClubPill/);
    // Puce locale historique : 8 px de padding vertical + rayon 20 → 34 px de haut.
    expect(src).not.toMatch(/paddingVertical: 8,\s*\n\s*borderRadius: 20,/);
    // État actif historique : remplissage plein accent avec libellé noir.
    // (Un CTA principal reste noir sur accent : seule la puce est visée ici.)
    expect(src).not.toMatch(/backgroundColor: tokens\.accent, borderColor: tokens\.accent/);
  });

  it('a supprimé le kit de portail club devenu orphelin', () => {
    expect(fs.existsSync(path.join(__dirname, '..', 'components/club/clubPortalUi.tsx'))).toBe(
      false,
    );
  });
});

describe('Fiche joueur — cibles tactiles et libellés', () => {
  const src = read('screens/club/ClubPlayerDetailScreen.tsx');

  it('élargit la cible du retour au-delà de la hauteur visuelle', () => {
    // Le contrôle visuel est une ligne de 28 px : sans hitSlop la cible est trop
    // petite pour un doigt.
    expect(src).toMatch(/hitSlop=\{\{ top: 10, bottom: 10, left: 10, right: 10 \}\}/);
  });

  it('ne répète pas la catégorie quand le nom d’équipe la reprend', () => {
    // « U17 · U17 » observé en aperçu : l'équipe s'appelle U17 et la catégorie
    // vaut U17. Le libellé doit dédupliquer.
    expect(src).toMatch(/arr\.indexOf\(v\) === i/);
    expect(src).not.toMatch(/\[team\?\.name, player\.profile\?\.category\]\.filter\(Boolean\)\.join/);
  });
});
