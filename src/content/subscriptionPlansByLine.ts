import type { ProductLineId } from '../models/ProductLine';
import { withProFamilyRecord } from '../models/ProductLine';
import type { UserRole } from '../models/User';
import { getUniverseIdentity } from './brandExperience';
import {
  SUBSCRIPTION_PLANS,
  getPlanDefinition,
  planIdForRole,
  type SubscriptionPlanDefinition,
  type SubscriptionPlanId,
} from './subscriptionPlans';

type PlanPresentationPatch = Partial<
  Pick<SubscriptionPlanDefinition, 'label' | 'tagline' | 'freeIncludes' | 'proIncludes'>
> & {
  mercatoQuotaLabel?: string;
};

/** Plans éligibles par univers (aligné site web). */
export const PLAN_IDS_BY_LINE: Record<ProductLineId, SubscriptionPlanId[]> =
  withProFamilyRecord({
  homme: ['player_plus'],
  woman: ['player_plus'],
  amateur: ['player_plus', 'coach_pro'],
  supporter: ['player_plus'],
  pro: [
    'recruiter_pro',
    'coach_pro',
    'club_pro',
    'agent_elite',
    'organizer_pro',
    'sponsor_pro',
  ],
  sante: ['physio_pro'],
});

const LINE_PLAN_PATCHES: Record<
  ProductLineId,
  Partial<Record<SubscriptionPlanId, PlanPresentationPatch>>
> = withProFamilyRecord({
  homme: {
    player_plus: {
      label: 'Joueur Plus',
      tagline: 'CV joueur, Pulse et Mercato M',
      mercatoQuotaLabel: 'Candidatures Mercato M',
      freeIncludes: [
        'Profil, Pulse et CV foot en ligne',
        'Galerie et stats saison',
        'Mercato M en lecture',
        '1 candidature Mercato M / mois',
        'Calendrier, covoiturage et RSVP équipe',
      ],
      proIncludes: [
        'Candidatures Mercato M illimitées',
        'Mise en avant auprès des clubs M',
        'Alertes nouvelles annonces Mercato M',
        'Export PDF optionnel',
      ],
    },
  },
  woman: {
    player_plus: {
      label: 'Joueuse Plus',
      tagline: 'CV joueuse, Pulse et Mercato F',
      mercatoQuotaLabel: 'Candidatures Mercato F',
      freeIncludes: [
        'Profil, Pulse et CV joueuse en ligne',
        'Galerie et stats saison (catégorie F)',
        'Mercato F en lecture',
        '1 candidature Mercato F / mois',
        'Calendrier, covoiturage et RSVP équipe',
      ],
      proIncludes: [
        'Candidatures Mercato F illimitées',
        'Mise en avant dans les recherches F',
        'Alertes nouvelles annonces Mercato F',
        'Export PDF optionnel',
      ],
    },
  },
  amateur: {
    player_plus: {
      label: 'Joueur Amateur',
      tagline: 'CV joueur, Pulse et Mercato Amateur',
      mercatoQuotaLabel: 'Candidatures Mercato Amateur',
      freeIncludes: [
        'Profil, Pulse et CV foot en ligne',
        'Galerie et stats saison',
        'Mercato Amateur en lecture',
        '1 candidature Mercato Amateur / mois',
        'Calendrier, covoiturage et RSVP équipe',
      ],
      proIncludes: [
        'Candidatures Mercato Amateur illimitées',
        'Mise en avant auprès des clubs locaux',
        'Alertes nouvelles annonces Mercato Amateur',
        'Export PDF optionnel',
      ],
    },
    coach_pro: {
      label: 'Coach Amateur',
      tagline: 'Banc technique — effectif et Mercato local',
      mercatoQuotaLabel: 'Messages Mercato Amateur',
      freeIncludes: [
        'Profil coach amateur vérifié',
        '1 équipe liée',
        '5 messages Mercato Amateur / mois',
        'Annonces Mercato local en lecture',
      ],
      proIncludes: [
        'Équipes illimitées',
        'Messages Mercato Amateur illimités',
        'Annonces Mercato local actives',
        'Statistiques effectif',
      ],
    },
  },
  supporter: {
    player_plus: {
      label: 'Supporter Plus',
      tagline: 'Tribune numérique — matchs, réels et fil',
      freeIncludes: [
        'Profil supporter et clubs favoris',
        'Calendrier matchs en lecture',
        'Fil communautaire et réactions',
        'Reels et moments forts',
        'Messagerie communauté limitée',
      ],
      proIncludes: [
        'Fil et réactions illimités',
        'Alertes matchs clubs favoris',
        'Badge supporter visible',
        'Accès prioritaire contenus live',
      ],
    },
  },
  pro: {
    recruiter_pro: {
      label: 'Recruteur Pro',
      tagline: 'Scouting, Mercato Pro et pipeline candidatures',
      mercatoQuotaLabel: 'Messages Mercato Pro',
      freeIncludes: [
        'Profil recruteur vérifié',
        'Territoire et spécialité scouting',
        'Mercato Pro en lecture',
        '5 messages recrutement / mois',
      ],
      proIncludes: [
        'Annonces Mercato Pro actives',
        'Pipeline candidatures',
        'Messages recrutement illimités',
        'Statistiques scouting & candidatures',
      ],
    },
    coach_pro: {
      label: 'Coach Pro',
      tagline: 'Banc technique — Mercato Pro et multi-équipes',
      mercatoQuotaLabel: 'Messages Mercato Pro',
      freeIncludes: [
        'Profil staff et vérification',
        '1 équipe liée',
        '5 messages Mercato Pro / mois',
        'Annonces Mercato Pro en lecture',
      ],
      proIncludes: [
        'Équipes illimitées',
        'Messages Mercato Pro illimités',
        'Annonces Mercato Pro actives',
        'Statistiques candidatures',
      ],
    },
    club_pro: {
      label: 'Club Pro',
      tagline: 'Structure club — annonces Mercato Pro',
      mercatoQuotaLabel: 'Annonces Mercato Pro actives',
      freeIncludes: [
        'Profil club et vérification',
        '1 équipe',
        '2 annonces Mercato Pro actives',
        'Gestion convocations (base)',
      ],
      proIncludes: [
        'Annonces Mercato Pro illimitées',
        'Multi-équipes',
        'Priorité dans le fil Mercato Pro',
        'Exports candidatures',
      ],
    },
    agent_elite: {
      label: 'Agent Elite',
      tagline: 'CRM mandats — réseau Mercato Pro premium',
      mercatoQuotaLabel: 'Contacts Mercato Pro',
      freeIncludes: [
        'Profil agent et vérification',
        '10 contacts Mercato Pro / mois',
        'Mercato Pro en lecture',
      ],
      proIncludes: [
        'Contacts Mercato Pro illimités',
        'Alertes géolocalisées',
        'Pipeline mandats',
        'Exports et rapports',
      ],
    },
    physio_pro: {
      label: 'Cabinet Pro',
      tagline: 'Agenda RDV, visibilité clubs — commission sur les consultations',
      mercatoQuotaLabel: 'Messages patients',
      freeIncludes: [
        'Profil praticien et vérification',
        'Spécialité et zone d\'intervention',
        'Visibilité annuaire santé (base)',
        'Messagerie patients limitée',
      ],
      proIncludes: [
        'Visibilité prioritaire près des clubs',
        'Messagerie patients complète',
        'Prise de rendez-vous via l\'app',
        'Commission 10 % uniquement si RDV conclu',
      ],
    },
    organizer_pro: {
      label: 'Organisateur Pro',
      tagline: 'Événements Pro, détections et visibilité locale',
      mercatoQuotaLabel: 'Événements actifs',
      freeIncludes: [
        'Profil organisateur vérifié',
        '1 événement Pro actif',
        'Détections publiées',
        'Calendrier local',
      ],
      proIncludes: [
        'Événements illimités',
        'Visibilité sponsors intégrée',
        'Relances participants',
        'Priorité fil événements Pro',
      ],
    },
    sponsor_pro: {
      label: 'Sponsor Pro',
      tagline: 'Visibilité marque sur l\'écosystème Pro Day Pro',
      mercatoQuotaLabel: 'Offres sponsors actives',
      freeIncludes: [
        'Profil sponsor vérifié',
        'Présence annuaire Sponsors Pro',
        '1 offre active',
        'Zone géographique',
      ],
      proIncludes: [
        'Offres sponsors illimitées',
        'Logo onglet Sponsors',
        'Campagnes locales ciblées',
        'Push géolocalisé local (bêta — opt-in)',
      ],
    },
  },
  sante: {
    physio_pro: {
      label: 'Cabinet Santé',
      tagline: 'Agenda RDV, patients et visibilité clubs',
      mercatoQuotaLabel: 'Messages patients',
      freeIncludes: [
        'Profil praticien et vérification',
        'Spécialité et zone d\'intervention',
        'Visibilité annuaire santé (base)',
        'Messagerie patients limitée',
      ],
      proIncludes: [
        'Visibilité prioritaire près des clubs',
        'Messagerie patients complète',
        'Prise de rendez-vous via l\'app',
        'Commission 10 % uniquement si RDV conclu',
      ],
    },
  },
});

