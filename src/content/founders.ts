/** Message collectif des fondateurs — contenu éditorial ProDay */
export const FOUNDERS_LETTER = {
  title: 'Un mot des fondateurs',
  intro:
    'Nous avons créé ProDay parce que le foot amateur et semi-pro mérite les mêmes outils que le haut niveau : trouver un club, un match, un coach vérifié, un sponsor — sans perdre des semaines dans des groupes WhatsApp.',
  body: `ProDay, c'est quatre parcours complémentaires réunis autour d'une même conviction : connecter les bonnes personnes au bon moment. Chaque profil est réel, chaque annonce est traçable, et les coachs comme les agents passent par une vérification avant d'échanger en messagerie.

Rejoignez-nous, construisez votre saison, et faites progresser votre projet sportif avec une communauté qui avance avec vous.`,
  signature: 'Avec toute notre énergie,',
} as const;

export const FOUNDERS = [
  {
    id: 'alfred',
    name: 'Alfred G.',
    role: 'Produit & Tech',
    initial: 'AG',
    accent: '#000000',
  },
  {
    id: 'yoan',
    name: 'Yoan',
    role: 'Arena & Partenariats',
    initial: 'Y',
    accent: '#262626',
  },
  {
    id: 'yanis',
    name: 'Yanis D.',
    role: 'Sport & Communauté',
    initial: 'YD',
    accent: '#525252',
  },
  {
    id: 'equipe',
    name: 'L\'équipe',
    role: 'Clubs & Recrutement',
    initial: 'PD',
    accent: '#737373',
  },
] as const;

export const DISCOVER_FEATURES = [
  {
    id: 'recruit',
    title: 'Recrutement',
    description:
      'Annonces, candidatures en un tap, filtres poste / niveau / ville — le Mercato ProDay.',
    icon: 'search' as const,
    color: '#0A0A0A',
  },
  {
    id: 'cv',
    title: 'CV foot vivant',
    description:
      'Stats saison + export PDF. Votre profil progresse avec vos matchs.',
    icon: 'document' as const,
    color: '#262626',
  },
  {
    id: 'matches',
    title: 'Matchs amicaux',
    description:
      'Proposez ou acceptez un match amical — complétez votre planning de saison.',
    icon: 'handshake' as const,
    color: '#0A0A0A',
  },
  {
    id: 'verify',
    title: 'Profils vérifiés',
    description:
      'Coachs et agents validés avant messagerie complète. Confiance des deux côtés.',
    icon: 'shield' as const,
    color: '#262626',
  },
  {
    id: 'team',
    title: 'Saison & convocations',
    description:
      'Calendrier unifié, convocations, présences et stats live reliés à votre profil.',
    icon: 'calendar' as const,
    color: '#525252',
  },
  {
    id: 'arena',
    title: 'Arena & Sponsors',
    description:
      'Tournois, détections locales, palmarès et financement club.',
    icon: 'trophy' as const,
    color: '#0A0A0A',
  },
] as const;
