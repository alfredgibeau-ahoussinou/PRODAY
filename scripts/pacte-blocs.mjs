/** Blocs LaTeX : champs vides UNIQUEMENT pour données personnelles */

export function champ(w = '5.5cm') {
  return `\\underline{\\hspace{${w}}}`;
}

const ASSOCIES = [
  { label: 'Associé 1', alfredNote: '' },
  { label: 'Associé 2', alfredNote: '' },
  { label: 'Associé 3', alfredNote: '' },
  { label: 'Associé 4 (Alfred)', alfredNote: ' \\textit{(Alfred)}', fonction: 'Développeur du groupe' },
];

function ficheIdentite({ label, alfredNote, fonction }) {
  const fonctionLine = fonction ? ` \\hfill Fonction~: \\textbf{${fonction}}` : '';
  return `
\\subsection*{${label}}

\\begin{encadre}
\\begin{tabularx}{\\linewidth}{@{}>{\\bfseries}p{3.6cm} Y@{}}
Nom & ${champ('8.5cm')} \\\\[0.3em]
Prénom & ${champ('8.5cm')}${alfredNote} \\\\[0.3em]
Date de naissance & ${champ('8.5cm')} \\\\[0.3em]
Lieu de naissance & ${champ('8.5cm')} \\\\[0.3em]
Nationalité & ${champ('8.5cm')} \\\\[0.3em]
Adresse complète & ${champ('8.5cm')} \\\\[0.3em]
Téléphone & ${champ('8.5cm')} \\\\[0.3em]
E-mail & ${champ('8.5cm')} \\\\
\\end{tabularx}
\\end{encadre}

\\vspace{0.3em}
Qualité~: \\textbf{${label}} \\hfill Parts~: \\textbf{25\\,\\%}${fonctionLine}`;
}

export function identitesSignataires() {
  return `
\\section{Identités des signataires}
\\addcontentsline{toc}{section}{Identités des signataires}

Les quatre associés fondateurs identifient ci-dessous leurs coordonnées personnelles~:

${ASSOCIES.map((a) => ficheIdentite(a)).join('\n\\vspace{0.6em}\n')}`;
}

export function tableauAssocies() {
  const row = (label, divisionCell) =>
    `${label} & ${champ('3.2cm')} & ${champ('3.2cm')} & 25\\,\\% & ${divisionCell} \\\\[0.35em]`;
  return `
\\small
\\begin{tabularx}{\\linewidth}{@{}l Y Y c Y@{}}
\\toprule
\\textbf{Associé} & \\textbf{Nom} & \\textbf{Prénom} & \\textbf{Parts} & \\textbf{Division / rôle} \\\\
\\midrule
${row('Associé 1', champ('3.2cm'))}
${row('Associé 2', champ('3.2cm'))}
${row('Associé 3', champ('3.2cm'))}
${row('Associé 4', '\\textbf{Alfred — Développeur du groupe}')}
\\bottomrule
\\end{tabularx}
\\normalsize`;
}

export function signaturesUnifiees() {
  const bloc = (label) => `
\\vspace{1.2em}
\\noindent\\textbf{${label}}\\\\[0.3em]
Nom~: ${champ('5.5cm')} \\hfill Prénom~: ${champ('5.5cm')}\\\\[1.8cm]
Signature~: ${champ('7cm')}\\\\[0.4em]
{\\footnotesize Mention manuscrite obligatoire~: «~Lu et approuvé, bon pour accord~»}`;

  return `
\\noindent Fait à ${champ('4.5cm')}, le ${champ('3.5cm')}, en un (1) exemplaire original signé par les quatre (4) Associés.

${ASSOCIES.map((a) => bloc(a.label)).join('\n')}`;
}

