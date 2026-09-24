import fs from 'fs';
import path from 'path';
import { clubForm } from '../features/club/theme/clubDesignSystem';
import { CLUB_TOKENS } from '../features/club/theme/clubTokens';

/**
 * Référence de **forme** Apple Fitness / Apple HIG,
 * retenue pour le pôle Club/Admin : encart de liste groupée, filets en retrait,
 * puce au contour d'accent, action en pilule, FAB central de dock, cartes plates.
 *
 * L'accent reste l'émeraude ProDay (D-006/D-008) : seule la forme est reprise.
 * Ces tests verrouillent les valeurs de forme et l'usage des primitives ; ils ne
 * remplacent pas une recette pixel sur appareil (aucun compte Club de test).
 */

const read = (relative: string) =>
  fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');

const CLUB_UI = 'features/club/ui/clubUi.tsx';
const CLUB_TAB_BAR = 'features/club/shell/ClubTabBar.tsx';
const CLUB_MENU = 'features/club/shell/ClubMenuPane.tsx';

describe('Forme de référence — valeurs relevées sur les captures', () => {
  it('conserve les mesures de la référence', () => {
    expect(clubForm).toMatchObject({
      groupRadius: 22,
      groupGap: 28,
      groupPaddingH: 18,
      rowMinHeight: 62,
      rowIconSize: 22,
      rowGap: 12,
      // Le filet tombe sous le libellé : marge de l'encart + colonne d'icône + écart.
      separatorInset: 18 + 22 + 12,
      fieldHeight: 52,
      fieldRadius: 18,
      chipHeight: 44,
      chipRadius: 999,
      chipGap: 10,
      actionRadius: 999,
      actionMinHeight: 52,
      actionBorderWidth: 1,
      dockRadius: 999,
      dockIconSize: 24,
      dockLabelSize: 11,
      fabSize: 56,
      fabIconSize: 24,
      fabOverlap: 0.5,
    });
    // Le filet ne doit jamais couper le libellé qu'il sépare.
    expect(clubForm.separatorInset).toBe(
      clubForm.groupPaddingH + clubForm.rowIconSize + clubForm.rowGap,
    );
  });

  it('l’accent est l’or mesuré sur la référence, et non l’émeraude ProDay', () => {
    // D-011 : sur demande explicite, la référence fournit désormais aussi les
    // **couleurs** — or relevé au pixel, identique à l'octet dans les quatre
    // captures (rgb 248, 213, 72).
    expect(CLUB_TOKENS.accent).toBe('#F8D548');
    expect(CLUB_TOKENS.onAccent).toBe('#000000');
    expect(clubForm).not.toHaveProperty('accent');
  });
});

describe('Forme de référence — liste groupée (écran « Moi »)', () => {
  it('expose un conteneur groupé et un filet en retrait', () => {
    const source = read(CLUB_UI);
    expect(source).toContain('export function ClubListGroup');
    expect(source).toContain('backgroundColor: tokens.surface');
    expect(source).toContain('borderRadius: clubForm.groupRadius');
    expect(source).toContain('marginLeft: clubForm.separatorInset');
    expect(source).toContain('height: clubForm.separatorThickness');
    // Ni bordure ni ombre sur l'encart : l'aplat suffit (référence).
    const groupBlock = source.slice(
      source.indexOf('const groupStyles'),
      source.indexOf('const buttonStyles'),
    );
    expect(groupBlock).not.toContain('borderWidth');
    expect(groupBlock).not.toContain('clubShadow');
  });

  it('la ligne de réglage utilise une icône contour et un chevron fin', () => {
    const source = read(CLUB_UI);
    expect(source).toContain('size={clubForm.rowIconSize}');
    expect(source).toContain('size={clubForm.chevronSize}');
    expect(source).toContain('color={tokens.faint}');
    // L'ancien motif (pastille d'accent autour de l'icône) ne revient pas dans
    // la ligne de réglage.
    const rowBlock = source.slice(
      source.indexOf('const rowStyles'),
      source.indexOf('const buttonStyles'),
    );
    expect(rowBlock).not.toContain('accentSoft');
    expect(rowBlock).toContain('minHeight: clubForm.rowMinHeight');
  });

  it('le Menu rend des sections groupées au lieu d’une grille de tuiles', () => {
    const menu = read(CLUB_MENU);
    expect(menu).toContain('CLUB_TOOL_GROUPS.map');
    expect(menu).toContain('<ClubListGroup>');
    expect(menu).toContain('<ClubActionRow');
    expect(menu).toContain('styles.groupSection');
    // La grille de tuiles 2 colonnes de l'ancienne direction a disparu du rendu.
    expect(menu).not.toContain('<View style={styles.grid}>');
  });
});

