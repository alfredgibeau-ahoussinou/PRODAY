import {
  IOS_BETA_LAUNCH_LABEL,
  IOS_BETA_LAUNCH_LABEL_SHORT,
  IOS_BETA_LAUNCH_PREVIOUS_LABEL_SHORT,
} from './betaIosCampaignConstants';
import {
  buildProdayEmailShell,
  emailCta,
  emailCtaRow,
  emailKicker,
  emailList,
  emailOrderedList,
  emailPanel,
  emailParagraph,
  emailTitle,
} from './betaEmailLayout';

export type BetaCampaignEmailParams = {
  email: string;
  roleLabel?: string;
  siteUrl?: string;
  testflightUrl?: string;
  accessToken?: string;
};

function siteBase(siteUrl?: string): string {
  return (siteUrl ?? 'https://proday75.fr').replace(/\/$/, '');
}

function buildBetaAccessUrl(site: string, accessToken?: string): string {
  if (accessToken?.trim()) {
    return `${site}/beta/programme?token=${encodeURIComponent(accessToken.trim())}`;
  }
  return `${site}/beta/programme`;
}

function buildBetaInstallerUrl(site: string, accessToken?: string): string {
  if (accessToken?.trim()) {
    return `${site}/beta/installer?token=${encodeURIComponent(accessToken.trim())}`;
  }
  return `${site}/beta/installer`;
}

export function buildBetaIosPreAnnouncementEmail(params: BetaCampaignEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const site = siteBase(params.siteUrl);
  const roleLine = params.roleLabel
    ? `Merci pour votre inscription en tant que ${params.roleLabel}.`
    : 'Merci pour votre inscription à la bêta ProDay.';
  const subject = `Bêta iOS ProDay — disponible le ${IOS_BETA_LAUNCH_LABEL_SHORT} à 18 h`;

  const text = [
    'Bonjour,',
    '',
    roleLine,
    '',
    `La bêta iOS de ProDay sera disponible à partir du ${IOS_BETA_LAUNCH_LABEL}.`,
    '',
    "ProDay est l'app qui unifie profil, matchs, recrutement (Mercato), club et communauté pour le foot amateur et semi-pro.",
    '',
    'Ce qui vous attend :',
    `• Le ${IOS_BETA_LAUNCH_LABEL} : ouverture de la bêta iOS via TestFlight Apple.`,
    "• Vous recevrez un second email avec le lien TestFlight dès l'ouverture.",
    "• Android : l'APK reste disponible depuis votre espace bêta (onglet Installer).",
    '',
    `Inscription : ${site}/beta/inscription`,
    `Espace bêta : ${buildBetaAccessUrl(site, params.accessToken)}`,
    '',
    'À très bientôt sur le terrain,',
    "L'équipe ProDay",
  ].join('\n');

  const html = buildProdayEmailShell({
    subject,
    preheader: `Ouverture iOS le ${IOS_BETA_LAUNCH_LABEL} via TestFlight.`,
    bodyHtml: `
      ${emailKicker('Campagne iOS')}
      ${emailTitle('Bêta iOS — date confirmée')}
      ${emailParagraph(roleLine)}
      ${emailPanel({
        kicker: 'Ouverture iOS',
        title: IOS_BETA_LAUNCH_LABEL,
        body: 'Distribution via <strong style="color:#ffffff;">TestFlight</strong> Apple. Vous recevrez le lien d&apos;accès par email dès l&apos;ouverture.',
      })}
      ${emailParagraph(
        "En attendant, l'APK Android reste disponible depuis l'onglet Installer de votre espace bêta.",
      )}
      ${emailCtaRow(
        emailCta(buildBetaAccessUrl(site, params.accessToken), 'Espace bêta'),
        emailCta(`${site}/beta/inscription`, 'Page bêta', false),
      )}
    `,
  });

  return { subject, html, text };
}

