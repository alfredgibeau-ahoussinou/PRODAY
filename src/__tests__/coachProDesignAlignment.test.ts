import fs from 'fs';
import path from 'path';
import {
  proForm,
  proRadius,
  proSpace,
  proType,
} from '../theme/professionalDesign';
import {
  clubForm,
  clubRadius,
  clubSpace,
  clubType,
} from '../features/club/theme/clubDesignSystem';
import {
  COACH_NAV_FOLDERS,
  COACH_PRIMARY_NAV_IDS,
} from '../features/coach/navigation/coachNavConfig';

const ROOT = path.resolve(__dirname, '..');
function read(relative: string): string {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

const COACH_TAB_BAR = 'features/coach/shell/CoachTabBar.tsx';
const CLUB_TAB_BAR = 'features/club/shell/ClubTabBar.tsx';
const SHARED_CALENDAR_CHROME = 'features/calendar/calendarChrome.tsx';

describe('Socle professionnel partagé Coach ↔ Club/Admin', () => {
  it('ré-exporte littéralement les jetons Club/Admin (source unique)', () => {
    expect(proType).toBe(clubType);
    expect(proForm).toBe(clubForm);
    expect(proSpace).toBe(clubSpace);
    expect(proRadius).toBe(clubRadius);
  });

  it('impose 4 destinations au pôle Coach, Menu en dernier (README §0.2)', () => {
    expect(COACH_NAV_FOLDERS.map((f) => f.id)).toEqual([
      'accueil',
      'calendrier',
      'equipe',
      'menu',
    ]);
    expect(COACH_PRIMARY_NAV_IDS).toHaveLength(4);
    expect(COACH_PRIMARY_NAV_IDS[COACH_PRIMARY_NAV_IDS.length - 1]).toBe('plus');
    expect(COACH_PRIMARY_NAV_IDS).toContain('calendrier');
  });

  it('affiche le dock Coach avec les mêmes règles de forme que le dock Club', () => {
    const source = read(COACH_TAB_BAR);
    /** Libellés en bas de casse : jamais mis en capitales. */
    expect(source).not.toContain('toUpperCase');
    expect(source).toContain('fontSize: proForm.dockLabelSize');
    /** L'état actif se lit sur la couleur, sans encart ni soulignement. */
    expect(source).not.toContain('activeLine');
    expect(source).not.toContain('borderColor: tokens.accent');
    expect(source).toContain('color={on ? tokens.accent : tokens.muted}');
    /** Le dock Coach ne dépend plus de la palette du pôle Joueur. */
    expect(source).not.toContain('PLAYER_DARK');
    /** 4 onglets : les deux barres ont la même hauteur de rail cible. */
    const clubSource = read(CLUB_TAB_BAR);
    expect(clubSource).toContain('clubForm.dockRadius');
    expect(source).toContain('proForm.dockRadius');
  });
});

describe('Calendrier partagé', () => {
  it('est composé une seule fois, pour les deux pôles', () => {
    const shared = read(SHARED_CALENDAR_CHROME);
    expect(shared).toContain('export function CalendarHero');
    expect(shared).toContain('export function CalendarAgendaRow');
    /** Le socle de forme vient du professionnel partagé, pas d'un pôle. */
    expect(shared).toContain('proForm');
    expect(shared).not.toContain('clubForm');

    for (const wrapper of [
      'features/club/ui/ClubCalendarChrome.tsx',
      'features/coach/ui/coachCalendarChrome.tsx',
    ]) {
      const source = read(wrapper);
      expect(source).toContain('CalendarChromeProvider');
      expect(source).toContain('features/calendar/calendarChrome');
      /** Une enveloppe de thème ne redéfinit aucun style. */
      expect(source).not.toContain('StyleSheet.create');
    }
  });

  it('alimente le modèle commun depuis une seule implémentation', () => {
    const model = read('features/calendar/calendarModel.ts');
    expect(model).toContain("from '../club/ui/clubCalendarModel'");
    expect(model).not.toContain('function ');
  });

  it('expose le Calendrier comme onglet réel, branché sur un écran', () => {
    const shell = read('features/coach/shell/CoachAppShell.tsx');
    expect(shell).toContain("case 'calendrier':");
    expect(shell).toContain('<CoachCalendarScreen />');
    const screen = read('screens/coach/CoachCalendarScreen.tsx');
    expect(screen).toContain('teamEventsService.listForUser');
    /** États honnêtes : chargement, échec avec réessai, période vide. */
    expect(screen).toContain('Chargement du calendrier');
    expect(screen).toContain('Calendrier indisponible');
    expect(screen).toContain('Rien sur cette période');
  });
});

describe('Kit Coach aligné sur le socle partagé', () => {
  const PORTAL_UI = 'components/coach/coachPortalUi.tsx';

  it('ne contient plus aucune couleur littérale', () => {
    const source = read(PORTAL_UI);
    expect(source.match(/#[0-9A-Fa-f]{6}\b|rgba?\(/g) ?? []).toHaveLength(0);
  });

  it('tire ses dimensions du socle partagé, plus de valeurs isolées', () => {
    const source = read(PORTAL_UI);
    expect(source).toContain("from '../../theme/professionalDesign'");
    for (const literal of [
      'borderRadius: 18',
      'minHeight: 40',
      'minHeight: 32',
      'minHeight: 52',
      'minHeight: 56',
    ]) {
      expect(source).not.toContain(literal);
    }
    expect(source).toContain('proRadius.lg');
    expect(source).toContain('proForm.chipHeight');
    expect(source).toContain('proForm.actionMinHeight');
    expect(source).toContain('proForm.rowMinHeight');
  });

  it('retire le rail d’accent décoratif des cartes et les remplissages de sélection', () => {
    const source = read(PORTAL_UI);
    expect(source).not.toContain('borderLeftColor: tokens.accent');
    expect(source).not.toContain('borderLeftWidth: 3');
    /** Les trois états sélectionnés (segment, puce de mode, rail de chapitres). */
    const transparentFills = source.match(/backgroundColor: 'transparent'/g) ?? [];
    expect(transparentFills.length).toBeGreaterThanOrEqual(3);
  });

  it('utilise la couleur de statut commune au lieu d’un rouge iOS en dur', () => {
    const source = read(PORTAL_UI);
    expect(source).not.toContain('#FF3B30');
    expect(source).toContain('proSemantic.danger');
  });

  it('tient la géométrie des actions du tableau de bord', () => {
    const source = read('screens/coach/CoachHomeScreen.tsx');
    /** Mesuré en aperçu : action du bandeau d’alertes à 21 px de haut, CTA à 45 px / r12. */
    expect(source).toContain('minHeight: proForm.chipHeight');
    expect(source).toContain('borderRadius: proForm.chipRadius');
    expect(source).toContain('minHeight: proForm.actionMinHeight');
    expect(source).toContain('borderRadius: proForm.actionRadius');
    /** Le classement s’affiche dans le thème du pôle, pas en mode clair isolé. */
    expect(source).not.toContain('lightMode={true}');
  });
});

/**
 * Plafond de couleurs littérales par écran Coach.
 *
 * Ces budgets **ne peuvent que diminuer** : ils empêchent d'ajouter de nouvelles
 * couleurs en dur pendant la conversion progressive, exactement comme le garde-fou
 * du pôle Club/Admin. Pour convertir un fichier, on descend son plafond dans le
 * même commit.
 */
describe('Plafond de couleurs littérales du pôle Coach', () => {
  /** Comptage par **occurrences** (et non par lignes), relevé le 15/09/2026. */
  const BUDGETS: Record<string, number> = {
    /**
     * Page Équipe : 226 → **0**. Terrain, banc, sélecteur et composition guidée
     * tirent désormais toutes leurs couleurs des jetons partagés
     * (`professionalDesign` + `coachPitchTokens`).
     */
    'screens/coach/CoachSquadScreen.tsx': 0,
    /**
     * Planificateur d'entraînement : 117 → **0**. La « séance N°48 » fictive,
     * le RPE inventé et le générateur IA simulé ont disparu ; la séance part
     * désormais dans le calendrier réel via `teamEventsService.create` et la
     * génération Copilote est celle du service cloud + repli local partagé.
     */
    'screens/coach/CoachTrainingPlannerScreen.tsx': 0,
    /**
     * Messagerie : l'écran fictif (chats en dur, compteurs de lecture inventés,
     * directives vocales simulées — 1 253 lignes) a été **supprimé**. La route
     * `com_staff` et le chapitre communication rendent désormais la messagerie
     * partagée réelle (`MessagesScreen`, DM + groupes temps réel, variante coach).
     */
    /**
     * Tableau tactique : 108 → **0**. Le mode 3D, le décor de stade et les
     * confirmations inventées ont été retirés ; le tracé vient désormais du
     * composant partagé `CoachPitchSurface`, et toutes les couleurs des jetons.
     */
    'screens/coach/CoachTacticalBoardScreen.tsx': 0,
    /**
     * Centre de match en direct, Twin Match Lab, Workload & Santé, Scouting,
     * Mes vidéos, hub d'entraînement et classement : **0**. Codemod
     * `scripts/codemodCoachColors.js` — jetons Coach + `withAlpha` +
     * `proSemantic` (dont `info`), palette claire via `COACH_CLEAR_SURFACES`.
     */
    'screens/coach/CoachLiveMatchCenterScreen.tsx': 0,
    'components/coach/CoachStandingsTable.tsx': 0,
    'screens/coach/CoachTwinMatchLabScreen.tsx': 0,
    'screens/coach/CoachWorkloadHealthScreen.tsx': 0,
    'screens/coach/CoachScoutingGrowthScreen.tsx': 0,
    'screens/coach/CoachMesVideosScreen.tsx': 0,
    'screens/coach/CoachTrainingEventHub.tsx': 0,
    /**
     * Vague 2 — composants partagés (16/09) : diagrammes, terrains, profils,
     * IA, compte, sélecteur d'accent, fédération. Même codemod, mêmes jetons ;
     * la série « violet » des schémas vit dans `PRO_DATA_VIOLET` (socle).
     */
    'components/coach/CoachTrainingDrillDiagram.tsx': 0,
    'components/coach/CoachSportEasyPitchSurface.tsx': 0,
    'components/coach/CoachSportEasyPitch.tsx': 0,
    'components/coach/CoachProfileHub.tsx': 0,
    'components/coach/CoachAiTacticsSheet.tsx': 0,
    'components/coach/CoachAccountPanels.tsx': 0,
    'components/coach/CoachPlayerAiPanel.tsx': 0,
    'components/coach/CoachTrainingTeamRoster.tsx': 0,
    'components/coach/CoachAccentColorPickerModal.tsx': 0,
    'components/coach/FederationSyncDrawer.tsx': 0,
  };

  it('n’augmente jamais, fichier par fichier', () => {
    const overspent: string[] = [];
    for (const [file, budget] of Object.entries(BUDGETS)) {
      const found = read(file).match(/#[0-9A-Fa-f]{6}\b|rgba?\(/g) ?? [];
      if (found.length > budget) {
        overspent.push(`${file}: ${found.length} > ${budget}`);
      }
    }
    expect(overspent).toEqual([]);
  });

  it('les fichiers déjà convertis restent à zéro', () => {
    for (const file of [
      'screens/coach/CoachHomeScreen.tsx',
      'screens/coach/CoachSquadScreen.tsx',
      'components/coach/CoachPitchSurface.tsx',
      'components/coach/CoachPitchView.tsx',
      'components/coach/CoachFutPlayerCard.tsx',
      'components/coach/CoachBenchDrawer.tsx',
      'components/coach/CoachPlayerPicker.tsx',
      'components/coach/CoachLineupGuide.tsx',
      'components/coach/CoachSquadImportPanel.tsx',
      'components/coach/CoachPendingRsvpSheet.tsx',
      'components/coach/coachPortalUi.tsx',
      /** Annuaire partagé avec le pôle Club/Admin + son enveloppe de thème Coach. */
      'features/roster/rosterDirectory.tsx',
      'features/coach/ui/coachRosterChrome.tsx',
      /** Effectif réel du coach : modèle pur + chargement, sans couleur propre. */
      'utils/coachSquadRoster.ts',
      'hooks/useCoachSquadRoster.ts',
      'screens/coach/CoachCalendarScreen.tsx',
      'screens/coach/CoachRsvpReminderLogScreen.tsx',
      'utils/coachTrainingPlanner.ts',
      'utils/coachTacticalBoard.ts',
      'features/coach/ui/coachCalendarChrome.tsx',
      'features/coach/shell/CoachTabBar.tsx',
      'features/calendar/calendarChrome.tsx',
      'utils/coachChipUi.ts',
      /** Derniers écrans convertis (codemod couleurs — voir BUDGETS ci-dessus). */
      'screens/coach/CoachLiveMatchCenterScreen.tsx',
      'screens/coach/CoachTwinMatchLabScreen.tsx',
      'screens/coach/CoachWorkloadHealthScreen.tsx',
      'screens/coach/CoachScoutingGrowthScreen.tsx',
      'screens/coach/CoachMesVideosScreen.tsx',
      'screens/coach/CoachTrainingEventHub.tsx',
      'components/coach/CoachStandingsTable.tsx',
      /** Vague 2 — composants partagés convertis (codemod couleurs). */
      'components/coach/CoachTrainingDrillDiagram.tsx',
      'components/coach/CoachSportEasyPitchSurface.tsx',
      'components/coach/CoachSportEasyPitch.tsx',
      'components/coach/CoachProfileHub.tsx',
      'components/coach/CoachAiTacticsSheet.tsx',
      'components/coach/CoachAccountPanels.tsx',
      'components/coach/CoachPlayerAiPanel.tsx',
      'components/coach/CoachTrainingTeamRoster.tsx',
      'components/coach/CoachAccentColorPickerModal.tsx',
      'components/coach/FederationSyncDrawer.tsx',
    ]) {
      const found = read(file).match(/#[0-9A-Fa-f]{6}\b|rgba?\(/g) ?? [];
      expect({ file, found: found.length }).toEqual({ file, found: 0 });
    }
  });

  it('le socle professionnel porte lui-même les couleurs de statut partagées', () => {
    const source = read('theme/professionalDesign.ts');
    /** Couleurs littérales tolérées : texte sur aplat (blanc) + info (bleu, hors CLUB_TOKENS). */
    const literals = source.match(/#[0-9A-Fa-f]{6}\b|rgba?\(/g) ?? [];
    expect(literals).toEqual(['#0A84FF', '#FFFFFF', '#8B5CF6']);
    expect(source).toContain('onDanger');
    expect(source).toContain('CLUB_TOKENS.success');
  });

  it('sépare la série adverse des statuts d’erreur (langues visuelles distinctes)', () => {
    const twin = read('screens/coach/CoachTwinMatchLabScreen.tsx');
    /**
     * La série « adversaire » du Twin Match Lab utilise le jeton violet, pas
     * danger ; et la sélection suit la recette `proChip` du socle — contour
     * d'accent sur fond transparent, jamais un aplat teinté (contraste du
     * libellé actif : blanc sur nuit, pas accent 10px sur teinte). Vérifié en
     * preview le 16/09 : l'aplat violet@0.2 tombait à ~3,7:1 en 10px.
     */
    expect(twin).toContain('fmtBtnActiveOpp: {\n    backgroundColor: \'transparent\',\n    borderColor: PRO_DATA_VIOLET');
    expect(twin).toContain('fmtBtnTextActiveOpp: {\n    color: tokens.foreground');
    expect(twin).toContain('fmtBtnActive: {\n    backgroundColor: \'transparent\',\n    borderColor: proSemantic.info');
    expect(twin).toContain('fmtBtnTextActive: {\n    color: tokens.foreground');
    /** Le bloc des sélecteurs de formation n’utilise plus `proSemantic.danger`. */
    const fmtBlock = twin.slice(twin.indexOf('fmtBtnActive'), twin.indexOf('fmtBtnTextActiveOpp'));
    expect(fmtBlock).not.toContain('proSemantic.danger');
    /** Et le vrai sémantique d’erreur reste réservé au rapport de vulnérabilité. */
    expect(twin).toContain('vulnSeverityText: {\n    color: proSemantic.danger');
  });
});

describe('Contenu Coach honnête', () => {
  it('n’affiche plus de prédiction IA inventée sur le tableau de bord', () => {
    const source = read('screens/coach/CoachHomeScreen.tsx');
    expect(source).not.toContain('Probabilité Victoire');
    expect(source).not.toContain('xG Prédit');
    expect(source).not.toContain('RC France');
    /** L’entrée IA renvoie vers le Copilote réel. */
    expect(source).toContain("onNavigate?.('copilot_chat')");
  });

  it('identifie les données de démonstration du suivi de charge', () => {
    const source = read('screens/coach/CoachWorkloadHealthScreen.tsx');
    expect(source).toContain('DEMO_PLAYERS_GPS');
    expect(source).not.toContain('DEFAULT_PLAYERS_GPS');
    expect(source.toLowerCase()).toContain('mode démonstration');
    /** Plus de revendication d’intégration inexistante. */
    expect(source).not.toContain('PlayerData');
    /** Plus de fausse confirmation de sauvegarde ni de promesse médicale. */
    expect(source).not.toContain('Ajustée avec Succès');
    expect(source).not.toContain('éviter la blessure');
  });
});