describe('Forme de référence — puces, action, état vide, cartes', () => {
  it('sélectionne une puce par contour d’accent', () => {
    const source = read(CLUB_UI);
    expect(source).toContain('styles.itemOn, { borderColor: tokens.accent }');
    expect(source).toContain('borderRadius: clubForm.chipRadius');
    expect(source).toContain('minHeight: clubForm.chipHeight');
    // Plus de remplissage plein à l'accent sur la puce active.
    expect(source).not.toContain('itemOn, { backgroundColor: tokens.accent }');
    // La référence **retire l'aplat** de la puce sélectionnée : l'état se lit sur
    // le seul contour d'accent, la puce active paraît donc plus sombre que les
    // puces inactives (qui, elles, gardent la surface élevée).
    const itemOn = source.slice(source.indexOf('itemOn: {'), source.indexOf('itemOn: {') + 80);
    expect(itemOn).toContain("backgroundColor: 'transparent'");
  });

  it('propose une action secondaire en pilule à contour fin', () => {
    const source = read(CLUB_UI);
    expect(source).toContain('borderRadius: clubForm.actionRadius');
    expect(source).toContain('borderWidth: clubForm.actionBorderWidth');
    expect(source).toContain('minHeight: clubForm.actionMinHeight');
  });

  it('centre l’état vide sans dégradé ni CTA plein', () => {
    const source = read(CLUB_UI);
    const emptyBlock = source.slice(
      source.indexOf('const emptyStyles'),
      source.indexOf('const groupStyles'),
    );
    expect(emptyBlock).toContain("alignItems: 'center'");
    expect(emptyBlock).toContain('borderRadius: clubForm.groupRadius');
    expect(emptyBlock).toContain('backgroundColor: \'transparent\'');
    expect(emptyBlock).not.toContain('LinearGradient');
    expect(emptyBlock).not.toContain('tokens.accent,');
  });

  it('rend les cartes indicateurs plates, sans dégradé ni barre décorative', () => {
    const source = read(CLUB_UI);
    const smartBlock = source.slice(
      source.indexOf('const smartStyles'),
      source.indexOf('const modalStyles'),
    );
    expect(smartBlock).toContain('borderRadius: clubForm.groupRadius');
    expect(smartBlock).toContain('backgroundColor: tokens.surface');
    expect(smartBlock).not.toContain('kitEdge');
    expect(smartBlock).not.toContain('clubShadow');
  });
});

describe('Forme de référence — en-tête de section, puces d’action, encart d’identité', () => {
  it('rend un en-tête de section avec action alignée à droite', () => {
    const source = read(CLUB_UI);
    expect(source).toContain('export function ClubSectionHeader');
    expect(source).toContain('testID="club-section-header"');
    expect(source).toContain('testID="club-section-action"');
    const block = source.slice(
      source.indexOf('const sectionHeaderStyles'),
      source.indexOf('const pillStyles'),
    );
    expect(block).toContain("justifyContent: 'space-between'");
    expect(block).toContain('color: tokens.foreground');
  });

  it('expose une rangée de puces défilante aux mesures de la référence', () => {
    const source = read(CLUB_UI);
    expect(source).toContain('export function ClubPillRow');
    expect(source).toContain('export function ClubPill');
    expect(source).toContain('testID="club-pill-row"');
    const block = source.slice(
      source.indexOf('const pillStyles'),
      source.indexOf('const featureStyles'),
    );
    expect(block).toContain('minHeight: clubForm.chipHeight');
    expect(block).toContain('borderRadius: clubForm.chipRadius');
    expect(block).toContain('gap: clubForm.chipGap');
    expect(block).toContain('backgroundColor: tokens.elevated');
  });

  it('ne rend une carte visuelle que si un visuel réel est fourni', () => {
    const source = read(CLUB_UI);
    expect(source).toContain('export function ClubFeatureCard');
    expect(source).toContain('if (!imageUri) return null;');
  });

  it('propose une pastille pleine pour les états binaires', () => {
    const source = read(CLUB_UI);
    expect(source).toContain('testID={filled ? \'club-status-pill-filled\' : undefined}');
    expect(source).toContain('backgroundColor: filled ? color : bg');
  });
});

