import fs from 'fs';
import path from 'path';
import { proChip, proForm } from '../theme/professionalDesign';
import { coachChipContainerStyle } from '../utils/coachChipUi';

const ROOT = path.resolve(__dirname, '..');
function read(relative: string): string {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}
function exists(relative: string): boolean {
  return fs.existsSync(path.join(ROOT, relative));
}

const SHARED = 'features/roster/rosterDirectory.tsx';
const CLUB_WRAPPER = 'features/club/ui/ClubRosterChrome.tsx';
const COACH_WRAPPER = 'features/coach/ui/coachRosterChrome.tsx';
const CLUB_SCREEN = 'screens/club/ClubPlayersScreen.tsx';
const COACH_SCREEN = 'screens/coach/CoachSquadScreen.tsx';

describe('Annuaire joueurs partagé Coach ↔ Club/Admin', () => {
  it('est composé une seule fois, pour les deux pôles', () => {
    const shared = read(SHARED);
    /** Les quatre éléments demandés par la recette, dans un seul module. */
    expect(shared).toContain('export function RosterSearchField');
    expect(shared).toContain('export function RosterFilterChips');
    expect(shared).toContain('export function RosterList');
    expect(shared).toContain('export function RosterProfileSheet');
    expect(shared).toContain('export function RosterDirectory');
    expect(shared).toContain('export function RosterChromeProvider');

    /** Typographie, forme et puce viennent du socle, pas d'un pôle. */
    expect(shared).toContain("from '../../theme/professionalDesign'");
    expect(shared).not.toContain('clubForm');
    expect(shared).not.toContain('coachForm');
    expect(shared).toContain('proChip(tokens, active)');
    /** Une seule modale, celle de l'application. */
    expect(shared).toContain('ModalSheet');
  });

  it('n’impose aucun pôle au module partagé : thème et texte sont injectés', () => {
    const shared = read(SHARED);
    /** Aucun import ne vient d'un pôle : le module ne connaît ni Coach ni Club. */
    const poleImports = (shared.match(/^import[\s\S]*?from '[^']*';$/gm) ?? []).filter((line) =>
      /club|coach/i.test(line),
    );
    expect(poleImports).toEqual([]);
    /** Le thème arrive par injection, comme pour le calendrier partagé. */
    expect(shared).toContain('tokens: RosterChromeTokens');
    expect(shared).toContain('Text: RosterChromeText');
    expect(shared).toContain('export function RosterChromeProvider');
  });

  it('ne fixe dans le socle qu’une seule recette de puce', () => {
    const design = read('theme/professionalDesign.ts');
    expect(design).toContain('export function proChip');
    /** La puce partagée est celle du socle, pas une seconde implémentation. */
    const coachChips = read('utils/coachChipUi.ts');
    expect(coachChips).toContain('return proChip(tokens, active);');
    expect(coachChips).not.toContain('minHeight: proForm.chipHeight');
    /** Sélection = contour d'accent, jamais un aplat plein. */
    const chips = proChip(
      { surface: 's', elevated: 'e', border: 'b', foreground: 'f', muted: 'm', accent: 'a', onAccent: 'o' },
      true,
    );
    expect(chips).toMatchObject({
      borderColor: 'a',
      backgroundColor: 'transparent',
      minHeight: proForm.chipHeight,
      borderRadius: proForm.chipRadius,
    });
  });

  it('laisse chaque pôle avec une enveloppe de thème, sans style propre', () => {
    for (const wrapper of [CLUB_WRAPPER, COACH_WRAPPER]) {
      const source = read(wrapper);
      expect(source).toContain('RosterChromeProvider');
      expect(source).toContain("features/roster/rosterDirectory");
      expect(source).toContain('export function ClubRosterDirectory'.replace(/.*/, 'RosterDirectory'));
      expect(source).toContain('RosterProfileSheet');
      /** Une enveloppe de thème ne redéfinit aucun style. */
      expect(source).not.toContain('StyleSheet.create');
    }
  });

  it('branche les deux écrans sur la même composition', () => {
    const club = read(CLUB_SCREEN);
    const coach = read(COACH_SCREEN);
    expect(club).toContain('<ClubRosterDirectory');
    expect(club).toContain('<ClubRosterProfileSheet');
    expect(coach).toContain('<CoachRosterDirectory');
    expect(coach).toContain('<CoachRosterProfileSheet');
  });

  it('retire des écrans leur liste, leur champ et leur fiche maison', () => {
    const coach = read(COACH_SCREEN);
    /** Plus de rangée locale : ni pastille de numéro, ni point d'état dessinés ici. */
    expect(coach).not.toContain('styles.rowNumber');
    expect(coach).not.toContain('styles.rowDot');
    expect(coach).not.toContain('filteredRoster.map((player, index) =>');
    expect(coach).not.toContain('function PlayerProfileSheet');
    /** La fiche partagée porte ses puces : celles de l'annuaire, pas une copie. */
    expect(coach).toContain('RosterFilterChips');
    expect(coach).toContain('activeId={profilePlayer.availability}');

    const club = read(CLUB_SCREEN);
    expect(club).not.toContain('styles.memberCard');
    expect(club).not.toContain('TextInput');
  });

  it('supprime l’ancien annuaire club au lieu d’en garder deux', () => {
    expect(exists('features/club/ui/ClubPlayersDirectory.tsx')).toBe(false);
    const club = read(CLUB_SCREEN);
    expect(club).not.toContain('ClubPlayersDirectory');
    /** Et les champs inventés qui l'alimentaient ne reviennent pas. */
    expect(club).not.toContain('solvencyStatus');
    expect(club).not.toContain('medicalCertExpiry');
  });
});

describe('Club — annuaire alimenté et détail conservé', () => {
  it('nourrit la liste avec les joueurs réels du club', () => {
    const club = read(CLUB_SCREEN);
    expect(club).toContain('filterClubPlayersList');
    expect(club).toContain('resolveClubPlayersBaseList');
    expect(club).toContain('items={items}');
    expect(club).toContain('onSelect={(item) => setProfileUid(item.id)}');
  });

  it('garde le baromètre de conformité côté club, au-dessus de l’annuaire', () => {
    const club = read(CLUB_SCREEN);
    const chrome = read('features/club/ui/ClubPlayersChrome.tsx');
    expect(club).toContain('<ClubRosterComplianceBar counts={compliance} />');
    expect(club).toContain('header={<ClubRosterComplianceBar');
    expect(club).toContain('resolveClubMembershipCompliance');
    expect(chrome).toContain('export function ClubRosterComplianceBar');
  });

  it('renvoie la fiche complète au détail club existant, sans le dupliquer', () => {
    const club = read(CLUB_SCREEN);
    expect(club).toContain("label: 'Ouvrir la fiche complète'");
    expect(club).toContain('setSelectedPlayerUid');
    expect(club).toContain('<ClubPlayerDetailScreen');
  });

  it('tient l’état d’adhésion dans le modèle, plus dans chaque composant', () => {
    const card = read('features/club/ui/ClubRosterPlayerCard.tsx');
    expect(card).toContain('membershipStatusLabel');
    expect(card).toContain('membershipStatusTone');
    expect(card).not.toContain('function membershipLabel');
    expect(card).not.toContain('function membershipTone');
  });
});
