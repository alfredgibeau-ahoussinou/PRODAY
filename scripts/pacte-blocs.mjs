/** Blocs LaTeX : champs vides UNIQUEMENT pour données personnelles */

export function champ(w = '5.5cm') {
  return `\\underline{\\hspace{${w}}}`;
}

export function identiteSignataire(person, myLabel, alfredNote) {
  return `
\\section{Identité du signataire}
\\addcontentsline{toc}{section}{Identité du signataire}

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
Qualité~: \\textbf{${myLabel}} \\hfill Parts~: \\textbf{25\\,\\%}${
    person.isAlfred ? ' \\hfill Fonction~: \\textbf{Développeur du groupe}' : ''
  }`;
}

export function tableauAssocies(currentSlot) {
  const row = (slot, label, divisionCell) => {
    const b = slot === currentSlot ? '\\textbf{' : '';
    const e = slot === currentSlot ? '}' : '';
    return `${b}${label}${e} & ${champ('3.2cm')} & ${champ('3.2cm')} & 25\\,\\% & ${divisionCell} \\\\[0.35em]`;
  };
  return `
\\small
\\begin{tabularx}{\\linewidth}{@{}l Y Y c Y@{}}
\\toprule
\\textbf{Associé} & \\textbf{Nom} & \\textbf{Prénom} & \\textbf{Parts} & \\textbf{Division / rôle} \\\\
\\midrule
${row(1, 'Associé 1', champ('3.2cm'))}
${row(2, 'Associé 2', champ('3.2cm'))}
${row(3, 'Associé 3', champ('3.2cm'))}
${row(4, 'Associé 4', '\\textbf{Alfred — Développeur du groupe}')}
\\bottomrule
\\end{tabularx}
\\normalsize`;
}

export function signaturesBloc(myLabel) {
  return `
\\noindent Fait à ${champ('4.5cm')}, le ${champ('3.5cm')}, en quatre (4) exemplaires originaux.

\\vspace{1.8em}
\\noindent\\textbf{Le signataire — ${myLabel}}

\\vspace{2.6cm}
\\noindent Signature~: ${champ('7cm')}

\\noindent Mention manuscrite obligatoire~: «~Lu et approuvé, bon pour accord~»

\\vspace{2em}
\\noindent\\rule{\\textwidth}{0.4pt}

\\vspace{1em}
\\noindent\\textbf{Contre-signatures des co-associés}

\\noindent
(Les co-associés peuvent contre-signer sur chaque exemplaire pour renforcer l'opposabilité collective.)

\\vspace{1em}
\\noindent\\textbf{Associé 1}\\\\[0.3em]
Nom~: ${champ('5.5cm')} \\hfill Prénom~: ${champ('5.5cm')}\\\\[1.8cm]
Signature~: ${champ('7cm')}

\\vspace{1em}
\\noindent\\textbf{Associé 2}\\\\[0.3em]
Nom~: ${champ('5.5cm')} \\hfill Prénom~: ${champ('5.5cm')}\\\\[1.8cm]
Signature~: ${champ('7cm')}

\\vspace{1em}
\\noindent\\textbf{Associé 3}\\\\[0.3em]
Nom~: ${champ('5.5cm')} \\hfill Prénom~: ${champ('5.5cm')}\\\\[1.8cm]
Signature~: ${champ('7cm')}

\\vspace{1em}
\\noindent\\textbf{Associé 4 (Alfred)}\\\\[0.3em]
Nom~: ${champ('5.5cm')} \\hfill Prénom~: ${champ('5.5cm')}\\\\[1.8cm]
Signature~: ${champ('7cm')}`;
}