/** Situation actuelle vs déroulement prévu du développement PRODAY */
export function articleCadreDeveloppement() {
  const phases = `
\\paragraph{16.4 — Déroulement prévu (phases).}
Le développement et la mise à disposition de l'Application suivent les \\textbf{phases successives} ci-dessous, dans l'ordre indiqué~:

\\begin{encadre}
\\small
\\begin{tabularx}{\\linewidth}{@{}c Y@{}}
\\toprule
\\textbf{Phase} & \\textbf{Contenu et échéance} \\\\
\\midrule
\\textbf{1 — Finalisation MVP et bêta} &
Recette interne, corrections bloquantes, liste d'attente bêta, documentation (docs/BETA\\_LAUNCH.md), tests automatisés. \\textbf{Délai~: deux (2) mois} à compter de la date de départ convenue (article~18.1). Jalons~: J+15 recette, J+30 bêta interne, J+45 bêta testeurs, J+60 recette signée. \\\\[0.3em]
\\textbf{2 — Sortie stores} &
Builds EAS production, TestFlight (iOS) et piste interne ou production (Android), fiches store, CGU et confidentialité en ligne. \\textbf{Incluse} dans le forfait (article~19). \\\\[0.3em]
\\textbf{3 — Stabilisation} &
Pendant \\textbf{trois (3) mois} après la mise en ligne~: correctifs, maintenance corrective, monitoring, support technique aux Associés. \\textbf{Incluse} dans le forfait. \\\\[0.3em]
\\textbf{4 — Gestion quotidienne} &
Maintenance courante, évolutions mineures, supervision et support récurrent \\textbf{au-delà} de la phase~3. \\textbf{Non incluse} dans le forfait~: tarif et périmètre fixés \\textbf{ultérieurement} à l'unanimité (article~20). \\\\
\\bottomrule
\\end{tabularx}
\\normalsize
\\end{encadre}`;

  return `
\\section{Cadre du développement — situation actuelle et déroulement}

\\paragraph{16.1 — Objet.}
Les Associés conviennent de formaliser ci-dessous la situation du développement de l'Application PRODAY à la date de signature du Pacte, ainsi que les modalités de déroulement convenues avec \\textbf{Alfred}, développeur du groupe.

\\paragraph{16.2 — Situation à la date de signature du Pacte.}
À la date de signature du présent Pacte~:
\\begin{itemize}[leftmargin=1.4cm,itemsep=0.2em]
  \\item la société \\textbf{PRODAY} est \\textbf{en cours de constitution} (non immatriculée, article~3)~;
  \\item l'\\textbf{Application PRODAY} (mobile) est en \\textbf{phase avancée}~: environ cent (100) écrans, socle technique V3, modules principaux opérationnels en environnement de pré-production, mais la recette formelle (article~18.6) n'est \\textbf{pas encore signée}~;
  \\item le \\textbf{site vitrine} (Next.js) est \\textbf{en ligne} (hébergement Netlify), avec pages produit, inscription bêta, documents légaux et supports de communication~;
  \\item l'Application \\textbf{n'est pas encore publiée} sur l'App Store ni sur Google Play (builds EAS / TestFlight en préparation)~;
  \\item le code source, la configuration Firebase et les environnements de développement sont détenus et administrés par le \\textbf{développeur du groupe}~;
  \\item aucune rémunération en numéraire n'est due au titre du forfait de lancement~: celui-ci est traité en \\textbf{apport en industrie} (article~19).
\\end{itemize}

\\paragraph{16.3 — Organisation actuelle du travail.}
À ce jour, le développement technique est assuré \\textbf{exclusivement par Alfred} (Associé~4, développeur du groupe). Les Associés 1 à 3 n'interviennent pas dans le code source~; ils contribuent par la définition des besoins métier, les tests utilisateurs, les retours produit et les décisions collectives au Comité de pilotage.

\\noindent\\textbf{Stack technique retenue} (sauf décision unanime contraire)~: application mobile \\textbf{Expo / React Native}~; site vitrine \\textbf{Next.js} (déploiement Netlify)~; back-end et services \\textbf{Firebase} (authentification, Firestore, Storage, Cloud Functions, notifications)~; builds mobiles \\textbf{EAS}~; dépôt de code \\textbf{GitHub} (monorepo PRODAY).

\\paragraph{16.3 bis — État d'avancement technique (à la signature).}
Les Associés reconnaissent que, \\textbf{à la date de signature}, les éléments suivants reflètent l'état réel du projet~:

\\begin{encadre}
\\footnotesize
\\begin{tabularx}{\\linewidth}{@{}p{2.6cm} Y@{}}
\\toprule
\\textbf{Statut} & \\textbf{Éléments concernés} \\\\
\\midrule
\\textbf{Déjà réalisé ou avancé} &
Architecture Firebase et monorepo (app + site + functions)~; authentification et inscription multi-rôles (joueur, coach, club, staff, parental, partenaire)~; quatre pôles produit (Joueur Man/Woman, Pro, Santé, Partenaires) et navigation dédiée~; Mercato, matchs amicaux, tournois, messagerie, notifications~; réels, fil d'actualité, Pulse, CV joueur, question de la semaine~; console administrateur (modération, utilisateurs, analytics, waitlist bêta)~; site vitrine (20+ pages, bêta, CGU/confidentialité en PDF)~; règles Firestore, Storage, Cloud Functions~; plus de trois cent (300) tests automatisés et contrôle qualité (npm run beta:check). \\\\
\\textbf{En cours de consolidation} &
Recette MVP avec les Associés 1 à 3, bêta fermée (TestFlight / APK), stabilisation des parcours, configuration définitive des stores (EAS, fiches App Store Connect / Play Console). \\\\
\\textbf{À réaliser pour clôturer le forfait (art.~19)} &
Procès-verbal de recette signé (art.~18.6), publication effective ou en cours sur App Store et Google Play, stabilisation de trois (3) mois post-sortie. \\\\
\\bottomrule
\\end{tabularx}
\\normalsize
\\end{encadre}

\\noindent Cet état d'avancement est \\textbf{constaté de bonne foi} à la signature. Il ne dispense pas Alfred des engagements de livraison des articles~18 et~19. Toute évolution substantielle de l'état d'avancement fera l'objet d'une mention au prochain point du Comité de pilotage.

${phases}

\\paragraph{16.5 — Modalités de collaboration (dès la signature).}
\\begin{enumerate}[leftmargin=1.4cm,itemsep=0.2em]
  \\item \\textbf{Comité de pilotage}~: réunion au moins \\textbf{mensuelle} (hebdomadaire pendant la phase MVP), pour prioriser le backlog, trancher les besoins fonctionnels et valider les arbitrages hors Décisions Stratégiques~;
  \\item \\textbf{Reporting}~: point d'avancement \\textbf{hebdomadaire} écrit et oral d'Alfred (backlog, risques, blocages, besoins de décision), conformément à l'article~18.7~;
  \\item \\textbf{Demandes d'évolution}~: formulées par écrit (e-mail ou outil partagé) par tout Associé~; intégrées au backlog selon faisabilité technique et priorité validée en Comité~;
  \\item \\textbf{Recette}~: tests par les Associés 1 à 3 sur versions de pré-production~; procès-verbal de recette signé avant acceptation définitive du MVP~;
  \\item \\textbf{Accès}~: à l'issue de la recette, accès du code source et des environnements documentés pour tous les Associés (Annexe~E), sans transfert automatique de la responsabilité technique, qui demeure celle d'Alfred jusqu'à décision contraire unanime.
\\end{enumerate}

\\paragraph{16.6 — Ce qui ne change pas sans accord unanime.}
Sont inchangés par le présent article~: la répartition du capital (25\\,\\% chacun), le forfait de lancement de \\textbf{5\\,000~euros HT net} en apport en industrie, le délai de deux (2) mois pour la livraison MVP, et le principe selon lequel la gestion quotidienne post-stabilisation fera l'objet d'une décision et d'un tarif \\textbf{ultérieurs} (article~20).`;
}

