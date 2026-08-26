/**
 * Positionnement produit & preuve de valeur (marketing).
 * Pas de métriques d’audience inventées. Pas de témoignages fictifs.
 */

export const PRODUCT_POSITIONING = {
  infrastructure: {
    kicker: "POSITIONNEMENT",
    title: "Pas un outil de plus. L'infrastructure de votre football.",
    body: "Vos messages ne sont plus séparés de vos convocations. Vos joueurs ne sont plus séparés de leurs performances. Vos matchs ne sont plus séparés de vos statistiques. Clubs, staffs, joueurs et leur écosystème travaillent autour de la même donnée.",
  },
  fragmentation: {
    kicker: "CE QUE LA CENTRALISATION SUPPRIME",
    title: "Arrêtez de fragmenter votre saison.",
    body: "WhatsApp pour une info, tableur pour une autre, docs ailleurs, stats ailleurs, calendrier ailleurs, com ailleurs. ProDay regroupe les objets métier du football — pour que chaque rôle travaille sur la même vérité.",
    items: [
      { label: "WhatsApp", problem: "Infos dispersées, RSVP introuvables" },
      { label: "Tableur", problem: "Effectifs et stats hors contexte" },
      { label: "Docs", problem: "Convocations et dossiers isolés" },
      { label: "Stats / calendrier / com", problem: "Trois outils, zéro lien" },
    ],
  },
  vsTools: {
    kicker: "DIFFÉRENCIATION",
    title: "Notion organise. Discord discute. ProDay orchestre le football.",
    items: [
      {
        name: "Notion",
        role: "Organise de l'information",
        note: "Pages, bases, docs — utiles, mais pas le métier foot.",
        highlight: false,
      },
      {
        name: "Discord",
        role: "Communication communautaire",
        note: "Salons et messages — pas de convocations, matchs ni stats liés.",
        highlight: false,
      },
      {
        name: "ProDay",
        role: "Objets métier du football",
        note: "Joueurs, staffs, clubs, équipes, matchs, entraînements, convocations, stats, perfs, documents, parents, présidents, supporters, sponsors — reliés dans un même écosystème.",
        highlight: true,
      },
    ],
  },
  entryDoors: {
    kicker: "MÊME ÉCOSYSTÈME",
    title: "Des portes d'entrée. Pas des produits séparés.",
    body: "Chaque univers (Joueur, Club, Coach, Parent, Supporter, Sponsor…) est une porte vers le même graphe football. Vous entrez par votre rôle : la donnée reste partagée.",
  },
  proof: {
    kicker: "PREUVE DE VALEUR",
    title: "Ce que ProDay centralise déjà.",
    /** Capacités / objets métier vérifiables dans le produit — pas des chiffres d’audience. */
    items: [
      "Convocations & RSVP liés aux matchs",
      "Effectifs, équipes et permissions club",
      "Stats et performances rattachées aux joueurs",
      "Calendrier, invitations de match entre clubs",
      "Espace sponsors & suivis supporters sur le même réseau",
    ],
    disclaimer:
      "Pas de métriques d'audience inventées. Les chiffres affichés ailleurs sur le site décrivent le produit (tarifs, capacités), pas une base utilisateurs live.",
  },
} as const;
