export type LegalDocumentId = 'privacy' | 'terms';

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export interface LegalDocument {
  id: LegalDocumentId;
  title: string;
  updatedAt: string;
  sections: LegalSection[];
}

export const LEGAL_CONTACT_EMAIL = 'contact@proday.app';

export const LEGAL_DOCUMENTS: Record<LegalDocumentId, LegalDocument> = {
  privacy: {
    id: 'privacy',
    title: 'Politique de confidentialité',
    updatedAt: '27 mai 2026',
    sections: [
      {
        title: 'Introduction',
        paragraphs: [
          'ProDay est une plateforme mobile football (recrutement, matchs, tournois, messagerie, gestion de club). Cette politique décrit les données traitées et vos droits.',
        ],
      },
      {
        title: 'Données collectées',
        paragraphs: [
          'Compte : email, nom, rôle, ville, photo.',
          'Profil sportif : poste, catégorie, stats, documents de vérification selon votre rôle.',
          'Contenus : annonces, messages, fil d’actualité, images publiées.',
          'Technique : identifiant Firebase, jeton push pour les notifications.',
          'Mineurs : données du responsable légal si contrôle parental activé.',
        ],
      },
      {
        title: 'Finalités',
        paragraphs: [
          'Gestion du compte, mise en relation, vérification des profils, notifications, sécurité et support.',
        ],
      },
      {
        title: 'Hébergement',
        paragraphs: [
          'Données hébergées via Google Firebase. Sous-traitants possibles : Google (auth, base, fichiers), Stripe (paiements), analyse documentaire pour la vérification.',
        ],
      },
      {
        title: 'Durée et droits',
        paragraphs: [
          'Conservation pendant l’utilisation du service. Suppression sous 90 jours après clôture du compte, sauf obligation légale.',
          'Droits RGPD : accès, rectification, effacement, opposition, portabilité — contact@proday.app. Réclamation CNIL : www.cnil.fr.',
        ],
      },
      {
        title: 'Sécurité et mineurs',
        paragraphs: [
          'Règles d’accès strictes, HTTPS. Signalez toute faille à contact@proday.app.',
          'Comptes mineurs : usage avec consentement parental et filtrage des contacts.',
        ],
      },
    ],
  },
  terms: {
    id: 'terms',
    title: 'Conditions générales d’utilisation',
    updatedAt: '27 mai 2026',
    sections: [
      {
        title: 'Objet',
        paragraphs: [
          'Les présentes CGU régissent l’utilisation de l’application ProDay. En vous inscrivant, vous les acceptez.',
        ],
      },
      {
        title: 'Compte',
        paragraphs: [
          'Informations exactes obligatoires. Vous êtes responsable de vos identifiants.',
          'ProDay peut suspendre un compte en cas de fraude, contenu illicite ou non-respect des CGU.',
        ],
      },
      {
        title: 'Vérifications',
        paragraphs: [
          'Certains rôles exigent une vérification documentaire. ProDay peut approuver ou refuser un dossier.',
        ],
      },
      {
        title: 'Contenus',
        paragraphs: [
          'Vous restez propriétaire de vos contenus et accordez à ProDay une licence d’hébergement et d’affichage.',
          'Interdit : contenus illégaux, données de tiers sans accord, fausses identités, spam.',
        ],
      },
      {
        title: 'Mercato et responsabilité',
        paragraphs: [
          'ProDay facilite la mise en relation sans garantir un recrutement. Engagements entre parties sous leur seule responsabilité.',
          'Service fourni « en l’état ». Droit français applicable. Contact : contact@proday.app.',
        ],
      },
    ],
  },
};

export function getLegalDocument(id: LegalDocumentId): LegalDocument {
  return LEGAL_DOCUMENTS[id];
}
