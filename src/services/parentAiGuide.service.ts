import type { ParentTabId } from '../features/parent/navigation/parentNavConfig';

export type ParentGuideAudience = 'child' | 'parent' | 'actions';

export type ParentGuideTip = {
  id: string;
  audience: ParentGuideAudience;
  title: string;
  /** Suggestion actionnable, préfixe « Vous pouvez… ». */
  body: string;
  ctaLabel?: string;
  ctaTab?: ParentTabId;
  /** Toujours étiqueté comme suggestion du guide (pas un diagnostic). */
  labeledAs: 'guide_suggestion';
};

export type ParentGuideContext = {
  childName?: string | null;
  alerts?: string[];
  hasNextEvent?: boolean;
  pendingContacts?: number;
  screenTimeNearLimit?: boolean;
  childrenCount?: number;
};

const AUDIENCE_LABEL: Record<ParentGuideAudience, string> = {
  child: 'À propos de l’enfant',
  parent: 'Pour vous, parent',
  actions: 'Ce que vous pouvez faire',
};

export function audienceLabel(audience: ParentGuideAudience): string {
  return AUDIENCE_LABEL[audience];
}

/**
 * Tips locaux / déterministes — MVP sans CF.
 * Pas de données foot inventées, pas de conseils médicaux.
 */
export function buildParentGuideTips(ctx: ParentGuideContext = {}): ParentGuideTip[] {
  const name = (ctx.childName ?? '').trim() || 'votre enfant';
  const tips: ParentGuideTip[] = [];

  tips.push({
    id: 'child-overview',
    audience: 'child',
    title: `Suivre ${name}`,
    body: `Vous pouvez consulter le profil de ${name}, le temps d’écran du jour et les alertes parentales depuis l’onglet Enfant.`,
    ctaLabel: 'Voir l’enfant',
    ctaTab: 'enfant',
    labeledAs: 'guide_suggestion',
  });

  if ((ctx.alerts?.length ?? 0) > 0) {
    tips.push({
      id: 'child-alerts',
      audience: 'child',
      title: 'Alertes à traiter',
      body: `Vous pouvez traiter les alertes de ${name} (contacts en attente, limites) depuis l’accueil ou les messages.`,
      ctaLabel: 'Ouvrir les messages',
      ctaTab: 'messages',
      labeledAs: 'guide_suggestion',
    });
  }

  if (ctx.hasNextEvent) {
    tips.push({
      id: 'child-next-event',
      audience: 'child',
      title: 'Prochaine séance',
      body: `Vous pouvez confirmer la présence de ${name} (Je viens / Absent) depuis l’Accueil ou l’Agenda, et prévenir le coach en cas de retard.`,
      ctaLabel: 'Ouvrir l’agenda',
      ctaTab: 'agenda',
      labeledAs: 'guide_suggestion',
    });
  }

  if (ctx.screenTimeNearLimit) {
    tips.push({
      id: 'child-screen-time',
      audience: 'child',
      title: 'Temps d’écran',
      body: `Vous pouvez accorder un bonus ponctuel ou ajuster la limite quotidienne dans Profil.`,
      ctaLabel: 'Gérer le temps d’écran',
      ctaTab: 'reglages',
      labeledAs: 'guide_suggestion',
    });
  }

  tips.push({
    id: 'parent-role',
    audience: 'parent',
    title: 'Votre rôle sur ProDay',
    body: 'Vous pouvez superviser le compte mineur lié, sans remplacer le coach ni l’espace joueur.',
    labeledAs: 'guide_suggestion',
  });

  tips.push({
    id: 'parent-supporter',
    audience: 'parent',
    title: 'Pôle Supporter',
    body: 'Vous pouvez ouvrir le pôle Supporter (matchs & clubs suivis) puis revenir ici à tout moment depuis Profil.',
    ctaLabel: 'Ouvrir Supporter',
    ctaTab: 'reglages',
    labeledAs: 'guide_suggestion',
  });

  tips.push({
    id: 'action-link',
    audience: 'actions',
    title: 'Lier un autre enfant',
    body: 'Vous pouvez lier un compte mineur avec le code à 6 chiffres affiché sur son téléphone.',
    ctaLabel: 'Lier un enfant',
    ctaTab: 'reglages',
    labeledAs: 'guide_suggestion',
  });

  if ((ctx.pendingContacts ?? 0) > 0) {
    tips.push({
      id: 'action-contacts',
      audience: 'actions',
      title: 'Contacts en attente',
      body: `Vous pouvez approuver ou refuser ${ctx.pendingContacts} contact(s) en attente dans Messages.`,
      ctaLabel: 'Traiter les contacts',
      ctaTab: 'messages',
      labeledAs: 'guide_suggestion',
    });
  }

  if ((ctx.childrenCount ?? 0) === 0) {
    tips.push({
      id: 'action-first-link',
      audience: 'actions',
      title: 'Commencer',
      body: 'Vous pouvez lier le premier compte enfant pour activer supervision, agenda et contrôles.',
      ctaLabel: 'Lier avec un code',
      ctaTab: 'reglages',
      labeledAs: 'guide_suggestion',
    });
  }

  return tips;
}

/** Entrées type notification in-app (feed local). Stub push = no-op. */
export type ParentGuideNotification = {
  id: string;
  title: string;
  body: string;
  tipId: string;
  audience: ParentGuideAudience;
  read: boolean;
  createdAtIso: string;
};

export function tipsToGuideNotifications(
  tips: ParentGuideTip[],
  now = new Date(),
): ParentGuideNotification[] {
  return tips.map((tip, index) => ({
    id: `guide_${tip.id}`,
    title: `[Guide] ${tip.title}`,
    body: tip.body,
    tipId: tip.id,
    audience: tip.audience,
    read: false,
    createdAtIso: new Date(now.getTime() - index * 1000).toISOString(),
  }));
}

/**
 * Stub — futures Expo Notifications / Cloud Function.
 * Ne planifie rien pour l’instant ; prêt à brancher.
 */
export async function scheduleParentGuideReminders(
  _tips: ParentGuideTip[],
): Promise<{ scheduled: number; mode: 'stub' }> {
  return { scheduled: 0, mode: 'stub' };
}

export const parentAiGuideService = {
  buildTips: buildParentGuideTips,
  toNotifications: tipsToGuideNotifications,
  scheduleReminders: scheduleParentGuideReminders,
  audienceLabel,
};
