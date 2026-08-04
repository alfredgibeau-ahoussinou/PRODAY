/**
 * AI career assistant — personalized pathways for players (ProDay exclusive).
 * Grounded in Pulse, availability, Mercato readiness and verification — not generic tips.
 */

import type { User } from '../../models/User';
import { getProfileCompletion } from '../../utils/profileCompletion';
import { resolvePlayerLevel } from '../../utils/playerLevelBadge';
import { hasJoueurVerifieBadge } from '../../utils/proPlayerVerification';
import type { MainTabId } from '../../navigation/mainTabConfig';

export type CareerPathwayKind =
  | 'complete_profile'
  | 'verify_player'
  | 'publish_highlight'
  | 'open_availability'
  | 'apply_mercato'
  | 'join_tournament'
  | 'log_activity'
  | 'book_health'
  | 'network_region';

export interface CareerPathwayStep {
  id: CareerPathwayKind;
  title: string;
  reason: string;
  priority: number;
  tab: MainTabId;
  /** Optional Mercato deep link hint. */
  mercatoView?: 'home' | 'players' | 'talent_radar';
}

export interface CareerPathwayPlan {
  headline: string;
  levelLabel: string;
  steps: CareerPathwayStep[];
  readinessScore: number;
}

export function buildCareerPathwayPlan(input: {
  player: User;
  pulseScore?: number;
  openTournamentCount?: number;
  pendingApplications?: number;
}): CareerPathwayPlan {
  const { player } = input;
  const completion = getProfileCompletion(player).percent;
  const levelId = resolvePlayerLevel(player);
  const levelLabel =
    levelId === 'professional' ? 'Pro' : levelId === 'academy' ? 'Centre / aspirant' : 'Amateur';
  const pulse = input.pulseScore ?? 0;
  const steps: CareerPathwayStep[] = [];

  if (completion < 70) {
    steps.push({
      id: 'complete_profile',
      title: 'Compléter votre fiche',
      reason: `Profil à ${completion}% — les recruteurs filtrent les fiches riches.`,
      priority: 95,
      tab: 'profil',
    });
  }

  if (!hasJoueurVerifieBadge(player)) {
    steps.push({
      id: 'verify_player',
      title: 'Obtenir le badge vérifié',
      reason: 'Licence ou certification club = confiance Mercato.',
      priority: 88,
      tab: 'profil',
    });
  }

  const highlights = player.profile.highlight_video_urls?.filter(Boolean).length ?? 0;
  if (highlights === 0) {
    steps.push({
      id: 'publish_highlight',
      title: 'Ajouter un highlight',
      reason: 'Une vidéo courte multiplie les Opportunity Score staff.',
      priority: 82,
      tab: 'profil',
    });
  }

  if (player.profile.availability !== 'available') {
    steps.push({
      id: 'open_availability',
      title: 'Passer en disponible',
      reason: 'Les alertes shortlist et le matching agent se déclenchent sur « Libre ».',
      priority: 78,
      tab: 'profil',
    });
  }

  if ((input.pendingApplications ?? 0) === 0 && completion >= 50) {
    steps.push({
      id: 'apply_mercato',
      title: 'Candidater sur le Mercato',
      reason: 'Annonces alignées poste / niveau / ville vous attendent.',
      priority: 74,
      tab: 'recrutement',
      mercatoView: 'home',
    });
  }

  if ((input.openTournamentCount ?? 0) > 0) {
    steps.push({
      id: 'join_tournament',
      title: 'S’inscrire à un tournoi Arena',
      reason: `${input.openTournamentCount} tournoi(s) ouvert(s) — visibilité + matchs.`,
      priority: 70,
      tab: 'matchs',
    });
  }

  if (pulse < 55) {
    steps.push({
      id: 'log_activity',
      title: 'Journaliser une séance',
      reason: 'Le Pulse se nourrit de votre activité réelle.',
      priority: 66,
      tab: 'profil',
    });
  }

  if (levelId !== 'professional') {
    steps.push({
      id: 'network_region',
      title: 'Explorer le réseau local',
      reason: 'Carte ProDay : clubs, essais et partenaires près de chez vous.',
      priority: 58,
      tab: 'home',
    });
  }

  steps.push({
    id: 'book_health',
    title: 'Préparer la charge (santé)',
    reason: 'Un RDV kiné / suivi limite les blessures en période de détection.',
    priority: 40,
    tab: 'sante',
  });

  const ordered = [...steps].sort((a, b) => b.priority - a.priority).slice(0, 5);

  let readiness = 35;
  readiness += Math.round(completion * 0.25);
  if (hasJoueurVerifieBadge(player)) readiness += 12;
  if (highlights > 0) readiness += 10;
  if (player.profile.availability === 'available') readiness += 10;
  readiness += Math.min(15, Math.round(pulse * 0.15));
  readiness = Math.min(98, Math.max(20, readiness));

  const headline =
    readiness >= 75
      ? 'Parcours prêt pour le Mercato'
      : readiness >= 55
        ? 'Encore 2–3 actions pour accélérer'
        : 'Construisons votre visibilité étape par étape';

  return {
    headline,
    levelLabel,
    steps: ordered,
    readinessScore: readiness,
  };
}