/** Situation actuelle vs déroulement prévu du développement PRODAY */
export function articleCadreDeveloppement(person) {
  const introAlfred = person.isAlfred
    ? `Le signataire, en sa qualité de \\textbf{développeur du groupe}, expose ci-dessous la situation à la date de signature du Pacte et le déroulement convenu avec les co-associés.`
    : `Les Associés conviennent de formaliser ci-dessous la situation du développement de l'Application PRODAY à la date de signature du Pacte, ainsi que les modalités de déroulement convenues avec \\textbf{Alfred}, développeur du groupe.`;

  const orgaActuelle = person.isAlfred
    ? `À ce jour, le développement technique est assuré \\textbf{exclusivement par le signataire} (Alfred, Associé~4). Les Associés 1 à 3 n'interviennent pas dans le code source~; ils contribuent par la définition des besoins métier, les tests utilisateurs, les retours produit et les décisions collectives au Comité de pilotage.`
    : `À ce jour, le développement technique est assuré \\textbf{exclusivement par Alfred} (Associé~4, développeur du groupe). Les Associés 1 à 3 n'interviennent pas dans le code source~; ils contribuent par la définition des besoins métier, les tests utilisateurs, les retours produit et les décisions collectives au Comité de pilotage.`;

  const phases = `
\\paragraph{16.4 — Déroulement prévu (phases).}
Le développement et la mise à disposition de l'Application suivent les \\textbf{phases successives} ci-dessous, dans l'ordre indiqué~:

\\begin{encadre}
\\small
\\begin{tabularx}{\\linewidth}{@{}c Y@{}}
\\toprule
\\textbf{Phase} & \\textbf{Contenu et échéance} \\\\
\\midrule
\\textbf{1 — Finalisation MVP} &
Développement et consolidation des modules du périmètre MVP (article~18.2), recette interne, corrections bloquantes. \\textbf{Délai~: deux (2) mois} à compter de la date de départ convenue (article~18.1). Jalons~: J+15, J+30, J+45, J+60. \\\\[0.3em]
\\textbf{2 — Sortie} &
Builds de production, soumission et publication App Store / Google Play, configuration des environnements de production, documentation de déploiement. \\textbf{Incluse} dans le forfait de lancement (article~19). \\\\[0.3em]
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
${introAlfred}

\\paragraph{16.2 — Situation à la date de signature du Pacte.}
À la date de signature du présent Pacte~:
\\begin{itemize}[leftmargin=1.4cm,itemsep=0.2em]
  \\item la société \\textbf{PRODAY} est \\textbf{en cours de constitution} (non immatriculée, article~3)~;
  \\item l'\\textbf{Application PRODAY} est en \\textbf{phase de construction active}~: une base technique et fonctionnelle substantielle existe déjà, mais la version MVP n'est \\textbf{pas encore livrée} au sens de l'article~18.6 (recette et critères d'acceptation)~;
  \\item l'Application \\textbf{n'est pas encore publiée} sur l'App Store ni sur Google Play~;
  \\item le code source, la configuration Firebase et les environnements de développement sont détenus et administrés par le \\textbf{développeur du groupe}~;
  \\item aucune rémunération en numéraire n'est due au titre du forfait de lancement~: celui-ci est traité en \\textbf{apport en industrie} (article~19).
\\end{itemize}

\\paragraph{16.3 — Organisation actuelle du travail.}
${orgaActuelle}

\\noindent\\textbf{Stack technique retenue} (sauf décision unanime contraire)~: application mobile \\textbf{Expo / React Native}~; back-end et services \\textbf{Firebase} (authentification, Firestore, Storage, Cloud Functions)~; hébergement et déploiement selon la documentation technique du projet.

\\paragraph{16.3 bis — État d'avancement technique (à la signature).}
Les Associés reconnaissent que, \\textbf{à la date de signature}, les éléments suivants reflètent l'état réel du projet~:

\\begin{encadre}
\\footnotesize
\\begin{tabularx}{\\linewidth}{@{}p{2.6cm} Y@{}}
\\toprule
\\textbf{Statut} & \\textbf{Éléments concernés} \\\\
\\midrule
\\textbf{Déjà réalisé ou avancé} &
Architecture Firebase et environnement de développement~; authentification et parcours d'inscription (joueur, coach, club, parental)~; profils utilisateurs et édition~; modules recrutement / mercato, matchs amicaux et tournois (bases fonctionnelles)~; messagerie et notifications~; tableau de bord administrateur (modération, contenus)~; règles Firestore, Storage et fonctions cloud associées~; charte UI et navigation principale de l'application mobile. \\\\
\\textbf{En cours de consolidation} &
Stabilisation des parcours, tests internes, compléments fonctionnels nécessaires au périmètre MVP (article~18.2), documentation technique et procédures de recette. \\\\
\\textbf{À réaliser pour le MVP} &
Recette formelle validée par les Associés (article~18.6), corrections des bugs bloquants, \\textbf{sortie} sur les stores (article~18.3), mise en production et \\textbf{stabilisation} de trois (3) mois (articles~18.4 et~19). \\\\
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

export function articleRoleDeveloppeur(person) {
  if (person.isAlfred) {
    return `
\\section{Rôle du développeur du groupe}

\\paragraph{17.1.}
Le signataire est désigné et reconnu par l'unanimité des Associés comme le \\textbf{développeur du groupe PRODAY}. Il assume personnellement la responsabilité de la gestion, de la création, du développement, de la maintenance et de l'évolution de l'Application (définie à l'article~2).