/** Email d'information : report de la bêta au 15 août 2026. */
export function buildBetaIosDelayNoticeEmail(params: BetaCampaignEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const site = siteBase(params.siteUrl);
  const roleLine = params.roleLabel
    ? `Merci pour votre inscription en tant que ${params.roleLabel}.`
    : 'Merci pour votre inscription à la bêta ProDay.';
  const subject = `ProDay — bêta décalée au ${IOS_BETA_LAUNCH_LABEL_SHORT}`;

  const text = [
    'Bonjour,',
    '',
    roleLine,
    '',
    `Information importante : la bêta ProDay initialement prévue le ${IOS_BETA_LAUNCH_PREVIOUS_LABEL_SHORT} a été décalée au ${IOS_BETA_LAUNCH_LABEL}.`,
    '',
    "Ce report est dû à des améliorations nécessaires au bon développement de l'application.",
    '',
    'Ce qui ne change pas :',
    "• Votre inscription reste valide — aucune action n'est requise.",
    `• Ouverture iOS (TestFlight) : ${IOS_BETA_LAUNCH_LABEL}.`,
    "• Vous recevrez un email avec le lien TestFlight dès l'ouverture.",
    "• Android : l'APK reste disponible depuis votre espace bêta (onglet Installer).",
    '',
    `Espace bêta : ${buildBetaAccessUrl(site, params.accessToken)}`,
    `Page bêta : ${site}/beta/inscription`,
    '',
    'Merci pour votre patience et votre confiance,',
    "L'équipe ProDay",
  ].join('\n');

  const html = buildProdayEmailShell({
    subject,
    preheader: `Nouvelle date : ${IOS_BETA_LAUNCH_LABEL}. Votre inscription reste valide.`,
    bodyHtml: `
      ${emailKicker('Information importante')}
      ${emailTitle(`Bêta décalée au ${IOS_BETA_LAUNCH_LABEL_SHORT}`)}
      ${emailParagraph(roleLine)}
      ${emailParagraph(
        `La bêta ProDay initialement prévue le <strong style="color:#ffffff;">${IOS_BETA_LAUNCH_PREVIOUS_LABEL_SHORT}</strong> a été décalée au <strong style="color:#ffffff;">${IOS_BETA_LAUNCH_LABEL}</strong>.`,
      )}
      ${emailPanel({
        kicker: 'Pourquoi ce report ?',
        body: "Des améliorations sont nécessaires au bon développement de l'application pour la version bêta. Nous préférons ouvrir une expérience plus solide.",
      })}
      ${emailPanel({
        kicker: 'Nouvelle date',
        title: IOS_BETA_LAUNCH_LABEL,
        body: "Votre inscription reste valide. Aucune action n'est requise de votre part.",
      })}
      ${emailParagraph(
        "Dès l'ouverture, vous recevrez le lien TestFlight par email. L'APK Android reste disponible depuis l'onglet Installer.",
      )}
      ${emailCtaRow(
        emailCta(buildBetaAccessUrl(site, params.accessToken), 'Espace bêta'),
        emailCta(`${site}/beta/inscription`, 'Page bêta', false),
      )}
    `,
  });

  return { subject, html, text };
}

export function buildBetaIosLaunchEmail(params: BetaCampaignEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const site = siteBase(params.siteUrl);
  const testflight = params.testflightUrl?.trim() || `${site}/beta/installer`;
  const subject = 'Bêta iOS ProDay ouverte — installez via TestFlight';

  const text = [
    'Bonjour,',
    '',
    'La bêta iOS ProDay est officiellement ouverte !',
    '',
    'Installez ProDay sur votre iPhone ou iPad via TestFlight :',
    testflight,
    '',
    'Étapes rapides :',
    "1. Installez TestFlight depuis l'App Store (gratuit, Apple).",
    '2. Ouvrez le lien ci-dessus sur votre appareil iOS.',
    "3. Acceptez l'invitation et appuyez sur « Installer ».",
    "4. Connectez-vous avec l'email de votre inscription bêta.",
    '',
    `Guide complet : ${buildBetaInstallerUrl(site, params.accessToken)}`,
    '',
    "Vos retours nous aident à améliorer l'app avant le lancement public. Répondez à cet email ou écrivez à proday.admin@gmail.com.",
    '',
    "L'équipe ProDay",
  ].join('\n');

  const html = buildProdayEmailShell({
    subject,
    preheader: 'La bêta iOS est ouverte. Installez ProDay via TestFlight.',
    bodyHtml: `
      ${emailKicker('Lancement')}
      ${emailTitle('La bêta iOS est ouverte')}
      ${emailParagraph(
        "ProDay est disponible sur iPhone et iPad via <strong style=\"color:#ffffff;\">TestFlight</strong>. Installez l'app et connectez-vous avec votre email bêta.",
      )}
      ${emailCtaRow(
        emailCta(testflight, 'Ouvrir TestFlight'),
        emailCta(buildBetaInstallerUrl(site, params.accessToken), 'Guide', false),
      )}
      ${emailKicker('En 4 étapes')}
      ${emailOrderedList([
        'Installez TestFlight (App Store)',
        'Ouvrez le lien sur votre iPhone / iPad',
        'Acceptez et installez ProDay',
        'Connectez-vous avec votre email bêta',
      ])}
    `,
  });

  return { subject, html, text };
}

