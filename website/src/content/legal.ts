export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDocument = {
  title: string;
  updatedAt: string;
  contact: string;
  intro?: string;
  sections: LegalSection[];
};

export const PRIVACY_POLICY: LegalDocument = {
  title: "Politique de confidentialité",
  updatedAt: "27 mai 2026",
  contact: "contact@proday.app",
  intro:
    "ProDay (« nous », « l'application ») est une plateforme mobile dédiée au football amateur et semi-professionnel (recrutement, matchs, tournois, messagerie, gestion de club). La présente politique explique quelles données nous collectons, pourquoi, et vos droits.",
  sections: [
    {
      id: "donnees",
      title: "Données collectées",
      paragraphs: [],
      bullets: [
        "Compte : email, nom affiché, rôle (joueur, coach, agent, organisateur, kinésithérapeute, partenaire), ville, photo de profil.",
        "Profil sportif : poste, catégorie, niveau, statistiques, documents de vérification (identité, licence, diplômes selon le rôle).",
        "Contenu utilisateur : annonces mercato, messages, publications sur le fil d'actualité, photos publiées.",
        "Données techniques : identifiant Firebase, jeton de notification push (FCM / Expo Push), logs d'usage anonymisés côté hébergeur.",
        "Mineurs : avec consentement du responsable légal lorsque requis (contrôle parental).",
      ],
    },
    {
      id: "finalites",
      title: "Finalités",
      paragraphs: [],
      bullets: [
        "Création et gestion de votre compte.",
        "Mise en relation entre joueurs, clubs, staff et partenaires.",
        "Vérification de profils et lutte contre la fraude.",
        "Notifications (convocations, candidatures, messages, fil d'actualité).",
        "Amélioration du service et support utilisateur.",
      ],
    },
    {
      id: "rgpd",
      title: "Base légale (RGPD)",
      paragraphs: [],
      bullets: [
        "Exécution du contrat (utilisation de l'app).",
        "Intérêt légitime (sécurité, modération).",
        "Consentement (notifications, documents, mineurs).",
      ],
    },
    {
      id: "hebergement",
      title: "Hébergement et sous-traitants",
      paragraphs: [
        "Les données sont hébergées via Google Firebase (UE / régions configurées dans la console Firebase). Nous pouvons faire appel à :",
      ],
      bullets: [
        "Google (authentification, base de données, stockage fichiers).",
        "Stripe (paiements cotisations, le cas échéant).",
        "Prestataires d'analyse documentaire (vérification automatisée des justificatifs).",
      ],
    },
    {
      id: "conservation",
      title: "Durée de conservation",
      paragraphs: [],
      bullets: [
        "Compte actif : conservation pendant l'utilisation du service.",
        "Suppression de compte : effacement ou anonymisation sous 90 jours, sauf obligation légale.",
        "Documents de vérification : conservés le temps nécessaire à la conformité et aux litiges.",
      ],
    },
    {
      id: "droits",
      title: "Vos droits",
      paragraphs: [
        "Vous pouvez demander l'accès, la rectification, l'effacement, la limitation ou l'opposition au traitement, et la portabilité de vos données, en écrivant à contact@proday.app.",
        "Réclamation possible auprès de la CNIL (www.cnil.fr).",
      ],
    },
    {
      id: "securite",
      title: "Sécurité",
      paragraphs: [
        "Nous appliquons des règles d'accès Firestore, le chiffrement en transit (HTTPS), et des contrôles d'authentification. Aucun système n'est totalement invulnérable : signalez toute faille à contact@proday.app.",
      ],
    },
    {
      id: "mineurs",
      title: "Mineurs",
      paragraphs: [
        "L'application peut être utilisée par des mineurs avec supervision parentale. Les parents peuvent gérer les contacts autorisés via les paramètres dédiés.",
      ],
    },
    {
      id: "modifications",
      title: "Modifications",
      paragraphs: [
        "Nous pouvons mettre à jour cette politique. La date en tête de document sera révisée. L'utilisation continue vaut acceptation des changements substantiels notifiés dans l'app.",
      ],
    },
  ],
};