function applyLinePatch(
  base: SubscriptionPlanDefinition,
  line: ProductLineId
): SubscriptionPlanDefinition {
  const patch = LINE_PLAN_PATCHES[line]?.[base.id];
  if (!patch) return { ...base };
  return {
    ...base,
    label: patch.label ?? base.label,
    tagline: patch.tagline ?? base.tagline,
    freeIncludes: patch.freeIncludes ?? base.freeIncludes,
    proIncludes: patch.proIncludes ?? base.proIncludes,
  };
}

export function isPlanAvailableOnLine(
  planId: SubscriptionPlanId,
  line: ProductLineId
): boolean {
  return PLAN_IDS_BY_LINE[line].includes(planId);
}

export function getMercatoQuotaLabel(
  role: UserRole,
  line: ProductLineId
): string | null {
  const planId = planIdForRole(role);
  if (!planId) return null;
  const patch = LINE_PLAN_PATCHES[line]?.[planId];
  if (patch?.mercatoQuotaLabel) return patch.mercatoQuotaLabel;
  const identity = getUniverseIdentity(line);
  if (role === 'player') return `Candidatures ${identity.mercatoLabel}`;
  return 'Messages recrutement';
}

export function getPlanForRoleAndLine(
  role: UserRole,
  line: ProductLineId
): SubscriptionPlanDefinition | null {
  const planId = planIdForRole(role);
  if (!planId || !isPlanAvailableOnLine(planId, line)) return null;
  return applyLinePatch(getPlanDefinition(planId), line);
}

export function plansForProductLine(line: ProductLineId): SubscriptionPlanDefinition[] {
  return PLAN_IDS_BY_LINE[line].map((id) =>
    applyLinePatch(getPlanDefinition(id), line)
  );
}

export function getSubscriptionScreenTitle(line: ProductLineId): string {
  return `Abonnement ${getUniverseIdentity(line).accentLabel}`;
}
