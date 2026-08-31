/**
 * Helpers purs pilotage Sponsor — prochaines actions, sous-titres (testables).
 */
import type { IconName } from '../components/ui/iconNames';
import type { SponsorContentSegment, SponsorMainTabId } from '../navigation/sponsorTabConfig';

export type SponsorNextActionId =
  | 'await_approval'
  | 'create_offer'
  | 'open_messages'
  | 'contact_prospects'
  | 'fund_clubs'
  | 'view_offers';

export type SponsorNextAction = {
  id: SponsorNextActionId;
  title: string;
  hint: string;
  icon: IconName;
  tab: SponsorMainTabId;
  segment?: SponsorContentSegment;
  /** Créer une offre (shell) plutôt que naviguer. */
  createOffer?: boolean;
  primary?: boolean;
};

export function resolveSponsorHubSubtitle(input: {
  approved: boolean;
  activeOffers: number;
  prospectCount: number;
  unreadMessages: number;
  clubsSupported: number;
}): string {
  if (!input.approved) {
    return 'Validation en cours · préparez offres et prospects';
  }
  if (input.unreadMessages > 0) {
    return `${input.unreadMessages} message${input.unreadMessages > 1 ? 's' : ''} club non lu${input.unreadMessages > 1 ? 's' : ''}`;
  }
  if (input.activeOffers === 0) {
    return 'Publiez une offre pour toucher les clubs de votre zone';
  }
  if (input.prospectCount > 0) {
    return `${input.prospectCount} club${input.prospectCount > 1 ? 's' : ''} à contacter · ${input.activeOffers} offre${input.activeOffers > 1 ? 's' : ''} active${input.activeOffers > 1 ? 's' : ''}`;
  }
  if (input.clubsSupported > 0) {
    return `${input.clubsSupported} club${input.clubsSupported > 1 ? 's' : ''} soutenu${input.clubsSupported > 1 ? 's' : ''} · pilotage campagne`;
  }
  return 'Offres, clubs et réseau local';
}

/** Priorise 3 actions max — CTAs vers écrans existants. */
export function buildSponsorNextActions(input: {
  approved: boolean;
  activeOffers: number;
  prospectCount: number;
  unreadMessages: number;
  clubsSupported: number;
  openGoals?: number;
}): SponsorNextAction[] {
  const actions: SponsorNextAction[] = [];

  if (!input.approved) {
    actions.push({
      id: 'await_approval',
      title: 'Espace en validation',
      hint: 'Explorez formules et prospects en attendant l’accord admin',
      icon: 'time',
      tab: 'tarifs',
      primary: true,
    });
    actions.push({
      id: 'contact_prospects',
      title: 'Explorer les prospects',
      hint: 'Clubs de votre zone à préparer',
      icon: 'people',
      tab: 'reseau',
      segment: 'prospects',
    });
    return actions.slice(0, 3);
  }

  if (input.unreadMessages > 0) {
    actions.push({
      id: 'open_messages',
      title: 'Lire les messages clubs',
      hint: `${input.unreadMessages} conversation${input.unreadMessages > 1 ? 's' : ''} en attente`,
      icon: 'chat',
      tab: 'reseau',
      segment: 'messages',
      primary: true,
    });
  }

  if (input.activeOffers === 0) {
    actions.push({
      id: 'create_offer',
      title: 'Créer une offre',
      hint: 'Visibilité, équipement ou financement',
      icon: 'add',
      tab: 'offres',
      createOffer: true,
      primary: actions.length === 0,
    });
  } else {
    actions.push({
      id: 'view_offers',
      title: 'Piloter mes offres',
      hint: `${input.activeOffers} active${input.activeOffers > 1 ? 's' : ''} · campagnes & statut`,
      icon: 'briefcase',
      tab: 'offres',
      primary: actions.length === 0,
    });
  }

  if (input.prospectCount > 0) {
    actions.push({
      id: 'contact_prospects',
      title: 'Contacter des clubs',
      hint: `${input.prospectCount} prospect${input.prospectCount > 1 ? 's' : ''} à activer`,
      icon: 'people',
      tab: 'reseau',
      segment: 'prospects',
      primary: actions.length === 0,
    });
  }

  const openGoals = input.openGoals ?? 0;
  if (openGoals > 0 || input.clubsSupported === 0) {
    actions.push({
      id: 'fund_clubs',
      title: 'Financer un club',
      hint:
        openGoals > 0
          ? `${openGoals} collecte${openGoals > 1 ? 's' : ''} en cours`
          : 'Objectifs de saison à soutenir',
      icon: 'handshake',
      tab: 'clubs',
    });
  }

  // Déduplique par id, garde l’ordre, max 3
  const seen = new Set<SponsorNextActionId>();
  const unique: SponsorNextAction[] = [];
  for (const a of actions) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    unique.push(a);
    if (unique.length >= 3) break;
  }
  return unique;
}

export function sponsorNetworkEmptyCopy(segment: 'messages' | 'prospects'): {
  title: string;
  body: string;
  primaryCta: string;
  secondaryCta?: string;
} {
  if (segment === 'prospects') {
    return {
      title: 'Aucun prospect pour l’instant',
      body: 'Dès qu’un club de votre zone match vos offres, il apparaîtra ici.',
      primaryCta: 'Voir mes offres',
      secondaryCta: 'Financement clubs',
    };
  }
  return {
    title: 'Aucune conversation',
    body: 'Contactez un prospect ou publiez une offre pour démarrer un échange club.',
    primaryCta: 'Voir les prospects',
    secondaryCta: 'Créer une offre',
  };
}