export const TERMS_OF_USE: LegalDocument = {
  title: "Conditions générales d'utilisation",
  updatedAt: "27 mai 2026",
  contact: "contact@proday.app",
  intro:
    "Les présentes CGU régissent l'accès et l'utilisation de l'application mobile ProDay, plateforme de mise en relation dans l'écosystème football amateur et semi-professionnel.",
  sections: [
    {
      id: "acceptation",
      title: "Acceptation",
      paragraphs: [
        "En créant un compte ou en utilisant ProDay, vous acceptez ces CGU et notre politique de confidentialité. Si vous n'acceptez pas, n'utilisez pas le service.",
      ],
    },
    {
      id: "compte",
      title: "Compte utilisateur",
      paragraphs: [],
      bullets: [
        "Vous devez fournir des informations exactes et les maintenir à jour.",
        "Vous êtes responsable de la confidentialité de vos identifiants.",
        "Un seul compte par personne physique, sauf comptes professionnels clairement identifiés (club, structure).",
        "ProDay peut suspendre ou supprimer un compte en cas de fraude, contenu illicite ou non-respect des CGU.",
      ],
    },
    {
      id: "verification",
      title: "Rôles et vérifications",
      paragraphs: [
        "Certains rôles (coach, agent, organisateur, joueur pour actions sensibles) exigent une vérification documentaire. ProDay peut approuver ou refuser un dossier. La messagerie complète peut être limitée tant que la vérification n'est pas validée.",
      ],
    },
    {
      id: "contenus",
      title: "Contenus publiés",
      paragraphs: [
        "Vous restez propriétaire de vos contenus (textes, photos, annonces). Vous accordez à ProDay une licence non exclusive pour héberger, afficher et diffuser ces contenus dans le cadre du service.",
        "Il est interdit de publier :",
      ],
      bullets: [
        "contenus illégaux, diffamatoires, discriminatoires ou violents ;",
        "données personnelles de tiers sans consentement ;",
        "spam ou publicité non autorisée ;",
        "fausses identités ou documents falsifiés.",
      ],
    },
    {
      id: "mercato",
      title: "Mercato et recrutement",
      paragraphs: [
        "ProDay facilite la mise en relation ; nous ne garantissons pas l'aboutissement d'un recrutement ni la véracité des annonces. Les engagements entre clubs et joueurs relèvent de leur seule responsabilité.",
      ],
    },
    {
      id: "messagerie",
      title: "Messagerie et fil d'actualité",
      paragraphs: [
        "Les échanges entre utilisateurs engagent uniquement leurs auteurs. ProDay peut modérer ou supprimer des contenus signalés. Le fil d'actualité et les sondages agents sont réservés aux usages prévus par l'application.",
      ],
    },
    {
      id: "paiements",
      title: "Paiements",
      paragraphs: [
        "Certaines cotisations club peuvent être réglées via un prestataire de paiement tiers (Stripe). Les conditions financières sont définies par le club organisateur.",
      ],
    },
    {
      id: "pi",
      title: "Propriété intellectuelle",
      paragraphs: [
        "La marque ProDay, le design, le code et les contenus éditoriaux de la plateforme sont protégés. Toute reproduction non autorisée est interdite.",
      ],
    },
    {
      id: "responsabilite",
      title: "Responsabilité",
      paragraphs: [
        "ProDay est fourni « en l'état ». Dans les limites autorisées par la loi, nous déclinons toute responsabilité pour les dommages indirects, pertes de données ou litiges entre utilisateurs.",
      ],
    },
    {
      id: "resiliation",
      title: "Résiliation",
      paragraphs: [
        "Vous pouvez supprimer votre compte depuis l'application ou en contactant le support. ProDay peut résilier l'accès en cas de manquement grave, avec ou sans préavis selon la gravité.",
      ],
    },
    {
      id: "droit",
      title: "Droit applicable",
      paragraphs: [
        "Les présentes CGU sont soumises au droit français. En cas de litige, les tribunaux français seront compétents, sous réserve des règles impératives de protection des consommateurs.",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      paragraphs: ["Pour toute question : contact@proday.app"],
    },
  ],
};