export function articleRoleDeveloppeur() {
  return `
\\section{Rôle du développeur du groupe — Alfred}

\\paragraph{17.1.}
Les Associés reconnaissent que \\textbf{Monsieur Alfred}, Associé 4, est le \\textbf{développeur du groupe PRODAY} et le seul responsable de la gestion, de la création, du développement, de la maintenance et de l'évolution de l'Application (définie à l'article~2). La situation actuelle du développement et le déroulement prévu sont détaillés à l'article~16.

\\paragraph{17.2.}
Sans limitation, le développeur du groupe prend en charge~: l'architecture technique~; le développement des fonctionnalités validées collectivement~; la gestion des dépôts de code et des environnements (développement, test, production)~; les mises en production et correctifs~; la documentation technique~; la sécurité applicative et la conformité RGPD sur le plan technique.

\\paragraph{17.3.}
Le développeur du groupe valide la faisabilité technique, le calendrier et les priorités de développement, sous réserve des Décisions Stratégiques (article~13). Il ne dispose pas d'un droit de veto sur les décisions commerciales, financières ou juridiques.

\\paragraph{17.4.}
Aucun prestataire externe ne peut se substituer au développeur du groupe pour la direction technique du produit sans accord unanime des Associés.

\\paragraph{17.5.}
Les Associés 1 à 3 s'engagent à ne pas interférer de manière abusive dans les choix techniques opérationnels d'Alfred. Les besoins fonctionnels leur sont transmis via le Comité de pilotage.

\\paragraph{17.6.}
Toute refonte majeure, changement de stack technologique ou externalisation du développement requiert l'accord d'Alfred et l'unanimité des Associés.`;
}

