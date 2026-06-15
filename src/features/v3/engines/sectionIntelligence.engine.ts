import type { MainTabId } from '../../../navigation/mainTabConfig';
import type { HealthState } from '../../../core/types/health';
import type { SectionInsight, SectionIntelligence } from '../models/sectionIntelligence';

export type { SectionIntelligence, SectionInsight };

export interface SectionIntelligenceInput {
  tab: MainTabId;
  healthState?: HealthState;
  coachMessage?: string;
  pendingConvocations?: number;
  openMatches?: number;
  liveMatches?: number;
  mercatoPosts?: number;
  unreadMessages?: number;
  nearbyMatches?: number;
  availableRides?: number;
  progressionLevel?: number;
  streakDays?: number;
  globalScore?: number;
  city?: string;
  pendingAppointments?: number;
  todayAppointments?: number;
  sponsorLeads?: number;
  activeOffers?: number;
  staffMode?: boolean;
  mercatoApplications?: number;
}

function pickTop(insights: SectionInsight[]): SectionInsight | undefined {
  return [...insights].sort((a, b) => b.priority - a.priority)[0];
}

/** Intelligence contextuelle par onglet (spec §2.2, §11). */
export function buildSectionIntelligence(input: SectionIntelligenceInput): SectionIntelligence {
  const insights: SectionInsight[] = [];

  if (input.healthState === 'INJURY_RISK' || input.healthState === 'OVERLOADED') {
    insights.push({
      id: 'health-rest',
      label: 'Récupération',
      detail: input.coachMessage ?? 'Charge élevée — adaptez votre activité.',
      priority: 95,
      tab: 'sante',
    });
  }

  switch (input.tab) {
    case 'home':
      if ((input.pendingAppointments ?? 0) > 0) {
        insights.push({
          id: 'physio-pending',
          label: 'Cabinet',
          detail: `${input.pendingAppointments} demande(s) de RDV à confirmer`,
          priority: 92,
        });
      }
      if ((input.todayAppointments ?? 0) > 0) {
        insights.push({
          id: 'physio-today',
          label: "Aujourd'hui",
          detail: `${input.todayAppointments} consultation(s) planifiée(s)`,
          priority: 88,
        });
      }
      if ((input.sponsorLeads ?? 0) > 0) {
        insights.push({
          id: 'sponsor-leads',
          label: 'Prospects',
          detail: `${input.sponsorLeads} contact(s) à relancer`,
          priority: 86,
        });
      }
      if ((input.activeOffers ?? 0) > 0) {
        insights.push({
          id: 'sponsor-offers',
          label: 'Campagnes',
          detail: `${input.activeOffers} offre(s) active(s)`,
          priority: 82,
        });
      }
      break;
    case 'matchs':
      if ((input.pendingConvocations ?? 0) > 0) {
        insights.push({
          id: 'convoc',
          label: 'Convocations',
          detail: `${input.pendingConvocations} réponse(s) attendue(s)`,
          priority: 90,
        });
      }
      if ((input.liveMatches ?? 0) > 0) {
        insights.push({
          id: 'live',
          label: 'En direct',
          detail: `${input.liveMatches} match(s) en cours`,
          priority: 88,
        });
      }
      if ((input.openMatches ?? 0) > 0 && input.healthState !== 'INJURY_RISK') {
        insights.push({
          id: 'open',
          label: 'Matchs ouverts',
          detail: `${input.openMatches} opportunité(s) compatible(s)`,
          priority: 82,
        });
      }
      break;
    case 'recrutement':
      if ((input.mercatoApplications ?? 0) > 0) {
        insights.push({
          id: 'candidates-pending',
          label: 'Pipeline',
          detail: `${input.mercatoApplications} candidature(s) à traiter`,
          priority: 92,
        });
      }
      if ((input.mercatoPosts ?? 0) > 0) {
        insights.push({
          id: 'mercato',
          label: input.staffMode ? 'Vos annonces' : 'Mercato',
          detail: input.staffMode
            ? `${input.mercatoPosts} annonce(s) publiée(s)`
            : `${input.mercatoPosts} annonce(s) active(s)`,
          priority: 85,
        });
      }
      if (input.staffMode) {
        insights.push({
          id: 'scouting',
          label: 'Scouting',
          detail: 'Explorez la base joueurs et affinez vos filtres',
          priority: 72,
        });
      } else {
        insights.push({
          id: 'visibility',
          label: 'Visibilité',
          detail: `Score global ${input.globalScore ?? 0} — postulez pour progresser`,
          priority: 70,
        });
      }
      break;
    case 'sante':
      if ((input.pendingAppointments ?? 0) > 0) {
        insights.push({
          id: 'physio-queue',
          label: 'RDV patients',
          detail: `${input.pendingAppointments} demande(s) en attente de validation`,
          priority: 90,
        });
      }
      insights.push({
        id: 'coach',
        label: 'Coach',
        detail: input.coachMessage ?? 'Suivez votre plan quotidien.',
        priority: 80,
      });
      break;
    case 'covoiturage':
      if ((input.availableRides ?? 0) > 0) {
        insights.push({
          id: 'rides',
          label: 'Places disponibles',
          detail: `${input.availableRides} trajet(s) à proximité`,
          priority: 88,
        });
      }
      break;
    case 'messages':
      if ((input.unreadMessages ?? 0) > 0) {
        insights.push({
          id: 'social',
          label: 'Messages en attente',
          detail: `${input.unreadMessages} non lu(s) — répondez pour garder le contact`,
          priority: 82,
          tab: 'messages',
        });
      }
      insights.push({
        id: 'social-network',
        label: 'Contacts suggérés',
        detail: 'Personnes recommandées selon vos matchs et votre ville',
        priority: 68,
      });
      break;
    case 'feed':
      insights.push({
        id: 'feed-local',
        label: 'Fil local',
        detail: input.city
          ? `Contenu priorisé près de ${input.city}`
          : 'Actualités et sondages triés selon votre profil',
        priority: 72,
      });
      break;
    case 'profil':
      insights.push({
        id: 'progress',
        label: 'Progression',
        detail: `Niveau ${input.progressionLevel ?? 1} · ${input.streakDays ?? 0}j actifs`,
        priority: 78,
      });
      break;
    case 'reels':
      insights.push({
        id: 'content',
        label: 'Contenu',
        detail: 'Réels filtrés selon votre état et vos objectifs',
        priority: 65,
      });
      break;
    case 'shop':
      insights.push({
        id: 'gear',
        label: 'Équipement',
        detail: 'Précommandes ProDay et services équipe',
        priority: 72,
      });
      break;
    default:
      break;
  }

  if ((input.nearbyMatches ?? 0) > 0 && input.tab !== 'matchs') {
    insights.push({
      id: 'geo-match',
      label: 'Proximité',
      detail: `${input.nearbyMatches} match(s) près de vous`,
      priority: 72,
      tab: 'matchs',
    });
  }

  const top = pickTop(insights);
  const headlines: Record<MainTabId, string> = {
    home: 'Cockpit du jour',
    matchs: 'Votre saison',
    recrutement: 'Opportunités',
    covoiturage: 'Trajets équipe',
    sante: 'Bien-être',
    feed: 'Communauté',
    reels: 'Réels sportifs',
    messages: 'Réseau',
    profil: 'Identité',
    shop: 'Boutique',
  };

  return {
    tab: input.tab,
    headline: top?.label ?? headlines[input.tab] ?? 'ProDay',
    summary: top?.detail ?? 'Le système adapte cette section à votre activité.',
    primaryAction: top
      ? { label: 'Voir', insightId: top.id }
      : undefined,
    insights: insights.sort((a, b) => b.priority - a.priority).slice(0, 4),
  };
}

export function prioritizeModules(modulePriority: MainTabId[]): MainTabId[] {
  const seen = new Set<MainTabId>();
  const out: MainTabId[] = [];
  for (const tab of modulePriority) {
    if (!seen.has(tab)) {
      seen.add(tab);
      out.push(tab);
    }
  }
  return out;
}
