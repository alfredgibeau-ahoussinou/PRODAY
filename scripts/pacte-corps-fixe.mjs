import {
  tableauAssocies,
  articleCadreDeveloppement,
  articleRoleDeveloppeur,
  articleEngagementsSpecifiques,
} from './pacte-blocs.mjs';

/** Corps du pacte : clauses rédigées, structurées par titres numérotés. */
export function corpsPacte(person, myLabel) {
  return `
\\part{DISPOSITIONS GÉNÉRALES}

\\section{Définitions et interprétation}

\\paragraph{Définitions.}
Aux fins du Pacte, les termes suivants ont la signification indiquée~:
\\begin{itemize}[leftmargin=1.4cm,itemsep=0.2em]
  \\item \\textbf{Associés}~: les quatre fondateurs signataires, détenteurs chacun de 25\\,\\% du capital de la Société.
  \\item \\textbf{Société}~: la société PRODAY, en cours de constitution (article~3).
  \\item \\textbf{Pacte}~: le présent pacte d'associés et l'ensemble de ses annexes signées.
  \\item \\textbf{Titres}~: parts sociales ou actions représentant le capital, selon la forme juridique retenue.
  \\item \\textbf{Application}~: la plateforme numérique PRODAY (applications mobiles, interface web, API, back-office, services cloud associés).
  \\item \\textbf{Développeur du groupe}~: Alfred, Associé 4, responsable unique de la direction technique et de la création de l'Application.
  \\item \\textbf{Informations Confidentielles}~: toute information non publique relative à PRODAY, à ses Associés, utilisateurs, partenaires, technologies, finances ou stratégie.
  \\item \\textbf{Décision Stratégique}~: toute décision énumérée à l'article~13.
  \\item \\textbf{Comité de pilotage}~: instance de suivi opérationnel réunissant les Associés (ou leurs représentants) au moins une fois par mois.
  \\item \\textbf{Jour ouvré}~: tout jour autre que samedi, dimanche et jour férié en France métropolitaine.
\\end{itemize}

\\paragraph{Interprétation.}
Les titres et sommaires sont insérés pour faciliter la lecture. En cas de contradiction entre le Pacte et les statuts futurs, les dispositions les plus protectrices de la stabilité de la Société prévalent, sous réserve des règles d'ordre public.

\\section{Objet et portée du Pacte}

\\paragraph{Objet.}
Le Pacte a pour objet d'organiser de manière détaillée~: la gouvernance collective, la répartition des rôles, les apports (y compris l'apport en industrie d'Alfred), le vesting, les règles de cession de titres, la confidentialité, la propriété intellectuelle, la rémunération, les mécanismes de sortie et la résolution des conflits, dans l'intérêt durable de PRODAY.

\\paragraph{Opposabilité.}
Le Pacte lie chaque Associé, ses héritiers et ayants cause, ainsi que tout futur acquéreur de Titres sous réserve d'agrément unanime.

\\section{Société en cours de constitution}

\\paragraph{Statut actuel.}
La société \\textbf{PRODAY} est \\textbf{en cours de constitution}. À la date de signature du Pacte, elle n'est \\textbf{pas immatriculée} au Registre du commerce et des sociétés (RCS) et ne dispose pas de numéro SIRET.

\\paragraph{Effets entre Associés.}
Les Associés agissent en qualité de futurs associés fondateurs. Le Pacte produit ses effets inter associés dès signature et, à l'égard de la Société, dès son immatriculation.

\\paragraph{Avenant d'immatriculation.}
Dès réception du Kbis, les Associés signent un \\textbf{avenant d'immatriculation} (Annexe~I) reprenant~: la forme juridique, le capital social, le siège social, le numéro RCS, le numéro SIRET, la date et le greffe d'immatriculation.

\\paragraph{Projet.}
\\begin{itemize}[leftmargin=1.4cm,itemsep=0.15em]
  \\item \\textbf{Dénomination}~: PRODAY.
  \\item \\textbf{Activité}~: conception, développement, édition et exploitation d'une plateforme numérique dédiée au sport, au recrutement, aux événements, au sponsoring et aux services associés.
  \\item \\textbf{Durée}~: quatre-vingt-dix-neuf (99) ans à compter de l'immatriculation.
  \\item \\textbf{Forme et capital}~: fixés conjointement avant dépôt (SAS recommandée), répartition égale entre les quatre Associés.
\\end{itemize}

\\section{Durée et modification du Pacte}

Durée initiale de \\textbf{dix (10) ans}, renouvelable tacitement par périodes de cinq (5) ans. Toute modification requiert l'\\textbf{unanimité}. Chaque Associé reconnaît avoir reçu toute information utile pour consentir en connaissance de cause.

\\part{CAPITAL, APPORTS ET TITRES}

\\section{Répartition initiale du capital}

${tableauAssocies(person.slot)}

Chaque Associé détient \\textbf{25\\,\\%} du capital et des droits de vote, sauf modification unanime. Aucun droit de veto permanent n'est reconnu hors cas expressément prévus.

\\section{Apports et comptes courants d'associés}

\\paragraph{Apports.}
Les apports de chaque Associé (numéraire, nature, industrie) sont détaillés en \\textbf{Annexe C}. L'apport en industrie d'Alfred comprend le développement, la sortie stores et trois (3) mois de stabilisation, valorisé à \\textbf{5\\,000~euros HT net} (article~19). La gestion quotidienne postérieure sera tarifée ultérieurement (article~20).

\\paragraph{Comptes courants.}
Toute avance d'un Associé est inscrite en compte courant, rémunérée à \\textbf{3\\,\\%} l'an, remboursable selon la trésorerie et décision d'Assemblée.

\\section{Vesting — acquisition progressive des droits}

\\begin{itemize}[leftmargin=1.4cm,itemsep=0.2em]
  \\item Durée~: \\textbf{quatre (4) ans} à compter de la signature du Pacte.
  \\item Cliff~: \\textbf{douze (12) mois} (aucun droit acquis avant cette date, sauf faute de la Société).
  \\item Départ anticipé~: rachat des Titres non acquis selon l'article~29.
  \\item Force majeure personnelle~: suspension possible sur validation unanime.
\\end{itemize}

\\section{Anti-dilution et émissions}

Toute émission dilutive requiert l'\\textbf{unanimité}. Droit préférentiel de souscription proportionnel, exerçable sous \\textbf{trente (30) jours}.

\\part{GOUVERNANCE ET PRISE DE DÉCISION}

\\section{Organes de gouvernance}

\\begin{enumerate}[leftmargin=1.4cm,itemsep=0.2em]
  \\item \\textbf{Assemblée des Associés}~: décisions collectives, au moins deux (2) fois par an.
  \\item \\textbf{Comité de pilotage}~: suivi opérationnel mensuel (produit, finances, RH, juridique).
  \\item \\textbf{Président / Directeur général}~: nommé par l'Assemblée, représentation légale.
  \\item \\textbf{Référent financier}~: suivi comptable, trésorerie, budget.
  \\item \\textbf{Référent juridique}~: conformité, contrats, propriété intellectuelle.
\\end{enumerate}

\\section{Assemblées — convocation et procès-verbaux}

Convocation écrite \\textbf{huit (8) jours ouvrés} minimum avec ordre du jour détaillé. Visioconférence ou consultation écrite si tous consentent. Procès-verbal signé par au moins \\textbf{deux (2)} Associés, archivé et communiqué à tous.

\\section{Quorum et majorités}

Quorum~: \\textbf{75\\,\\%} du capital présent ou représenté. Décisions ordinaires~: majorité simple des voix exprimées. Décisions stratégiques~: \\textbf{unanimité} (article suivant).

\\section{Décisions stratégiques réservées à l'unanimité}

\\begin{enumerate}[leftmargin=1.4cm,itemsep=0.12em]
  \\item modification des statuts ou du Pacte\\,;
  \\item admission d'un associé ou investisseur\\,;
  \\item levée de fonds, cession de titres à un tiers\\,;
  \\item emprunt, caution ou sûreté supérieur(e) à \\textbf{10\\,000~€}\\,;
  \\item cession d'actif supérieure à \\textbf{15\\,000~€}\\,;
  \\item licence exclusive ou partenariat stratégique majeur\\,;
  \\item rémunération des dirigeants et dividendes exceptionnels\\,;
  \\item dissolution, fusion, liquidation\\,;
  \\item changement d'activité principale ou de dénomination\\,;
  \\item investissement hors budget supérieur à \\textbf{25\\,000~€} sur douze mois\\,;
  \\item fixation du tarif de gestion technique quotidienne post-stabilisation (article~20).
\\end{enumerate}

\\section{Délégations de signature et engagements financiers}

Pouvoir individuel~: \\textbf{5\\,000~€} par opération, \\textbf{25\\,000~€} par an. Au-delà~: double signature de deux Associés désignés. Interdiction de caution personnelle sans unanimité.

\\section{Information et transparence}

Chaque Associé reçoit mensuellement~: comptes, trésorerie, indicateurs produit, pipeline commercial, risques juridiques, synthèse des décisions. \\textbf{Data room} numérique accessible à tous.

\\part{RÔLES, ENGAGEMENTS ET PILOTAGE}

\\section{Répartition des divisions}

Associés 1 à 3~: divisions au tableau de l'article~6 et Annexe~A. Associé 4 (Alfred)~: \\textbf{Développeur du groupe} — Application PRODAY.

${articleCadreDeveloppement(person)}

${articleRoleDeveloppeur(person)}

\\section{Loyauté, conflits d'intérêts et déontologie}

Obligation de loyauté et d'agir dans l'intérêt de PRODAY. Activité externe concurrente ou gênante~: accord unanime préalable. Interdiction d'usage personnel des ressources de la Société (comptes, outils, données, marque).

${articleEngagementsSpecifiques(person, myLabel)}

\\section{Évaluation des performances}

Entretien trimestriel par Associé. Deux trimestres de sous-performance~: plan d'amélioration de trois (3) mois, puis mesures graduées (retrait de délégation, ajustement rémunération, exclusion selon article~30).

\\section{Budget et contrôle des dépenses}

Budget annuel avant le \\textbf{31 janvier}. Hors budget~: validation de deux Associés si supérieur à \\textbf{3\\,000~€} ; unanimité si supérieur à \\textbf{10\\,000~€}.

\\part{RÉMUNÉRATION ET DISTRIBUTIONS}

\\section{Rémunération des dirigeants}

Fixée annuellement par l'Assemblée (fixe, variable selon Annexe~D). Interdiction de rémunération occulte ou de commissions non déclarées.

\\section{Remboursement des frais}

Sur justificatifs sous trente (30) jours. Plafond sans validation~: \\textbf{2\\,500~€} par Associé et par an.

\\section{Politique de dividendes}

Selon trésorerie et besoins de croissance. Réserve de précaution possible jusqu'à \\textbf{10\\,\\%} du résultat net.

\\section{Instruments de motivation (BSPCE, AGA)}

Soumis à l'unanimité. Pool maximum~: \\textbf{10\\,\\%} du capital dilué.

\\part{CESSION DE TITRES ET SORTIE}

\\section{Inaliénabilité}

\\textbf{Trois (3) ans} à compter de la signature, sauf unanimité ou cas du Pacte.

\\section{Préemption et agrément}

Préemption des co-associés sous \\textbf{30 jours}, au prorata. Cession à un tiers~: agrément unanime, refus motivé par critères objectifs.

\\section{Tag along et drag along}

Tag along si cession de plus de \\textbf{50\\,\\%} du capital. Drag along si Associés détenant plus de \\textbf{75\\,\\%} acceptent une offre globale.

\\section{Valorisation en cas de cession}

Accord amiable \\textbf{30 jours}, sinon expert-comptable indépendant. Méthode~: moyenne VNC corrigée et multiple de revenus (2 à 4x ARR ou DCF simplifié). Frais partagés par moitié.

\\section{Exclusion pour faute grave}

Fautes~: fraude, détournement, concurrence déloyale, violation grave de confidentialité, abandon manifeste. Procédure contradictoire, décision unanime des autres. Rachat à \\textbf{30\\,\\%} de décote si faute caractérisée.

\\section{Décès et incapacité}

Héritiers tenus de céder sous \\textbf{12 mois} selon articles de cession.

\\part{CONFIDENTIALITÉ ET PROPRIÉTÉ INTELLECTUELLE}

\\section{Confidentialité}

\\textbf{Cinq (5) ans} après cessation. Exclusions~: information publique sans faute, obligation légale. Dommages-intérêts et référé possibles.

\\section{Propriété intellectuelle}

Cession exclusive et mondiale à la Société de toute création liée à PRODAY. Droits de reproduction, adaptation, commercialisation, sous-licence. Signature de tout acte de perfection.

\\section{Actifs numériques et marque}

Marque PRODAY, noms de domaine, comptes stores, réseaux sociaux, dépôts de code~: au nom de la Société ou en fiducie pour la Société jusqu'à immatriculation.

\\section{Protection des données (RGPD)}

Conformité RGPD. Référent désigné par l'Assemblée. Notification des incidents sous \\textbf{24 heures}.

\\part{NON-CONCURRENCE ET COMMUNICATION}

\\section{Non-concurrence}

\\textbf{24 mois} après sortie, Union européenne, activité concurrente directe de PRODAY. Contrepartie selon Annexe~G si applicable.

\\section{Non-sollicitation}

\\textbf{24 mois}. Interdiction de débaucher salariés, prestataires clés, clients identifiés. Indemnité forfaitaire \\textbf{5\\,000~€} par manquement.

\\section{Communication externe}

Prise de parole au nom de PRODAY~: validation de deux Associés minimum. Sujets sensibles (levée de fonds, données utilisateurs)~: unanimité écrite.

\\part{RESPONSABILITÉ, ASSURANCE ET CONTINUITÉ}

\\section{Responsabilité des Associés}

Responsabilité limitée aux apports, sauf faute personnelle ou caution consentie.

\\section{Assurances}

RC Pro et D\\&O sous \\textbf{12 mois} après immatriculation.

\\section{Continuité — personne clé}

Alfred = personne clé produit. Plan de continuité si empêchement supérieur à \\textbf{30 jours}. Accès techniques documentés (Annexe~E).

\\part{LITIGES, ANNEXES ET DISPOSITIONS FINALES}

\\section{Procédure de blocage (deadlock)}

Après \\textbf{30 jours} sur Décision Stratégique~: conciliation (10 j) → médiation (20 j) → expertise (20 j) → rachat croisé ou sortie (article~29).

\\section{Médiation et juridiction compétente}

Tentative amiable \\textbf{60 jours}. Médiation CMAP. À défaut, tribunaux de \\textbf{Paris}, sous réserve d'arbitrage (Annexe~F).

\\section{Droit applicable}

\\textbf{Droit français.}

\\section{Notifications}

LRAR ou e-mail avec accusé de réception aux coordonnées du préambule.

\\section{Intégralité et divisibilité}

Le Pacte constitue l'intégralité de l'accord. Nullité partielle sans affecter le reste.

\\section{Liste des annexes}

\\begin{encadre}
\\begin{tabularx}{\\linewidth}{@{}c Y@{}}
\\toprule
\\textbf{Annexe} & \\textbf{Contenu détaillé} \\\\
\\midrule
A & Fiches de poste et missions par Associé \\\\
B & Indicateurs de performance (KPI) trimestriels \\\\
C & Tableau des apports (numéraire, nature, industrie) \\\\
D & Grille de rémunération variable \\\\
E & Matrice des accès techniques et actifs numériques \\\\
F & Procédure de médiation et arbitrage \\\\
G & Barème de contrepartie non-concurrence \\\\
H & Politique de confidentialité et registre RGPD \\\\
I & Modèle d'avenant d'immatriculation (RCS, SIRET, siège) \\\\
\\bottomrule
\\end{tabularx}
\\end{encadre}

\\noindent{\\footnotesize Les annexes A à I sont à compléter et signer avec le Pacte. Seules les coordonnées personnelles et signatures comportent des champs à remplir dans le corps du document.}
`;
}