/** Barème détaillé : dev + sortie + gestion post-lancement — remise fondateur 50 % (net 5 000 €) */
export function articleTarifDeveloppement() {
  const lignes = [
    ['Architecture technique, monorepo, Firebase et environnements', '700'],
    ['Authentification, inscription multi-rôles et contrôle parental', '850'],
    ['Quatre pôles produit et profils (Joueur, Pro, Santé, Partenaires)', '1\\,000'],
    ['Module Mercato (annonces, candidatures, scouting)', '1\\,000'],
    ['Matchs amicaux, tournois et stats live', '900'],
    ['Messagerie, notifications et événements équipe', '500'],
    ['Réels, fil, Pulse, CV joueur et question de la semaine', '800'],
    ['Console admin (modération, analytics, waitlist bêta)', '750'],
    ['Interface mobile V3, i18n et charte UI', '650'],
    ['Site vitrine Next.js (pages produit, bêta, légal)', '600'],
    ['Règles Firestore, Storage, Functions et tests auto.', '650'],
    ['\\textbf{Sortie stores}~: EAS, TestFlight, Play, fiches store', '750'],
    ['\\textbf{Stabilisation post-sortie (3 mois)}~: correctifs et support', '850'],
  ];
  const rows = lignes
    .map(([lib, prix], i) => `${i + 1} & ${lib} & ${prix}~€ \\\\[0.2em]`)
    .join('\n');
  return `
\\section{Valorisation du développement, de la sortie et de la stabilisation}

\\paragraph{19.1 — Pourquoi ce barème existe.}
Les Associés conviennent que la valorisation ci-dessous repose sur des références de marché objectives~:
\\begin{itemize}[leftmargin=1.4cm,itemsep=0.2em]
  \\item un développeur full-stack mobile expérimenté facture en moyenne \\textbf{500 à 700~euros HT par jour} en prestation externe~;
  \\item un MVP équivalent (application mobile + back-end + admin) commandé à une agence ou un studio est généralement chiffré entre \\textbf{40\\,000 et 80\\,000~euros HT}~;
  \\item le barème catalogue retenu (\\textbf{10\\,000~euros HT}) est volontairement \\textbf{très en deçà du marché}, compte tenu des moyens financiers limités des fondateurs au stade de création de PRODAY~;
  \\item il intègre le développement, la sortie en stores et trois (3) mois de \\textbf{stabilisation post-lancement} (et non la gestion quotidienne illimitée, voir article~20)~;
  \\item la \\textbf{remise fondateur de 50\\,\\%} (soit \\textbf{5\\,000~euros HT}) récompense le statut d'associé fondateur d'Alfred, son apport en industrie et sa prise de risque au tout début du projet, tout en reflétant une valorisation plus juste du périmètre livré~;
  \\item le \\textbf{montant net de 5\\,000~euros HT} équilibre l'accessibilité financière des Associés au démarrage et la reconnaissance du travail technique fourni par Alfred.
\\end{itemize}

\\paragraph{Détail des prestations (barème catalogue).}
\\begin{encadre}
\\footnotesize
\\begin{tabularx}{\\linewidth}{@{}c Y r@{}}
\\toprule
\\textbf{\\#} & \\textbf{Prestation} & \\textbf{HT} \\\\
\\midrule
${rows.replace(/\\\\\[0.2em\]/g, '\\\\')}
\\midrule
 & \\textbf{Total catalogue} & \\textbf{10\\,000~€} \\\\
\\bottomrule
\\end{tabularx}
\\normalsize
\\end{encadre}

\\paragraph{Remise fondateur (50\\,\\%).}
\\begin{encadre}
\\begin{tabularx}{\\linewidth}{@{}Y r@{}}
\\toprule
\\textbf{Libellé} & \\textbf{Montant HT} \\\\
\\midrule
Total catalogue & 10\\,000~€ \\\\
Remise fondateur (50\\,\\%) & -5\\,000~€ \\\\
\\midrule
\\textbf{Montant net définitif} & \\textbf{5\\,000~€} \\\\
TVA indicative (20\\,\\%) & 1\\,000~€ \\\\
\\textbf{Total TTC indicatif} & \\textbf{6\\,000~€} \\\\
\\bottomrule
\\end{tabularx}
\\end{encadre}

\\paragraph{Montant net définitif (forfait de lancement).}
Montant net fixé de manière \\textbf{ferme, définitive et irrévocable} à \\textbf{5\\,000~euros HT}, soit \\textbf{la moitié du barème catalogue de dix mille (10\\,000) euros HT}. Non révisable à la hausse pour le périmètre des paragraphes~18.2 à 18.4 du présent article.

\\paragraph{19.5 — Ce que couvre le forfait (et ce qu'il ne couvre pas).}
\\textbf{Inclus dans le forfait de 5\\,000~euros HT~:}
\\begin{enumerate}[leftmargin=1.4cm,itemsep=0.2em]
  \\item \\textbf{Développement} du MVP~;
  \\item \\textbf{Sortie} de l'application (stores et production)~;
  \\item \\textbf{Stabilisation} pendant trois (3) mois après la mise en ligne (correctifs, support technique aux Associés, mises à jour mineures de sécurité).
\\end{enumerate}
\\textbf{Non inclus}~: la \\textbf{gestion technique quotidienne} au-delà de cette période de trois (3) mois (article~20).

\\paragraph{19.6 — Apport en industrie.}
Le montant net est imputé en apport en industrie d'Alfred (article~7, Annexe~C). Aucun paiement en numéraire n'est exigible au lancement pour ce forfait.

\\paragraph{19.7 — Évolutions majeures.}
Toute nouvelle fonctionnalité majeure ou refonte hors MVP fera l'objet d'un avenant distinct, approuvé à l'unanimité.

${articleGestionQuotidienneFuture()}
`;
}

