/**
 * Textes juridiques ProDay — source unique (app, site, docs).
 * URLs stores : /confidentialite et /cgu sur le site vitrine.
 */
export const LEGAL_META = {
  contactEmail: 'proday.admin@gmail.com',
  publisher: 'ProDay',
  siteUrl: 'https://proday75.fr',
  privacyPath: '/confidentialite',
  termsPath: '/cgu',
  updatedAt: '19 juin 2026',
  pdf: {
    privacy: '/legal/ProDay_Politique_confidentialite.pdf',
    terms: '/legal/ProDay_CGU.pdf',
    sponsor: '/legal/ProDay_Convention_sponsor.pdf',
  },
} as const;

export type LegalSectionContent = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const PRIVACY_INTRO =
  'ProDay (« nous », « l’application ») est une plateforme mobile et web dédiée au football amateur et semi-professionnel : recrutement (Mercato), matchs, tournois, messagerie, fil d’actualité, réels vidéo, espace santé, partenaires et gestion de club. La présente politique décrit les données traitées, les finalités et vos droits au sens du RGPD.';

export const PRIVACY_SECTIONS: LegalSectionContent[] = [
  {
    id: 'donnees',
    title: 'Données collectées',
    paragraphs: ['Nous traitons notamment les catégories suivantes :'],
    bullets: [
      'Compte : adresse e-mail, nom affiché, rôle (joueur, coach, recruteur, agent, organisateur, kinésithérapeute, partenaire, parent/tuteur), ville, photo de profil, langue.',
      'Profil sportif : poste, catégorie d’âge, niveau, statistiques, CV joueur, badges, historique d’activité (matchs, candidatures, Visibilité).',
      'Vérification : pièces d’identité, licences, diplômes ou justificatifs selon le rôle. Analyse automatisée possible pour accélérer la validation.',
      'Contenus : annonces Mercato, messages, publications fil d’actualité, réponses à la question de la semaine, photos et vidéos (réels).',
      'Événements équipe : convocations, présences, compositions, stats live, covoiturage (lieux de rendez-vous et, pendant un trajet actif, position live du conducteur réservée aux participants).',
      'Santé (pôle dédié) : informations que vous choisissez de partager avec un professionnel (rendez-vous, échanges). Pas de dossier médical hospitalier.',
      'Technique : identifiant Firebase, jetons de notification push (FCM / Expo), logs techniques, type d’appareil, version de l’app.',
      'Géolocalisation : uniquement si vous l’autorisez (points de rendez-vous covoiturage, position live du conducteur pendant un trajet en cours partagée uniquement avec les participants, suggestions locales, campagnes partenaires géo-ciblées).',
      'Paiements : identifiants de transaction et abonnements via Apple App Store ou Google Play (nous ne stockons pas vos coordonnées bancaires complètes).',
      'Site vitrine / bêta : e-mail et rôle déclaré lors de l’inscription à la liste d’attente (service d’envoi d’e-mails tiers).',
      'Mineurs : âge déclaré, paramètres de contrôle parental, contacts autorisés et lien avec le compte tuteur lorsque applicable.',
    ],
  },
  {
    id: 'finalites',
    title: 'Finalités',
    paragraphs: [],
    bullets: [
      'Création, authentification et gestion du compte.',
      'Mise en relation entre joueurs, clubs, staff, professionnels de santé et partenaires.',
      'Vérification des profils, lutte contre la fraude et modération des contenus.',
      'Fonctionnement des modules Mercato, matchs, tournois, messages, fil, réels et Visibilité.',
      'Notifications (convocations, candidatures, messages, actualités).',
      'Programme bêta : invitation, e-mails d’information et collecte de retours.',
      'Facturation des abonnements et offres Pro via les stores.',
      'Amélioration du service, support utilisateur et sécurité de la plateforme.',
    ],
  },
  {
    id: 'rgpd',
    title: 'Bases légales (RGPD)',
    paragraphs: [],
    bullets: [
      'Exécution du contrat : utilisation des fonctionnalités de l’application.',
      'Intérêt légitime : sécurité, modération, amélioration du service, prévention des abus.',
      'Consentement : notifications push, géolocalisation, documents de vérification, comptes mineurs, cookies non essentiels sur le site le cas échéant.',
      'Obligation légale : conservation de certaines preuves en cas de litige ou réquisition.',
    ],
  },
  {
    id: 'hebergement',
    title: 'Hébergement et sous-traitants',
    paragraphs: [
      'Les données sont hébergées principalement via Google Firebase (authentification, Firestore, stockage fichiers, fonctions cloud). Des traitements peuvent avoir lieu dans l’Union européenne ou, le cas échéant, hors UE avec des garanties contractuelles appropriées (clauses types, prestataires certifiés).',
      'Nous pouvons faire appel aux catégories de prestataires suivants :',
    ],
    bullets: [
      'Google / Firebase (infrastructure, auth, base de données, fichiers).',
      'Apple et Google (achats in-app, distribution de l’application).',
      'Stripe (paiements de cotisations ou prestations club le cas échéant).',
      'Prestataires d’e-mailing (inscription bêta, messages transactionnels).',
      'Prestataires d’analyse documentaire ou d’IA (vérification des justificatifs, sous contrôle humain).',
      'Netlify ou équivalent (hébergement du site vitrine).',
    ],
  },
  {
    id: 'conservation',
    title: 'Durée de conservation',
    paragraphs: [],
    bullets: [
      'Compte actif : conservation pendant toute la durée d’utilisation du service.',
      'Suppression de compte : effacement ou anonymisation sous 90 jours, sauf obligation légale ou litige en cours.',
      'Documents de vérification : durée nécessaire à la conformité, aux contrôles et à la défense de nos droits.',
      'Logs techniques : durée limitée, proportionnée aux besoins de sécurité.',
      'Liste d’attente bêta : jusqu’au lancement public ou retrait de votre demande.',
    ],
  },
  {
    id: 'droits',
    title: 'Vos droits',
    paragraphs: [
      'Vous disposez des droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité sur vos données personnelles, dans les limites prévues par la loi.',
      'Pour exercer vos droits : écrivez à proday.admin@gmail.com en précisant votre demande et l’e-mail du compte concerné. Nous répondrons dans un délai maximal d’un mois.',
      'Réclamation auprès de la CNIL : www.cnil.fr.',
    ],
  },
  {
    id: 'securite',
    title: 'Sécurité',
    paragraphs: [
      'Nous appliquons des règles d’accès strictes (Firestore Security Rules), le chiffrement en transit (HTTPS/TLS) et des mécanismes d’authentification. Aucun système n’est invulnérable : signalez toute faille suspectée à proday.admin@gmail.com.',
    ],
  },
  {
    id: 'mineurs',
    title: 'Mineurs et contrôle parental',
    paragraphs: [
      'L’application peut être utilisée par des mineurs avec l’accord et la supervision d’un responsable légal. Des espaces jeunes et un contrôle parental limitent certaines interactions (contacts, messagerie). Les parents ou tuteurs peuvent gérer ces paramètres via l’espace dédié.',
      'Si nous apprenons qu’un mineur a fourni des données sans consentement parental requis, nous pourrons suspendre le compte et supprimer les données concernées.',
    ],
  },
  {
    id: 'transferts',
    title: 'Transferts hors Union européenne',
    paragraphs: [
      'Lorsque des données sont traitées hors de l’EEE par nos sous-traitants, nous veillons à ce que des garanties appropriées soient en place (décision d’adéquation, clauses contractuelles types ou mécanisme équivalent).',
    ],
  },
  {
    id: 'modifications',
    title: 'Modifications',
    paragraphs: [
      'Nous pouvons mettre à jour cette politique. La date en tête de document sera révisée. En cas de changement substantiel, nous pourrons vous en informer dans l’application ou par e-mail. La poursuite de l’utilisation après notification vaut acceptation, sauf opposition de votre part lorsque la loi l’exige.',
    ],
  },
];