describe('Forme de référence — en-tête d’écran sur le canvas', () => {
  const header = () => read('features/club/ui/ClubBrandHeader.tsx');

  it('pose le titre directement sur le canvas, sans pastille ni encart', () => {
    const source = header();
    expect(source).toContain('<ClubText variant="h1"');
    expect(source).not.toContain('titlePill');
    expect(source).not.toContain('statusDot');
  });

  it('ne remet pas de fond ni de rayon de carte sur le bloc d’en-tête', () => {
    const source = header();
    const wrap = source.slice(source.indexOf('wrap: {'), source.indexOf('row: {'));
    expect(wrap).not.toContain('backgroundColor');
    expect(wrap).not.toContain('borderRadius');
  });
});

describe('Forme de référence — Accueil club', () => {
  const home = () => read('screens/club/ClubHomeScreen.tsx');

  it('structure l’écran en encart d’identité, puces, liste groupée et en-têtes de section', () => {
    const source = home();
    expect(source).toContain('testID="club-identity-card"');
    expect(source).toContain('<ClubPillRow>');
    expect(source).toContain('<ClubListGroup>');
    expect(source).toContain('<ClubSectionHeader');
    expect(source).toContain('<ClubSmartCard');
    // Le titre est posé sur le canvas, sans carte d’en-tête.
    expect(source).toContain('styles.titleBlock');
  });

  it('n’affiche aucun chiffre de démonstration ni faux état', () => {
    const source = home();
    // Les anciens littéraux fabriqués du cockpit ont disparu.
    ['94 %', '16 / 16', 'Zone Montée', 'RC France', 'Saison 2026/2027'].forEach(
      (needle) => expect(source).not.toContain(needle),
    );
    // Les valeurs affichées viennent du workspace réel.
    expect(source).toContain('value={teamsCount}');
    expect(source).toContain('value={playersCount}');
    expect(source).toContain('value={ws.pendingMemberships}');
    expect(source).toContain('value={presence.pendingCount}');
    // Aucun repli inventé du type « || 24 » sur un effectif.
    expect(source).not.toMatch(/players\.length\s*\|\|/);
    expect(source).not.toMatch(/teams\.length\s*\|\|/);
  });

  it('définit la période de chaque indicateur et l’état vide du prochain rendez-vous', () => {
    const source = home();
    expect(source).toContain('UPCOMING_WINDOW_DAYS');
    expect(source).toContain('Réponses manquantes ·');
    expect(source).toContain('Équipes rattachées au club');
    expect(source).toContain('Demandes à valider');
    expect(source).toContain('Aucun rendez-vous à venir');
    expect(source).toContain('Aucune équipe');
  });

  it('n’affiche l’identité FFF que sur des champs réellement renseignés', () => {
    const source = home();
    expect(source).toContain('club.fff_affiliation_number?.trim()');
    expect(source).toContain('club.fff_season?.trim()');
    expect(source).toContain('{club.verified ? (');
    // Pas de badge « FFF » inconditionnel.
    expect(source).not.toContain('Club Officiel FFF');
  });
});