export type EngagementTopic = {
  id: string;
  subject: string;
  title: string;
  lead: string;
  bullets: string[];
  tip: string;
};

export const BETA_ENGAGEMENT_TOPICS: EngagementTopic[] = [
  {
    id: 'pulse',
    subject: 'ProDay bêta — découvrez le Pulse et votre score de visibilité',
    title: 'Pulse ProDay : votre visibilité en un chiffre',
    lead: 'Le Pulse combine profil, activité et confiance pour mesurer votre visibilité auprès des clubs.',
    bullets: [
      'Complétez votre profil (photo, poste, niveau, ville)',
      'Participez aux matchs et enregistrez vos stats',
      'Candidatez sur le Mercato pour booster votre score',
    ],
    tip: "Un profil à jour augmente vos chances d'être repéré par les recruteurs.",
  },
  {
    id: 'mercato',
    subject: 'ProDay bêta — le Mercato : recrutez et candidatez',
    title: 'Mercato : recrutement intelligent',
    lead: "Annonces ciblées par poste, niveau et ville. Candidature et suivi depuis l'app.",
    bullets: [
      'Parcourez les annonces filtrées selon votre profil',
      'Candidatez en un geste avec votre CV ProDay',
      'Suivez vos candidatures et les réponses des clubs',
    ],
    tip: 'Les coachs et recruteurs voient votre Pulse et vos stats saison.',
  },
  {
    id: 'matchs',
    subject: 'ProDay bêta — matchs et convocations RSVP',
    title: 'Matchs & convocations',
    lead: 'Fini les groupes WhatsApp : convocations, RSVP et calendrier unifiés.',
    bullets: [
      'Répondez Présent / Absent / Peut-être en un tap',
      'Consultez le calendrier de votre équipe',
      "Recevez des relances automatiques si vous n'avez pas répondu",
    ],
    tip: 'Activez les notifications pour ne manquer aucune convocation.',
  },
  {
    id: 'livestats',
    subject: 'ProDay bêta — Live Stats : vos matchs nourrissent votre profil',
    title: 'Live Stats en direct',
    lead: 'Buts, passes, cartons saisis en live alimentent automatiquement votre profil et CV.',
    bullets: [
      'Le staff saisit les stats pendant le match',
      'Votre profil se met à jour en temps réel',
      "Exportez votre CV PDF depuis l'onglet Profil",
    ],
    tip: "Demandez à votre coach d'activer Live Stats pour vos prochains matchs.",
  },
  {
    id: 'arena',
    subject: 'ProDay bêta — Arena : tournois et palmarès',
    title: 'Arena — tournois et détections',
    lead: 'Créez ou rejoignez des tournois, gérez les inscriptions et publiez les palmarès.',
    bullets: [
      'Inscrivez votre club à un tournoi Arena',
      'Suivez tableaux, scores et classements',
      "Consultez l'historique des compétitions",
    ],
    tip: 'Les organisateurs peuvent créer un tournoi depuis le pôle Pro Staff.',
  },
  {
    id: 'fil-reels',
    subject: 'ProDay bêta — Fil & Reels : la communauté ProDay',
    title: 'Fil & Reels',
    lead: 'Publications clubs et joueurs, vidéos courtes et question hebdo pour animer la communauté.',
    bullets: [
      'Publiez vos moments forts en Reels',
      'Réagissez aux posts du Fil',
      'Participez à la question de la semaine',
    ],
    tip: 'Les Reels augmentent votre visibilité sur le profil Pulse.',
  },
  {
    id: 'covoit',
    subject: 'ProDay bêta — covoiturage intégré aux matchs',
    title: 'Covoiturage match & détection',
    lead: 'Proposez ou réservez un trajet directement depuis un événement.',
    bullets: [
      'Publiez un trajet depuis la fiche match',
      'Indiquez places disponibles et point de rendez-vous',
      'Contactez le conducteur via la messagerie sécurisée',
    ],
    tip: 'Idéal pour les déplacements district et régional.',
  },
  {
    id: 'sante',
    subject: 'ProDay bêta — pôle santé : praticiens près de votre club',
    title: 'Pôle santé',
    lead: 'Kiné, ostéo, prépa, nutrition, mental — annuaire vérifié près des clubs.',
    bullets: [
      'Recherchez un praticien par spécialité et zone',
      'Prenez rendez-vous en ligne (selon praticien)',
      'Messagerie sécurisée après validation diplôme',
    ],
    tip: 'Les praticiens vérifiés affichent un badge vert.',
  },
  {
    id: 'journal-ia',
    subject: "ProDay bêta — journal d'activités et analyse IA",
    title: 'Journal & analyse IA',
    lead: "Enregistrez vos séances et highlights — l'IA analyse vos extraits vidéo ou images + notes.",
    bullets: [
      'Ajoutez une séance, match ou highlight au journal',
      'Joignez une miniature vidéo ou un poster + tags',
      'Consultez le retour IA sur vos points forts',
    ],
    tip: "L'analyse porte sur vos highlights enregistrés, pas sur le match entier.",
  },
  {
    id: 'navigation',
    subject: "ProDay bêta — astuces : naviguer dans l'app",
    title: '9 onglets, un écosystème',
    lead: 'Accueil, Mercato, Matchs, Reels, Fil, Covoit., Santé, Messages, Profil — certains masqués selon votre pôle.',
    bullets: [
      "Le dashboard IA d'accueil recommande matchs et alertes",
      'Changez de pôle depuis Profil si votre rôle évolue',
      'Explorez les 7 univers depuis le programme bêta',
    ],
    tip: 'Consultez proday75.fr/demo pour prévisualiser les onglets sans installer.',
  },
  {
    id: 'retours',
    subject: 'ProDay bêta — vos retours comptent',
    title: 'Envoyez vos retours',
    lead: "Bug, idée, suggestion — chaque message est lu par l'équipe ProDay.",
    bullets: [
      'Répondez à cet email ou écrivez à proday.admin@gmail.com',
      'Indiquez votre profil, version et capture d\'écran',
      "Signalez les blocages sur TestFlight ou l'APK Android",
    ],
    tip: 'Les beta-testeurs prioritaires seront contactés pour les prochaines vagues.',
  },
  {
    id: 'mises-a-jour',
    subject: 'ProDay bêta — mises à jour et nouveautés',
    title: 'Mises à jour régulières',
    lead: 'Nous publions de nouvelles builds iOS (TestFlight) et Android (APK) pendant la bêta.',
    bullets: [
      'iOS : mettez à jour via TestFlight quand une build arrive',
      "Android : retéléchargez l'APK depuis l'onglet Installer",
      'Consultez le programme bêta pour le calendrier',
    ],
    tip: 'Activez les notifications TestFlight pour ne rien manquer.',
  },
];

