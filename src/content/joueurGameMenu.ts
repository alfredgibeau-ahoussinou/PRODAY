import type { MainTabId } from '../navigation/mainTabConfig';
import type { JoueurAgeGroup } from '../utils/joueurExperienceTheme';

/**
 * Labels dock joueur — 5 onglets : Accueil · Matchs · Performance · Progression · Profil.
 */
export function getJoueurGameTabLabel(
  tab: MainTabId,
  ageGroup?: JoueurAgeGroup | null,
): string {
  const youth = ageGroup === 'youth';
  const teen = ageGroup === 'teen';

  switch (tab) {
    case 'home':
      return youth ? 'JOUER' : teen ? 'QG' : 'ACCUEIL';
    case 'matchs':
      return youth ? 'MATCH' : teen ? 'MATCHS' : 'MATCHS';
    case 'feed':
      return youth ? 'STATS' : teen ? 'PERF' : 'PERFORMANCE';
    case 'progression':
      return youth ? 'NIVEAU' : teen ? 'PROGRESS' : 'PROGRESSION';
    case 'profil':
      return youth ? 'MOI' : teen ? 'CARTE' : 'PROFIL';
    case 'recrutement':
      return youth ? 'ÉQUIPE' : teen ? 'GROUPE' : 'ÉQUIPE';
    case 'messages':
      return youth ? 'MSG' : 'MESSAGES';
    case 'covoiturage':
      return 'TRAJET';
    case 'sante':
      return 'SANTÉ';
    case 'shop':
      return youth ? 'BUTIN' : 'BOUTIQUE';
    case 'reels':
      return youth ? 'CLIPS' : 'CLIPS';
    case 'famille':
      return 'FAMILLE';
    default: {
      const _exhaustive: never = tab;
      return String(_exhaustive);
    }
  }
}
