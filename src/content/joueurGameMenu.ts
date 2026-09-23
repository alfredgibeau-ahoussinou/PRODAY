import type { MainTabId } from '../navigation/mainTabConfig';
import type { JoueurAgeGroup } from '../utils/joueurExperienceTheme';

/**
 * Labels dock joueur — refonte Player §4 : Accueil · Calendrier · Ma Carte · Menu.
 * Le dock impose 4 destinations ; « Saison » reste ouvert depuis le Menu.
 */
export function getJoueurGameTabLabel(
  tab: MainTabId,
  ageGroup?: JoueurAgeGroup | null,
): string {
  const youth = ageGroup === 'youth';
  const teen = ageGroup === 'teen';

  switch (tab) {
    case 'home':
      return youth ? 'JOUER' : teen ? 'ACCUEIL' : 'Accueil';
    case 'matchs':
      return youth ? 'MATCH' : 'Calendrier';
    case 'feed':
      return youth ? 'SAISON' : 'Ma Carte';
    case 'progression':
      return youth ? 'NIVEAU' : teen ? 'PROGRESS' : 'Ma Saison';
    case 'profil':
      return youth ? 'MOI' : teen ? 'CARTE' : 'Ma Carte';
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
    case 'plus':
      return youth ? 'PLUS' : 'Menu';
    default: {
      const _exhaustive: never = tab;
      return String(_exhaustive);
    }
  }
}