export function articleGestionQuotidienneFuture() {
  return `
\\section{Gestion technique quotidienne — tarif à définir ultérieurement}

\\paragraph{20.1 — Principe.}
Le forfait de l'article~19 couvre le lancement et trois (3) mois de stabilisation. \\textbf{La gestion technique quotidienne continue} de l'Application (maintenance courante, supervision, petites évolutions, support technique récurrent, administration des accès et des environnements) \\textbf{n'est pas incluse} dans ce forfait.

\\paragraph{20.2 — Décision future des Associés.}
À l'issue de la période de trois (3) mois post-sortie (ou avant, si les Associés le souhaitent), les Associés fixeront \\textbf{collectivement}, par décision unanime en Assemblée~:
\\begin{itemize}[leftmargin=1.4cm,itemsep=0.2em]
  \\item si une gestion technique quotidienne par Alfred est maintenue~;
  \\item le \\textbf{tarif applicable} (forfait mensuel, tarif journalier, répartition entre associés, ou autre modalité)~;
  \\item le calendrier de paiement compte tenu de la \\textbf{trésorerie réelle} de la Société.
\\end{itemize}

\\paragraph{20.3 — Délai de décision.}
Cette décision interviendra au plus tard trente (30) jours avant la fin de la période de stabilisation incluse, afin d'assurer la continuité du service sans ambiguïté.

\\paragraph{20.4 — Absence d'accord.}
À défaut d'accord unanime sur le tarif de gestion quotidienne, les Associés entament une phase de négociation de bonne foi sous quinze (15) jours, puis la procédure de blocage (article~42) si nécessaire. En attendant, Alfred n'est tenu à aucune obligation de gestion quotidienne non expressément acceptée par écrit.

\\paragraph{20.5 — Transparence.}
Tout tarif retenu devra être proportionné aux ressources financières disponibles de PRODAY au moment de la décision et consigné dans un avenant au Pacte ou un contrat de prestation signé par tous les Associés.`;
}

