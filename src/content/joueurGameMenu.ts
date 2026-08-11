import type { MainTabId } from '../navigation/mainTabConfig';
import type { JoueurAgeGroup } from '../utils/joueurExperienceTheme';

/**
 * Labels dock jeu — vraiment distincts par âge.
 * Youth = arcade fun · Teen = ranked career · Adult = ultimate.
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
    case 'recrutement':
      return youth ? 'ÉQUIPE' : teen ? 'GROUPE' : 'CLUB';
    case 'matchs':
      return youth ? 'MATCH' : teen ? 'MATCHS' : 'TERRAIN';
    case 'feed':
      return youth ? 'DÉFI' : teen ? 'TACTIQUE' : 'TABLEAU';
    case 'profil':
      return youth ? 'MOI' : teen ? 'CARTE' : 'CARTE';
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
