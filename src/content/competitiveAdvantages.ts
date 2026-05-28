/** Piliers produit ProDay — positionnement propriétaire, sans référence externe. */
export const PRODAY_PILLARS = [
  {
    id: 'unified',
    title: 'Écosystème unique',
    subtitle: 'Une seule app',
    description:
      'Carrière, club, convocations, matchs et tournois — tout votre foot amateur au même endroit.',
    icon: 'people' as const,
  },
  {
    id: 'trust',
    title: 'Confiance ProDay',
    subtitle: 'Staff certifié',
    description:
      'Diplômes et licences validés avant messagerie complète. Transparence pour les familles et les clubs.',
    icon: 'shield' as const,
  },
  {
    id: 'cv',
    title: 'CV vivant',
    subtitle: 'Stats → PDF',
    description:
      'Chaque match nourrit votre profil. Export professionnel en un geste.',
    icon: 'document' as const,
  },
  {
    id: 'pulse',
    title: 'Pulse ProDay',
    subtitle: 'Score de visibilité',
    description:
      'Indicateur exclusif : profil, activité et confiance pour vous démarquer.',
    icon: 'star-four-points' as const,
  },
  {
    id: 'recruit',
    title: 'Mercato intelligent',
    subtitle: 'Filtres & candidatures',
    description:
      'Annonces ciblées, postuler en un tap, suivi des réponses — pour joueurs et clubs.',
    icon: 'search' as const,
  },
  {
    id: 'matches',
    title: 'Matchs & Arena',
    subtitle: 'Saison complète',
    description:
      'Matchs amicaux, tournois locaux, détections et palmarès intégrés au calendrier.',
    icon: 'trophy' as const,
  },
  {
    id: 'calendar',
    title: 'Convocations ProDay',
    subtitle: 'RSVP & relances',
    description:
      'Présent, absent, peut-être — avec relances et composition d’équipe.',
    icon: 'calendar' as const,
  },
  {
    id: 'live',
    title: 'Live Stats',
    subtitle: 'Match → profil',
    description:
      'Saisie en direct : buts, passes, cartons. Votre saison et votre CV se mettent à jour.',
    icon: 'time' as const,
  },
] as const;

/** @deprecated Utiliser PRODAY_PILLARS */
export const COMPETITIVE_PILLARS = PRODAY_PILLARS;