describe('Forme de référence — dock et FAB central', () => {
  it('rend un FAB central de 56 qui chevauche l’arête du dock', () => {
    const source = read(CLUB_TAB_BAR);
    expect(source).toContain('clubForm.fabSize');
    expect(source).toContain('clubForm.fabIconSize');
    expect(source).toContain('clubForm.fabOverlap');
    expect(source).toContain('testID="club-create-fab"');
    // Le FAB est ancré **hors** du flux : il dépasse du dock au lieu de rester
    // dedans, et le root réserve exactement la même hauteur.
    expect(source).toContain('const fabProtrusion = clubForm.fabSize * clubForm.fabOverlap');
    expect(source).toContain('top: -fabProtrusion');
    expect(source).toContain('marginTop: fabProtrusion');
    // Un créneau libre l'attend au centre de la rangée.
    expect(source).toContain('styles.fabSpacer');
  });

  it('le shell branche le FAB sur le flux de création existant', () => {
    expect(read('features/club/shell/ClubAppShell.tsx')).toContain(
      'onCreate={() => openCreate()}',
    );
  });

  it('rend une capsule aux extrémités pleinement arrondies', () => {
    const source = read(CLUB_TAB_BAR);
    expect(source).not.toContain('PLAYER_DARK');
    expect(source).toContain('borderRadius: clubForm.dockRadius');
    // Le flou clippé suit le même contour que le dock.
    const blurClip = source.slice(source.indexOf('blurClip: {'), source.indexOf('dock: {'));
    expect(blurClip).toContain('borderRadius: clubForm.dockRadius');
  });

  it('n’encadre pas l’icône active et ne la souligne pas', () => {
    const source = read(CLUB_TAB_BAR);
    // Le motif précédent (encart d'accent derrière l'icône) ne revient pas.
    expect(source).not.toContain('accentSoft');
    expect(source).not.toContain('activeLine');
    expect(source).not.toContain('borderColor: tokens.accent');
    // L'état actif se lit sur la couleur de l'icône et du libellé.
    expect(source).toContain('color={on ? tokens.accent : tokens.muted}');
  });

  it('écrit les libellés du dock en bas de casse', () => {
    const source = read(CLUB_TAB_BAR);
    expect(source).toContain('{item.shortLabel ?? item.label}');
    const labelBlock = source.slice(
      source.indexOf('slotLabel: {'),
      source.indexOf('  });\n}'),
    );
    expect(labelBlock).toContain('fontSize: clubForm.dockLabelSize');
    expect(labelBlock).not.toContain('textTransform');
  });
});

/**
 * La référence pose des cartes **plates et neutres** : une seule surface, sans
 * lavage de couleur, sans rail décoratif, sans bordure teintée, sans ombre
 * portée. La couleur ne circule que par les pastilles d'état et les icônes.
 */