export function articleEngagementsAlfred() {
  return `
\\section{Engagements spécifiques d'Alfred — livraison de l'application}

\\paragraph{18.1 — Délai et point de départ.}
Compte tenu de l'état d'avancement décrit à l'article~16.3 bis, Alfred s'engage à \\textbf{finaliser la recette MVP}, assurer la \\textbf{sortie sur les stores} et la \\textbf{stabilisation initiale} dans un délai maximal de \\textbf{deux (2) mois} à compter du ${champ('3.5cm')} (\\textbf{date de départ du sprint de finalisation — recette, bêta et stores}), sauf force majeure dûment justifiée et validée par les Associés. Cette date est fixée conjointement à la signature ou au plus tard dans les sept (7) jours suivants.

\\paragraph{18.2 — Périmètre fonctionnel (développement).}
Le périmètre minimal comprend notamment~:
\\begin{itemize}[leftmargin=1.4cm,itemsep=0.15em]
  \\item inscription, connexion, récupération de mot de passe, rôles et espaces (quatre pôles)~;
  \\item profils joueur, staff, club, santé, partenaire et administration~;
  \\item module Mercato (publication, candidature, suivi, scouting)~;
  \\item matchs amicaux, tournois, convocations, covoiturage et résultats~;
  \\item messagerie, notifications, fil d'actualité, réels et Pulse~;
  \\item espace santé (annuaire, rendez-vous), contrôle parental et espace jeunes~;
  \\item espace partenaires / sponsors et site vitrine (présentation, bêta, légal)~;
  \\item console administrateur (modération, utilisateurs, contenus, waitlist)~;
  \\item documentation technique, guide bêta (docs/BETA\\_LAUNCH.md) et procédure de recette.
\\end{itemize}

\\paragraph{18.3 — Sortie de l'application.}
Alfred prend en charge la \\textbf{sortie} complète~: builds EAS de production, distribution TestFlight (iOS) et Google Play (piste interne puis production), fiches store (textes légaux, captures), et mise à disposition d'une version téléchargeable par les utilisateurs finaux.

\\paragraph{18.4 — Stabilisation après sortie (3 mois inclus — hors gestion quotidienne longue durée).}
Pendant \\textbf{trois (3) mois} suivant la mise en ligne sur les stores, Alfred assure une phase de \\textbf{stabilisation}~: correction des bugs, maintenance corrective, monitoring et support technique auprès des Associés et des bêta-testeurs. Cette période est incluse dans le forfait de l'article~19. Elle ne vaut pas engagement de \\textbf{gestion quotidienne illimitée}, dont le tarif sera décidé ultérieurement (article~20).

\\paragraph{18.5 — Jalons.}
\\textbf{J+15}~: plan de recette et version bêta interne. \\textbf{J+30}~: bêta fermée ouverte aux testeurs invités. \\textbf{J+45}~: soumission stores (ou publication en cours). \\textbf{J+60}~: recette signée et application publiée ou en cours de publication effective.

\\paragraph{18.6 — Recette.}
Le livrable est conforme si l'Application est stable, les fonctions du périmètre (article~18.2) opérationnelles sans bug bloquant, l'application publiée ou en cours de publication validée sur les stores, le site vitrine accessible avec pages légales, le code source et les accès documentés pour tous les Associés (Annexe~E), et la recette validée par au moins trois (3) Associés sur procès-verbal.

\\paragraph{18.7 — Reporting.}
Point d'avancement hebdomadaire (écrit + oral) au Comité de pilotage~: backlog, risques, besoins de décision. Pendant la phase post-sortie, reporting bi-mensuel suffisant sauf incident critique.

\\paragraph{18.8 — Retard.}
Tout retard supérieur à quinze (15) jours ouvrés sur la livraison initiale entraîne un plan de rattrapage sous huit (8) jours, puis la procédure de blocage (article~42) si échec.`;
}

export function articleEngagementsCoAssocies() {
  return `
\\section{Engagements spécifiques des Associés 1, 2 et 3}

\\paragraph{18.9 — Division et missions.}
Chaque Associé 1, 2 ou 3 exerce la division indiquée au tableau de l'article~6 et détaillée en Annexe~A (à compléter pour sa fiche de poste).

\\paragraph{18.10 — Temps consacré.}
Chaque Associé 1, 2 ou 3 consacre au minimum vingt pour cent (20\\,\\%) de son temps professionnel à PRODAY pendant les six (6) premiers mois, puis quinze pour cent (15\\,\\%) ensuite, sauf dérogation unanime.

\\paragraph{18.11 — Reporting et pilotage.}
Chaque Associé 1, 2 ou 3 remet un reporting mensuel écrit (activités, résultats, difficultés, besoins) et participe au Comité de pilotage.

\\paragraph{18.12 — Indicateurs.}
Les KPI trimestriels applicables figurent en Annexe~B et sont validés collectivement.`;
}

export function articleEngagementsSpecifiques() {
  return `${articleEngagementsAlfred()}

${articleEngagementsCoAssocies()}

${articleTarifDeveloppement()}`;
}