\\paragraph{17.2.}
Sans limitation, le développeur du groupe prend en charge~: l'architecture technique~; le développement des fonctionnalités validées collectivement~; la gestion des dépôts de code et des environnements (développement, test, production)~; les mises en production et correctifs~; la documentation technique~; la sécurité applicative et la conformité RGPD sur le plan technique.

\\paragraph{17.3.}
Le développeur du groupe valide la faisabilité technique, le calendrier et les priorités de développement, sous réserve des Décisions Stratégiques (article~13). Il ne dispose pas d'un droit de veto sur les décisions commerciales, financières ou juridiques.

\\paragraph{17.4.}
Aucun prestataire externe ne peut se substituer au développeur du groupe pour la direction technique du produit sans accord unanime des Associés.`;
  }
  return `
\\section{Rôle du développeur du groupe — Alfred}

\\paragraph{17.1.}
Les Associés reconnaissent que \\textbf{Monsieur Alfred}, Associé 4, est le \\textbf{développeur du groupe PRODAY} et le seul responsable de la gestion, de la création, du développement et de la maintenance de l'Application. La situation actuelle du développement et le déroulement prévu sont détaillés à l'article~16.

\\paragraph{17.2.}
Les co-associés s'engagent à ne pas interférer de manière abusive dans les choix techniques opérationnels d'Alfred. Les besoins fonctionnels leur sont transmis via le Comité de pilotage.

\\paragraph{17.3.}
Toute refonte majeure, changement de stack technologique ou externalisation du développement requiert l'accord d'Alfred et l'unanimité des Associés.`;
}