describe('Forme de référence — cartes plates et neutres', () => {
  const FLAT_CARD_FILES = [
    'features/club/ui/ClubCalendarChrome.tsx',
    'features/club/ui/ClubMatchesDay.tsx',
    'features/club/ui/ClubTrainingsDay.tsx',
    'features/club/ui/ClubTeamCard.tsx',
  ];

  it('n’applique aucun dégradé sur une carte structurelle', () => {
    for (const file of FLAT_CARD_FILES) {
      expect(read(file)).not.toContain('LinearGradient');
    }
  });

  it('ne pose ni rail décoratif ni bordure teintée sur les cartes d’événement', () => {
    for (const file of FLAT_CARD_FILES.slice(0, 3)) {
      const source = read(file);
      expect(source).not.toContain('styles.rail');
      expect(source).not.toContain("'55'");
    }
  });

  it('n’ajoute pas d’ombre portée à ces cartes', () => {
    for (const file of FLAT_CARD_FILES) {
      const source = read(file);
      expect(source).not.toContain('clubShadow.lift');
      expect(source).not.toContain('clubShadow.soft');
    }
  });

  /**
   * La composition des cartes calendrier a été extraite dans le chrome partagé
   * Coach ↔ Club (`features/calendar/calendarChrome`) : c'est désormais ce
   * fichier qui porte le rayon d'encart, pas l'enveloppe de thème du pôle.
   */
  const SHARED_CARD_FILES = ['features/calendar/calendarChrome.tsx'];

  it('délègue la composition calendrier au chrome partagé (une seule implémentation)', () => {
    const source = read('features/club/ui/ClubCalendarChrome.tsx');
    expect(source).toContain('CalendarChromeProvider');
    expect(source).toContain('features/calendar/calendarChrome');
    expect(source).not.toContain('StyleSheet.create');
  });

  it('utilise le rayon d’encart unique de la référence pour ces cartes', () => {
    // Le chrome calendrier a été extrait : son rayon est vérifié dans le test dédié.
    for (const file of FLAT_CARD_FILES.filter((f) => !f.includes('ClubCalendarChrome'))) {
      const source = read(file);
      // Le rayon de carte vient du même jeton que l'encart groupé (22).
      expect(source).toContain('clubForm.groupRadius');
      // L'ancien rayon de hero plus large ne revient pas.
      expect(source).not.toContain('borderRadius: clubRadius.xxl');
      expect(source).not.toContain('borderRadius: 16,');
    }
  });

  it('applique le même rayon dans le chrome partagé, via le socle professionnel', () => {
    const source = read(SHARED_CARD_FILES[0]);
    expect(source).toContain('proForm.groupRadius');
    expect(source).not.toContain('borderRadius: 16,');
  });

  /** Heroes de module qui reprenaient **exactement** le même lavage diagonal. */
  const MODULE_HERO_FILES = [
    'features/club/ui/ClubPlayersChrome.tsx',
    'features/club/ui/ClubFinanceChrome.tsx',
    'features/club/ui/ClubCoachesChrome.tsx',
  ];

  it('aplatit aussi les heroes de module au même traitement', () => {
    for (const file of MODULE_HERO_FILES) {
      const source = read(file);
      expect(source).not.toContain('LinearGradient');
      expect(source).not.toContain('styles.rail');
      expect(source).toContain('borderRadius: clubForm.groupRadius');
      expect(source).not.toContain('borderRadius: clubRadius.xxl');
    }
  });

  it('élargit les zones tactiles des actions de section au-delà de la cible visuelle', () => {
    // La référence pose une action **texte** compacte, mesurée à 21 px de haut dans
    // le DOM du pôle Club : sans élargissement tactile elle passe sous les 44 px
    // recommandés (checklist visuelle §7). Le hitSlop doit donc être appliqué par
    // la primitive, pour toutes les pages qui l'utilisent (Accueil, Finances,
    // Matchs, Licences, Notifications…).
    const ui = read(CLUB_UI);
    expect(ui).toContain('export const SECTION_ACTION_HIT_SLOP');
    expect(ui).toContain('hitSlop={SECTION_ACTION_HIT_SLOP}');
    const match = ui.match(/SECTION_ACTION_HIT_SLOP = \{([^}]*)\}/);
    expect(match).not.toBeNull();
    const nums = match![1].match(/(\d+)/g)?.map(Number) ?? [];
    const [top, bottom, left, right] = nums;
    // 21 px de haut à l'écran + 2 × 12 px de marge = 45 px de cible réelle.
    expect(top + bottom).toBeGreaterThanOrEqual(22);
    expect(left + right).toBeGreaterThanOrEqual(16);
    expect(right).toBeGreaterThan(0);

    // Aucune action de section ne doit être rendue sans élargissement tactile.
    const actionBlocks = ui.split('testID="club-section-action"');
    expect(actionBlocks.length).toBe(2);
    expect(actionBlocks[0]).toContain('hitSlop={SECTION_ACTION_HIT_SLOP}');
  });

  it('ne garde un dégradé que sur le crest de repli du hub', () => {
    const hub = read('features/club/ui/ClubHubChrome.tsx');
    const gradients = hub.split('\n').filter((line) => line.includes('<LinearGradient'));
    expect(gradients).toHaveLength(1);
    // Les cartes du hub (pack, alertes) sont plates elles aussi.
    expect(hub).not.toContain('styles.rail');
    expect(hub).not.toContain('rgba(24, 28, 42, 0.95)');
    expect(hub).not.toContain('rgba(20, 24, 36, 0.95)');
  });
});