export function buildBetaEngagementEmail(
  topic: EngagementTopic,
  params: BetaCampaignEmailParams,
): { subject: string; html: string; text: string } {
  const site = siteBase(params.siteUrl);
  const subject = topic.subject;

  const text = [
    'Bonjour,',
    '',
    topic.lead,
    '',
    ...topic.bullets.map((b) => `• ${b}`),
    '',
    `Astuce : ${topic.tip}`,
    '',
    `Espace bêta : ${buildBetaAccessUrl(site, params.accessToken)}`,
    '',
    "L'équipe ProDay",
  ].join('\n');

  const html = buildProdayEmailShell({
    subject,
    preheader: topic.lead,
    bodyHtml: `
      ${emailKicker('Astuce bêta')}
      ${emailTitle(topic.title)}
      ${emailParagraph(topic.lead)}
      ${emailList(topic.bullets)}
      ${emailPanel({
        kicker: 'Astuce',
        body: topic.tip,
      })}
      ${emailCtaRow(emailCta(buildBetaAccessUrl(site, params.accessToken), 'Ouvrir ProDay bêta'))}
    `,
  });

  return { subject, html, text };
}

export function getEngagementTopic(roundIndex: number): EngagementTopic {
  const idx =
    ((roundIndex - 1) % BETA_ENGAGEMENT_TOPICS.length + BETA_ENGAGEMENT_TOPICS.length) %
    BETA_ENGAGEMENT_TOPICS.length;
  return BETA_ENGAGEMENT_TOPICS[idx]!;
}