/** Barème détaillé : dev + sortie + gestion post-lancement — remise fondateur 50 % (net 5 000 €) */
export function articleTarifDeveloppement() {
  const lignes = [
    ['Architecture technique, Firebase et environnements (dev, test, prod)', '750'],
    ['Authentification, inscription et gestion des comptes', '900'],
    ['Profils utilisateurs (joueur, coach, club, admin)', '1\\,000'],
    ['Module recrutement / mercato (annonces, candidatures)', '1\\,250'],
    ['Module matchs amicaux et tournois', '1\\,000'],
    ['Messagerie interne et notifications push', '600'],
    ['Tableau de bord administrateur et modération', '750'],
    ['Interface mobile (Expo/React Native) et charte UI', '750'],
    ['API, règles Firestore, Storage et Cloud Functions', '600'],
    ['Tests, recette interne et documentation technique', '500'],
    ['\\textbf{Sortie}~: App Store / Google Play, builds EAS, fiches store', '750'],
    ['\\textbf{Mise en production}~: configuration prod, monitoring, sauvegardes', '600'],
    ['\\textbf{Stabilisation post-sortie (3 mois)}~: correctifs et support technique limité', '1\\,050'],
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

export function articleTarifDeveloppementCoAssocies() {
  return `
\\section{Valorisation de l'apport en industrie d'Alfred — gestion future}

\\paragraph{19.1.}
Les Associés reconnaissent un barème catalogue de \\textbf{10\\,000~euros HT}, une remise fondateur de \\textbf{50\\,\\%} (\\textbf{5\\,000~euros HT}), et un montant net définitif de \\textbf{5\\,000~euros HT} (forfait de lancement), en apport en industrie. Détail et justification dans l'exemplaire d'Alfred.

\\paragraph{19.2.}
Les co-associés acceptent que ce montant tient compte des moyens limités au démarrage et \\textbf{n'inclut pas} la gestion technique quotidienne après les trois (3) mois de stabilisation, dont le tarif sera fixé \\textbf{plus tard} à l'unanimité (article~20).

${articleGestionQuotidienneFuture()}`;
}

export function articleEngagementsSpecifiques(person, myLabel) {
  if (person.isAlfred) {
    return `
\\section{Engagements spécifiques d'Alfred — livraison de l'application}

\\paragraph{18.1 — Délai et point de départ.}
Compte tenu de l'état d'avancement décrit à l'article~16.3 bis, le signataire s'engage à livrer une version exploitable de l'Application (recette article~18.6) dans un délai maximal de \\textbf{deux (2) mois} à compter du ${champ('3.5cm')} (\\textbf{date de départ du sprint de finalisation MVP}), sauf force majeure dûment justifiée et validée par les Associés. Cette date est fixée conjointement à la signature ou au plus tard dans les sept (7) jours suivants.

\\paragraph{18.2 — Périmètre fonctionnel (développement).}
Le périmètre minimal comprend notamment~:
\\begin{itemize}[leftmargin=1.4cm,itemsep=0.15em]
  \\item inscription, connexion, récupération de mot de passe, rôles utilisateurs~;
  \\item profils joueur, coach, club et administration~;
  \\item module recrutement / mercato (publication, candidature, suivi)~;
  \\item module matchs amicaux et tournois (création, inscription, résultats)~;
  \\item messagerie interne et notifications de base~;
  \\item tableau de bord administrateur (modération, statistiques essentielles)~;
  \\item documentation technique, guide de déploiement et procédure de recette.
\\end{itemize}

\\paragraph{18.3 — Sortie de l'application.}
Alfred prend en charge la \\textbf{sortie} complète~: builds de production, soumission App Store et Google Play (ou équivalent), configuration des environnements de production, et mise à disposition d'une version téléchargeable par les utilisateurs finaux.

\\paragraph{18.4 — Stabilisation après sortie (3 mois inclus — hors gestion quotidienne longue durée).}
Pendant \\textbf{trois (3) mois} suivant la mise en ligne, Alfred assure une phase de \\textbf{stabilisation}~: correction des bugs, maintenance corrective, monitoring et support technique auprès des Associés. Cette période est incluse dans le forfait de l'article~19. Elle ne vaut pas engagement de \\textbf{gestion quotidienne illimitée}, dont le tarif sera décidé ultérieurement (article~20).

\\paragraph{18.5 — Jalons.}
\\textbf{J+15}~: architecture et environnements opérationnels. \\textbf{J+30}~: version alpha interne. \\textbf{J+45}~: version bêta. \\textbf{J+60}~: version exploitable soumise à recette.

\\paragraph{18.6 — Recette.}
Le livrable est conforme si l'Application est stable, les fonctions du MVP opérationnelles sans bug bloquant, l'application publiée ou en cours de publication sur les stores, le code source accessible à tous les Associés, et la recette validée par au moins trois (3) Associés sur procès-verbal.

\\paragraph{18.7 — Reporting.}
Point d'avancement hebdomadaire (écrit + oral) au Comité de pilotage~: backlog, risques, besoins de décision. Pendant la phase post-sortie, reporting bi-mensuel suffisant sauf incident critique.

\\paragraph{18.8 — Retard.}
Tout retard supérieur à quinze (15) jours ouvrés sur la livraison initiale entraîne un plan de rattrapage sous huit (8) jours, puis la procédure de blocage (article~42) si échec.

${articleTarifDeveloppement()}`;
  }
  return `
\\section{Engagements spécifiques du signataire (${myLabel})}

\\paragraph{18.1.}
Le signataire exerce la division indiquée au tableau de l'article~6 et détaillée en Annexe~A (à compléter pour sa fiche de poste).

\\paragraph{18.2.}
Le signataire consacre au minimum vingt pour cent (20\\,\\%) de son temps professionnel à PRODAY pendant les six (6) premiers mois, puis quinze pour cent (15\\,\\%) ensuite, sauf dérogation unanime.

\\paragraph{18.3.}
Le signataire remet un reporting mensuel écrit (activités, résultats, difficultés, besoins) et participe au Comité de pilotage.

\\paragraph{18.4.}
Les KPI trimestriels applicables figurent en Annexe~B et sont validés collectivement.

${articleTarifDeveloppementCoAssocies()}`;
}