export const TERMS_INTRO =
  'Les présentes Conditions générales d’utilisation (« CGU ») régissent l’accès et l’utilisation de l’application mobile ProDay, du site vitrine associé et des services connexes. En créant un compte ou en utilisant ProDay, vous acceptez ces CGU et notre politique de confidentialité.';

export const TERMS_SECTIONS: LegalSectionContent[] = [
  {
    id: 'objet',
    title: 'Objet et périmètre',
    paragraphs: [
      'ProDay propose une plateforme numérique organisée autour de cinq pôles (Joueur, Club, Coach, Supporter, Sponsor) et de rôles intégrés (Santé, Agent, Recruteur, Organisateur), permettant notamment le recrutement, l’organisation de matchs et tournois, la messagerie, le fil d’actualité, les réels vidéo, le suivi de visibilité, le CV joueur et les espaces dédiés aux professionnels et sponsors.',
      'Certaines fonctionnalités peuvent être proposées en avant-première dans le cadre d’une bêta fermée : elles peuvent évoluer, être limitées ou retirées sans préavis.',
    ],
  },
  {
    id: 'acceptation',
    title: 'Acceptation',
    paragraphs: [
      'Vous déclarez avoir la capacité juridique de contracter (ou l’autorisation de votre représentant légal si vous êtes mineur). Si vous n’acceptez pas ces CGU, vous ne devez pas utiliser le service.',
    ],
  },
  {
    id: 'compte',
    title: 'Compte utilisateur',
    paragraphs: [],
    bullets: [
      'Vous devez fournir des informations exactes, complètes et à jour.',
      'Vous êtes seul responsable de la confidentialité de vos identifiants et de l’activité réalisée depuis votre compte.',
      'Un seul compte personnel par individu, sauf comptes professionnels clairement identifiés (club, structure, partenaire).',
      'ProDay peut suspendre, restreindre ou supprimer un compte en cas de fraude, usurpation, contenu illicite, non-respect des CGU ou risque pour la communauté.',
    ],
  },
  {
    id: 'verification',
    title: 'Rôles, vérifications et bêta',
    paragraphs: [
      'Certains rôles (coach, agent, organisateur, staff, actions sensibles côté joueur) exigent une vérification documentaire. ProDay peut approuver, refuser ou révoquer une vérification à tout moment. L’accès à certaines fonctions (messagerie complète, publication Mercato, etc.) peut être limité tant que la vérification n’est pas validée.',
      'En participant à la bêta, vous acceptez que le service puisse contenir des bugs, des interruptions et des évolutions fréquentes. Vos retours pourront être utilisés pour améliorer le produit, sans rémunération, sauf accord écrit contraire.',
    ],
  },
  {
    id: 'contenus',
    title: 'Contenus publiés par les utilisateurs',
    paragraphs: [
      'Vous restez propriétaire de vos contenus (textes, photos, vidéos, annonces). Vous accordez à ProDay une licence mondiale, non exclusive et gratuite, pour héberger, reproduire, afficher et diffuser ces contenus uniquement dans le cadre du fonctionnement et de la promotion du service (y compris extraits pour la communication ProDay, sauf opposition motivée).',
      'Il est notamment interdit de publier :',
    ],
    bullets: [
      'des contenus illégaux, diffamatoires, haineux, discriminatoires, violents ou à caractère sexuel impliquant des mineurs ;',
      'des données personnelles de tiers sans base légale ou consentement ;',
      'du spam, de la publicité non autorisée ou des contenus trompeurs ;',
      'de fausses identités, documents falsifiés ou usurpation de rôle ;',
      'des contenus portant atteinte aux droits de propriété intellectuelle de tiers.',
    ],
  },
  {
    id: 'mercato',
    title: 'Mercato, recrutement et tournois',
    paragraphs: [
      'ProDay facilite la mise en relation entre utilisateurs. Nous ne garantissons ni l’aboutissement d’un recrutement, ni la véracité des annonces, ni la tenue d’un match ou tournoi. Les engagements contractuels entre clubs, joueurs, organisateurs ou partenaires relèvent de leur seule responsabilité.',
    ],
  },
  {
    id: 'messagerie',
    title: 'Messagerie, fil d’actualité et réels',
    paragraphs: [
      'Les échanges entre utilisateurs engagent uniquement leurs auteurs. ProDay peut modérer, masquer ou supprimer des contenus signalés ou non conformes. Le fil d’actualité, les réels, les sondages et la question de la semaine doivent être utilisés dans le respect des présentes CGU et de la loi.',
    ],
  },
  {
    id: 'sante',
    title: 'Espace Santé',
    paragraphs: [
      'Les informations accessibles via le pôle Santé (kinésithérapeutes, coach mental, nutrition, etc.) sont fournies à titre informatif et de mise en relation. ProDay ne dispense pas de conseil médical et ne remplace pas une consultation avec un professionnel de santé habilité. En cas d’urgence, contactez les services d’urgence (15, 112).',
    ],
  },
  {
    id: 'covoiturage',
    title: 'Covoiturage',
    paragraphs: [
      'La fonctionnalité de covoiturage permet aux utilisateurs de se coordonner. ProDay n’est pas transporteur et n’organise pas les trajets. Chaque participant reste responsable de la conformité de son véhicule, de son assurance et du respect du code de la route. ProDay décline toute responsabilité en cas d’accident ou de litige entre participants.',
    ],
  },
  {
    id: 'paiements',
    title: 'Abonnements et paiements',
    paragraphs: [],
    bullets: [
      'Certaines offres Pro sont disponibles par abonnement via l’App Store ou Google Play. Les conditions de facturation, renouvellement et résiliation sont celles de la plateforme concernée, complétées par nos fiches produit in-app.',
      'Les cotisations club ou paiements ponctuels peuvent transiter par un prestataire tiers (ex. Stripe) selon les paramètres du club organisateur.',
      'Les offres partenaires commerciales (Territorial, National, etc.) peuvent faire l’objet de conditions commerciales distinctes validées avec ProDay.',
      'Sauf disposition légale impérative, les sommes déjà réglées ne sont pas remboursables une fois la période d’abonnement commencée.',
    ],
  },
  {
    id: 'pi',
    title: 'Propriété intellectuelle',
    paragraphs: [
      'La marque ProDay, les logos, le design, le code, les textes éditoriaux et les éléments graphiques de la plateforme sont protégés. Toute reproduction, extraction ou réutilisation non autorisée est interdite.',
    ],
  },
  {
    id: 'responsabilite',
    title: 'Responsabilité et garanties',
    paragraphs: [
      'Le service est fourni « en l’état » et « selon disponibilité ». Dans les limites autorisées par la loi applicable, ProDay ne garantit pas un fonctionnement ininterrompu ni l’absence d’erreurs.',
      'ProDay ne saurait être tenue responsable des dommages indirects, pertes de chance, pertes de données ou litiges entre utilisateurs. Notre responsabilité totale, lorsqu’elle est engagée, est limitée au montant des sommes versées par l’utilisateur à ProDay au cours des douze (12) derniers mois, sauf faute lourde ou dolosive.',
    ],
  },
  {
    id: 'resiliation',
    title: 'Résiliation',
    paragraphs: [
      'Vous pouvez supprimer votre compte depuis l’application ou en contactant proday.admin@gmail.com. ProDay peut résilier ou suspendre l’accès en cas de manquement grave, avec ou sans préavis selon la gravité et les obligations légales.',
    ],
  },
  {
    id: 'droit',
    title: 'Droit applicable et litiges',
    paragraphs: [
      'Les présentes CGU sont soumises au droit français. En cas de litige, et à défaut de résolution amiable, compétence est attribuée aux tribunaux français, sous réserve des règles impératives de protection des consommateurs (notamment possibilité de saisir le médiateur de la consommation compétent ou la juridiction du domicile du consommateur).',
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    paragraphs: ['Pour toute question relative aux CGU : proday.admin@gmail.com'],
  },
];

export function flattenSectionParagraphs(section: LegalSectionContent): string[] {
  const lines = [...section.paragraphs];
  if (section.bullets?.length) {
    lines.push(...section.bullets.map((b) => `• ${b}`));
  }
  return lines;
}
