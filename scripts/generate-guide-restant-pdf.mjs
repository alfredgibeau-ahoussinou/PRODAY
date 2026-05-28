#!/usr/bin/env node
/**
 * Guide PDF « Ce qu'il reste à faire et à améliorer » — public non technique.
 * Usage: node scripts/generate-guide-restant-pdf.mjs
 */

import { writeFileSync, mkdirSync, unlinkSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'docs');
const LOGO_PATH = join(ROOT, 'assets/branding/logo-light.png').replace(/\\/g, '/');
const BASE = 'PRODAY_Restant_et_Ameliorations';
const dateStr = new Date().toLocaleDateString('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const tex = `% ${BASE}.tex — généré automatiquement
\\documentclass[11pt,a4paper]{article}
\\usepackage{fontspec}
\\usepackage[french]{babel}
\\usepackage{geometry}
\\usepackage{graphicx}
\\usepackage{enumitem}
\\usepackage{tabularx}
\\usepackage{tocloft}
\\usepackage{ragged2e}
\\usepackage{array}
\\usepackage{xcolor}
\\usepackage{hyperref}
\\usepackage{titlesec}

\\definecolor{prodaybg}{RGB}{248,250,252}
\\definecolor{prodayline}{RGB}{15,23,42}
\\definecolor{urgent}{RGB}{185,28,28}
\\definecolor{important}{RGB}{180,83,9}
\\definecolor{later}{RGB}{30,64,175}

\\geometry{a4paper, left=2.3cm, right=2.3cm, top=2.4cm, bottom=2.6cm}
\\setmainfont{Times New Roman}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0.4em}
\\hypersetup{colorlinks=true, linkcolor=prodayline, urlcolor=prodayline}

\\newcolumntype{Y}{>{\\RaggedRight\\arraybackslash}X}
\\newcommand{\\badge}[2]{\\textcolor{#1}{\\textbf{#2}}}
\\renewcommand{\\cftsecleader}{\\hfill}
\\renewcommand{\\cftsubsecleader}{\\hfill}

\\newcommand{\\encadre}[1]{%
  \\vspace{0.4em}\\noindent%
  \\begin{minipage}{\\linewidth}%
  \\setlength{\\fboxsep}{12pt}%
  \\colorbox{prodaybg}{\\begin{minipage}{\\dimexpr\\linewidth-24pt}#1\\end{minipage}}%
  \\end{minipage}\\vspace{0.4em}}

\\newcommand{\\tabhead}[1]{\\textbf{#1}}

\\titleformat{\\section}{\\bfseries\\large\\color{prodayline}}{}{0em}{}
\\titleformat{\\subsection}{\\bfseries\\normalsize\\color{prodayline}}{}{0em}{}

\\begin{document}

\\thispagestyle{empty}
\\begin{center}
  \\vspace*{0.8cm}
  \\includegraphics[width=3cm]{"${LOGO_PATH}"}\\\\[1cm]
  {\\fontsize{20}{24}\\selectfont\\bfseries\\textcolor{prodayline}{PRODAY}}\\\\[0.3cm]
  {\\Large Ce qu'il reste à faire, à améliorer\\\\[0.1cm] et comment monétiser}\\\\[0.5cm]
  {\\normalsize Guide pour les associés et partenaires\\\\[0.2cm]
  \\textit{(lecture sans compétence technique)}}\\\\[1cm]
  {\\small ${dateStr}}
  \\vfill
  {\\footnotesize Document de travail interne — à mettre à jour après chaque grande étape du projet.}
\\end{center}
\\clearpage

\\tableofcontents
\\clearpage

\\section{À qui s'adresse ce document ?}

Ce guide est écrit pour les \\textbf{quatre associés fondateurs} de PRODAY et toute personne impliquée dans le projet \\textbf{sans être développeur}. Il explique en termes simples~:
\\begin{itemize}[leftmargin=1.2cm]
  \\item ce qui \\textbf{fonctionne déjà} dans l'application~;
  \\item ce qu'il reste à \\textbf{compléter avant le lancement public} (MVP)~;
  \\item ce qui pourra être \\textbf{amélioré ensuite}~;
  \\item une \\textbf{stratégie de tarification} par type de profil (proposition à valider en Comité, après sondage)~;
  \\item les \\textbf{évolutions produit} demandées (profils coach / club séparés, fil d'actualité, stages)~;
  \\item le projet «~prise de rendez-vous et visio~» (souvent appelé «~Doctolib du sport~») et ses limites légales~;
  \\item \\textbf{qui fait quoi} entre associés et développeur du groupe (Alfred).
\\end{itemize}

\\encadre{
\\textbf{En une phrase}~: PRODAY dispose déjà d'une application mobile avancée en test interne, mais elle n'est \\textbf{pas encore publiée} sur l'App Store ni Google Play. Le pacte d'associés prévoit une livraison MVP sous \\textbf{deux mois} à compter d'une date de départ convenue, puis trois mois de stabilisation.
}

\\section{Où en est le projet aujourd'hui ?}

\\subsection{Statut général}

\\begin{tabularx}{\\linewidth}{@{}>{\\bfseries}p{3.2cm} Y@{}}
\\tabhead{Élément} & \\tabhead{Situation actuelle} \\\\[0.35em]
Société PRODAY & En cours de constitution (pas encore immatriculée au RCS) \\\\
Application mobile & Construite et testable en version de développement \\\\
Publication stores & \\textbf{Pas encore faite} (App Store / Google Play) \\\\
Utilisateurs réels & Possibles via inscription manuelle (comptes de test) \\\\
Données & Hébergées sur Firebase (serveur cloud Google) \\\\
Développement technique & Assuré par Alfred (Associé~4) \\\\
\\end{tabularx}

\\subsection{Les 5 grands piliers de l'app (rappel)}

\\begin{enumerate}[leftmargin=1.2cm]
  \\item \\textbf{Recrutement (Mercato)} — annonces, candidatures, recherche de joueurs et clubs.
  \\item \\textbf{Matchs amicaux} — proposer, chercher et accepter des matchs.
  \\item \\textbf{Messagerie} — échanges entre profils inscrits.
  \\item \\textbf{Profil \\& confiance} — comptes joueur, coach, club~; vérification des coachs/agents.
  \\item \\textbf{Arena, sponsors, gestion d'équipe} — tournois, offres locales, convocations, stats, cotisations club.
\\end{enumerate}

\\section{Ce qui fonctionne déjà (à tester)}

Les associés peuvent déjà installer l'application en mode test et vérifier les parcours suivants~:

\\begin{tabularx}{\\linewidth}{@{}c Y c@{}}
 & \\tabhead{Fonctionnalité} & \\tabhead{État} \\\\[0.35em]
1 & Inscription, connexion, mot de passe oublié & Opérationnel \\\\
2 & Profils joueur, coach, club, parent (mineurs) & Opérationnel \\\\
3 & Mercato (annonces, candidatures) & Opérationnel \\\\
4 & Matchs amicaux (création, recherche, acceptation) & Opérationnel \\\\
5 & Messagerie entre utilisateurs & Opérationnel \\\\
6 & Vérification coach/agent (envoi diplôme, badge orange/vert) & Opérationnel \\\\
7 & Tableau de bord administrateur (modération) & Opérationnel \\\\
8 & Gestion d'équipe (convocations, présences, stats match) & Avancé \\\\
9 & Tournois Arena (création, inscriptions) & Base en place \\\\
10 & Sponsors, détections, export CV joueur PDF & En place \\\\
11 & Contrôle parental (mineurs) & En place \\\\
\\end{tabularx}

\\noindent\\textit{«~Opérationnel~» signifie utilisable en test~; cela n'exclut pas des bugs ou des ajustements avant la publication publique.}

\\section{Ce qu'il reste à faire AVANT le lancement (MVP)}

\\subsection{A. Actions des associés (hors technique)}

Ces tâches ne nécessitent \\textbf{pas} de savoir coder~:

\\begin{enumerate}[leftmargin=1.2cm,itemsep=0.25em]
  \\item \\textbf{Compléter et signer} les quatre exemplaires du pacte d'associés (coordonnées, divisions Associés~1 à~3, date de départ Alfred).
  \\item \\textbf{Immatriculer} la société PRODAY et signer l'avenant d'immatriculation (Annexe~I du pacte).
  \\item \\textbf{Remplir les annexes} du pacte encore vides~: fiches de poste (A), indicateurs KPI (B), tableau des apports (C), etc.
  \\item \\textbf{Tester l'application} sur de vrais téléphones (iPhone et Android) avec des scénarios réalistes (inscription, annonce, match, message).
  \\item \\textbf{Rédiger la recette MVP}~: procès-verbal signé par au moins trois associés lorsque les critères du pacte sont remplis.
  \\item \\textbf{Préparer la communication}~: nom de domaine, e-mail support (ex. contact@proday.app), textes pour les fiches App Store / Google Play.
  \\item \\textbf{Publier en ligne} la politique de confidentialité et les CGU (fichiers déjà rédigés dans le dossier legal — il faut une \\textbf{URL publique}).
  \\item \\textbf{Ouvrir les comptes développeur} Apple (99~€/an) et Google Play (25~€ une fois).
  \\item \\textbf{Fournir les captures d'écran} et descriptions pour les stores (6,7″, 5,5″, etc.).
  \\item \\textbf{Créer un compte démo} pour la revue Apple (e-mail + mot de passe de test).
  \\item \\textbf{Mobiliser 2 à 3 clubs pilotes} pour alimenter l'app avec de vraies données (annonces, matchs) dès la bêta.
  \\item \\textbf{Valider le budget Firebase} si les fonctions cloud avancées nécessitent l'offre payante (plan Blaze, quelques euros à dizaines d'euros selon usage).
\\end{enumerate}

\\subsection{B. Actions techniques (réalisées par Alfred — expliquées simplement)}

\\begin{tabularx}{\\linewidth}{@{}p{0.85cm} Y p{2.4cm}@{}}
 & \\tabhead{Tâche} & \\tabhead{Pourquoi c'est important} \\\\[0.35em]
\\badge{urgent}{1} & Corriger les \\textbf{bugs bloquants} repérés lors des tests associés & Sans cela, la recette échoue \\\\
\\badge{urgent}{2} & \\textbf{Finaliser} les parcours incomplets ou instables du périmètre MVP & Aligné pacte art.~18.2 \\\\
\\badge{urgent}{3} & \\textbf{Déployer} les règles de sécurité et le stockage fichiers (photos, diplômes) en production & Données protégées \\\\
\\badge{urgent}{4} & \\textbf{Activer} les fonctions cloud (notifications, vérifications) si retenues pour le lancement & Push, automatisations \\\\
\\badge{urgent}{5} & Produire les \\textbf{builds officiels} (fichiers installables pour Apple et Google) & Obligatoire pour les stores \\\\
\\badge{urgent}{6} & \\textbf{Soumettre} l'application à l'App Store et Google Play & Publication publique \\\\
\\badge{important}{7} & Rédiger le \\textbf{guide de déploiement} et donner les accès documentés aux associés (Annexe~E) & Transparence pacte \\\\
\\badge{important}{8} & Mettre en place un \\textbf{suivi des pannes} (monitoring) après mise en ligne & Stabilisation 3 mois \\\\
\\end{tabularx}

\\subsection{C. Jalons convenus (pacte d'associés)}

\\encadre{
\\textbf{J+15}~: architecture et environnements prêts.\\\\
\\textbf{J+30}~: version alpha testable en interne.\\\\
\\textbf{J+45}~: version bêta avec clubs pilotes.\\\\
\\textbf{J+60}~: MVP soumis à recette formelle.\\\\[0.3em]
Puis~: sortie stores $\\rightarrow$ 3 mois de stabilisation $\\rightarrow$ décision sur la gestion quotidienne (tarif à fixer plus tard).
}

\\clearpage
\\section{Stratégie de tarification (proposition des associés)}

\\encadre{
\\textbf{Principe retenu par l'équipe}~: le \\textbf{Value-Based Pricing} (prix basé sur la valeur perçue). Plus un profil \\textbf{gagne de l'argent} grâce à PRODAY, plus il peut payer un abonnement élevé. Un joueur cherche un club (il dépense)~; un agent ou un nutritionniste cherche des clients (il gagne).
}

\\textbf{Statut}~: cette grille est une \\textbf{proposition de travail}, pas encore validée officiellement. Elle ne s'applique \\textbf{pas au MVP} (lancement gratuit ou freemium limité). Les associés doivent la valider à l'unanimité avant toute facturation.

\\subsection{Sondage «~combien êtes-vous prêt à payer ?~» (étape indispensable)}

\\encadre{
Avant de figer les prix, l'équipe recommande de mener un \\textbf{sondage terrain} auprès d'un échantillon représentatif de chaque catégorie~: agents, kinés, nutritionnistes, coachs, clubs, etc. L'objectif n'est pas de deviner un prix, mais de mesurer la \\textbf{disposition réelle à payer} pour une application comme PRODAY.
}

\\textbf{Questions types à poser} (en entretien court, formulaire en ligne ou Google Forms)~:
\\begin{itemize}[leftmargin=1.2cm]
  \\item Quel budget mensuel seriez-vous prêt à consacrer à un outil qui vous apporte des clients / joueurs / visibilité ?
  \\item Préférez-vous un \\textbf{abonnement fixe} ou une \\textbf{commission} par prestation réussie ?
  \\item À partir de quel prix l'offre vous semble \\textbf{trop chère} (vous ne vous inscririez pas) ?
  \\item À partir de quel prix elle vous semble \\textbf{suspecte} (trop bon marché pour être crédible) ?
\\end{itemize}

\\textbf{Cible du sondage}~: au minimum 5 à 10 répondants par grande famille (agent, kiné, nutri/prépa, coach, responsable de club). Les associés peuvent le mener via leur réseau (clubs partenaires, professionnels connus). Les résultats alimentent le Comité de pilotage \\textbf{avant} d'activer la facturation (phase~2).

\\subsection{1. Joueurs — offre «~Populaire~» (prix le plus bas)}

Objectif~: attirer un maximum de joueurs pour alimenter la plateforme et intéresser les professionnels.

\\begin{itemize}[leftmargin=1.2cm]
  \\item \\textbf{Gratuit}~: profil de base (CV, poste, stats) + candidature limitée (ex. 2 à 3 annonces ou détections par mois).
  \\item \\textbf{Premium (indicatif 4,99~€ à 8,99~€ / mois)}~: candidatures illimitées, vidéos de matchs illimitées, contact direct avec coachs et préparateurs de la plateforme.
\\end{itemize}

\\subsection{2. Coachs — offre «~Terrain \\& encadrement~»}

\\textbf{Important}~: aujourd'hui l'application ne distingue pas encore pleinement un \\textbf{profil coach} et un \\textbf{profil club} (voir section «~Évolutions produit~»). La tarification devra tenir compte de cette séparation une fois les deux profils en place.

\\begin{itemize}[leftmargin=1.2cm]
  \\item \\textbf{Gratuit}~: calendrier d'équipe, recherche de base de matchs amicaux, profil éducateur.
  \\item \\textbf{Premium coach (indicatif 14,99~€ à 19,99~€ / mois)}~: filtres joueurs, messagerie recrutement, convocations, stats d'équipe.
\\end{itemize}

\\subsection{3. Clubs — offre «~Structure \\& recrutement~»}

Le club est un \\textbf{acheteur institutionnel} (budget trésorerie, plusieurs équipes). Prix potentiellement supérieur au coach individuel.

\\begin{itemize}[leftmargin=1.2cm]
  \\item \\textbf{Gratuit}~: page club, annonces limitées, matchs amicaux.
  \\item \\textbf{Premium club (indicatif 24,99~€ à 39,99~€ / mois)}~: multi-équipes, tournois Arena, annonces illimitées, gestion cotisations, fil d'actualité club, publication de \\textbf{stages}.
\\end{itemize}

\\subsection{4. Professionnels santé \\& performance (nutri, kiné, mental, prépa physique)}

Pour eux, l'app est un \\textbf{générateur de clients}. Deux logiques possibles (voir aussi la section «~Prise de rendez-vous et visio~»)~:

\\begin{itemize}[leftmargin=1.2cm]
  \\item \\textbf{Abonnement «~Professionnel~» (indicatif 29,99~€ à 49,99~€ / mois)}~: profil certifié (diplômes vérifiés), prise de rendez-vous, visibilité (articles/conseils).
  \\item \\textbf{Alternative}~: version gratuite + \\textbf{commission} (ex. 10~\\%) sur chaque consultation réservée via l'app — \\textbf{uniquement} pour les profils non médicaux réglementés.
\\end{itemize}

\\subsection{5. Agents, avocats et recruteurs — offre «~Business / Elite~» (prix le plus élevé)}

Forte valeur financière (commissions sur signatures, contrats).

\\begin{itemize}[leftmargin=1.2cm]
  \\item \\textbf{Abonnement indicatif 79,99~€ à 149,99~€ / mois}~: stats avancées, alertes dès qu'un joueur correspond aux critères (poste, âge, stats), gestion d'un portefeuille de joueurs proposés aux clubs.
\\end{itemize}

\\subsection{6. Sponsors — pas d'abonnement classique}

\\textbf{Packs publicitaires} ou \\textbf{packs sponsoring de tournoi} (ex. 100~€ pour logo sur la page d'un tournoi local pendant un week-end), plutôt qu'un abonnement mensuel fixe.

\\subsection{Tableau récapitulatif (fourchettes indicatives)}

\\small
\\begin{tabularx}{\\linewidth}{@{}Y r Y@{}}
\\tabhead{Profil} & \\tabhead{Prix / mois (indicatif)} & \\tabhead{Logique} \\\\[0.35em]
Joueur & 4,99 -- 8,99~€ & Argent de poche, volume maximal \\\\
Coach & 14,99 -- 19,99~€ & Encadrement, recrutement terrain \\\\
Club & 24,99 -- 39,99~€ & Structure, multi-équipes, budget asso \\\\
Pro santé / performance & 29,99 -- 49,99~€ & Rentabilisé dès 1--2 clients \\\\
Agent / avocat / recruteur & 79,99 -- 149,99~€ & Outil pro à forte valeur \\\\
Sponsor & Pack ponctuel & Visibilité événement / tournoi \\\\
\\end{tabularx}
\\normalsize

\\subsection{Ce que les associés doivent décider (hors technique)}

\\begin{enumerate}[leftmargin=1.2cm]
  \\item \\textbf{Lancer le sondage} «~prêt à payer~» auprès des agents, kinés, pros santé, coachs et clubs (voir ci-dessus).
  \\item Valider ou ajuster chaque fourchette de prix à la lumière des réponses.
  \\item Choisir le \\textbf{modèle au lancement}~: tout gratuit au début, ou freemium dès la sortie stores ?
  \\item Définir les limites de la version gratuite (nombre de candidatures, messages, etc.).
  \\item Prévoir les \\textbf{conditions générales de vente} et la facturation (Stripe, TVA, factures).
  \\item Faire valider la partie «~kinés et actes médicaux~» par un \\textbf{conseil juridique} avant toute commission (section visio / rendez-vous).
\\end{enumerate}

\\clearpage
\\section{Prise de rendez-vous et visio («~Doctolib du sport~»)}

\\subsection{Idée et faisabilité}

Intégrer dans PRODAY un système de \\textbf{prise de rendez-vous} (et éventuellement de \\textbf{visioconférence}) entre joueurs et professionnels est \\textbf{pertinent et moderne}, mais c'est l'un des \\textbf{plus gros chantiers} du projet — surtout sur le plan \\textbf{réglementaire}, pas seulement technique.

\\encadre{
\\textbf{À retenir}~: il ne faut \\textbf{pas} viser un partenariat avec Doctolib. Doctolib reste un acteur généraliste fermé~; de plus, prendre une commission sur des actes médicaux y est interdit. PRODAY doit construire \\textbf{son propre système}, adapté au sport.
}

\\subsection{Deux modèles juridiques distincts (obligatoire)}

\\begin{tabularx}{\\linewidth}{@{}>{\bfseries}p{2.8cm} Y@{}}
\\tabhead{Profil} & \\tabhead{Modèle recommandé} \\\\[0.35em]
Kinésithérapeutes (et médecins du sport) &
\\textbf{Abonnement fixe} pour être visible + agenda sur l'app. \\textbf{Pas de commission} sur l'acte médical (risque de «~compérage~» interdit par le Code de la santé publique). Le joueur prend rendez-vous sur PRODAY mais règle le kiné \\textbf{au cabinet} ou via le lien Doctolib du professionnel s'il en a un. La visio 100~\\% est très limitée pour un kiné (sauf conseils / bilan initial). \\\\[0.3em]
Nutritionnistes, préparateurs mentaux, préparateurs physiques &
\\textbf{Commission + visio} possibles (ex. 10--15~\\% sur la séance). Prestation de conseil / coaching, pas acte médical au sens strict. Parcours~: réservation $\\rightarrow$ paiement dans l'app $\\rightarrow$ consultation en visio. \\\\
\\end{tabularx}

\\subsection{Faisabilité technique (expliquée simplement)}

\\begin{itemize}[leftmargin=1.2cm]
  \\item On ne recrée \\textbf{pas} Skype ou Zoom from scratch.
  \\item On branche l'application à un service spécialisé (\\textbf{Daily.co}, \\textbf{Agora} ou équivalent) via une «~brique~» prête à l'emploi.
  \\item Le développeur intègre des écrans~: rejoindre l'appel, couper micro/caméra, quitter.
  \\item Coût~: abonnement au service vidéo + développement initial (hors forfait MVP actuel du pacte).
\\end{itemize}

\\subsection{Où placer ce chantier dans le calendrier PRODAY}

\\begin{tabularx}{\\linewidth}{@{}c Y@{}}
 & \\tabhead{Contenu} \\\\[0.35em]
\\badge{urgent}{MVP} &
Profils, Mercato, matchs, messagerie, vérification diplômes, sortie stores — \\textbf{sans} paiement abonnements ni visio intégrée. \\\\
\\badge{important}{Phase 2} &
Abonnements par profil (Stripe), limites gratuit/premium, tableau de bord revenus. \\\\
\\badge{important}{Phase 3} &
Agenda + réservation (modèle kiné = abonnement seul). \\\\
\\badge{later}{Phase 4} &
Visio + commission pour nutris / prépas (après avis juridique et tests). \\\\
\\end{tabularx}

\\section{Évolutions produit demandées par l'équipe}

Retours récents du Comité — à intégrer dans la roadmap et le backlog technique.

\\subsection{Profil coach et profil club — deux comptes distincts}

\\textbf{Constat}~: aujourd'hui les rôles incluent «~coach~», «~organisateur~», etc., mais pas de \\textbf{profil club autonome} (logo, équipes, staff, trésorerie, annonces officielles) séparé du compte d'un éducateur individuel.

\\textbf{Objectif}~:
\\begin{itemize}[leftmargin=1.2cm]
  \\item Un \\textbf{profil coach}~: personne physique (diplômes, équipe suivie, convocations, recrutement).
  \\item Un \\textbf{profil club}~: entité (plusieurs équipes, bureau, sponsors locaux, stages, fil d'actualité institutionnel).
  \\item Possibilité de \\textbf{lier} un coach à un club (droits délégués) sans confondre les deux.
\\end{itemize}

\\textbf{Impact}~: inscription, écrans dédiés, permissions, tarification différenciée (section~7). \\textbf{Priorité}~: importante pour la crédibilité auprès des clubs pilotes.

\\subsection{Fil d'actualité}

\\textbf{Existant}~: une brique «~fil ProDay~» permet déjà de publier des actualités et sondages (notamment agents / pros santé).

\\textbf{À améliorer}~:
\\begin{itemize}[leftmargin=1.2cm]
  \\item Rendre le fil \\textbf{visible} dans le parcours principal (pas seulement pour certains rôles).
  \\item Permettre aux \\textbf{clubs} de publier actus officielles (convocations, résultats, vie du club).
  \\item Filtrer par type (club, pro, agent) et modérer les contenus.
  \\item Relier le fil aux \\textbf{notifications push} (nouvelle actu de mon club).
\\end{itemize}

\\subsection{Module «~Stages~»}

\\textbf{Besoin}~: permettre aux clubs, centres de formation et organisateurs de \\textbf{publier des stages} (football), avec dates, places, tranche d'âge, prix, lieu, et candidatures des joueurs.

\\textbf{Périmètre minimal envisagé}~:
\\begin{itemize}[leftmargin=1.2cm]
  \\item Création / édition d'une offre de stage (club ou organisateur).
  \\item Liste et recherche (ville, catégorie d'âge, dates).
  \\item Candidature joueur + suivi (accepté / refusé / liste d'attente).
  \\item Rappel des places restantes et partage vers le fil d'actualité.
\\end{itemize}

\\textbf{Horizon}~: après le MVP de base, en phase 2 ou 3 selon charge technique. Peut s'appuyer sur les briques déjà proches (détections, tournois, Mercato).

\\section{Améliorations recommandées APRÈS le lancement}

Ces points ne bloquent pas le MVP mais renforcent PRODAY à moyen terme~:

\\subsection{Produit \\& expérience utilisateur}

\\begin{itemize}[leftmargin=1.2cm]
  \\item Simplifier les écrans «~Découvrir~» pour les nouveaux utilisateurs (moins de jargon).
  \\item Enrichir les textes d'aide contextuelle (bulles, tutoriels première ouverture).
  \\item Harmoniser encore la charte graphique sur tous les écrans.
  \\item Améliorer les performances sur téléphones anciens.
  \\item Traduction anglaise (si expansion hors France).
\\end{itemize}

\\subsection{Fonctionnalités prévues (roadmap)}

\\begin{tabularx}{\\linewidth}{@{}Y c@{}}
\\tabhead{Fonctionnalité} & \\tabhead{Horizon indicatif} \\\\[0.35em]
Sondage «~prêt à payer~» (agents, kinés, pros, coachs, clubs) & Avant phase 2 \\\\
Profils \\textbf{coach} et \\textbf{club} séparés & Phase 2 \\\\
Fil d'actualité renforcé (clubs, modération, visibilité) & Phase 2 \\\\
Module \\textbf{stages} (publication, candidatures) & Phase 2--3 \\\\
Grille d'abonnements par profil (voir section tarification) & Phase 2 \\\\
Paiements Stripe (abonnements, tournois, cotisations) & Phase 2 \\\\
Prise de rendez-vous «~sport~» (agenda) & Phase 3 \\\\
Visio intégrée (Daily.co / Agora) & Phase 4 \\\\
Alertes géolocalisées pour les agents (rayon 50~km) & Après MVP \\\\
Notifications push plus poussées (rappels convocations) & En cours / à renforcer \\\\
Site web vitrine + pages légales hébergées proprement & Avant ou juste après stores \\\\
Tableau de bord statistiques pour les associés (usage, croissance) & 3--6 mois \\\\
\\end{tabularx}

\\subsection{Organisation \\& gouvernance}

\\begin{itemize}[leftmargin=1.2cm]
  \\item Compléter et faire vivre les \\textbf{KPI trimestriels} (Annexe~B du pacte).
  \\item Définir le \\textbf{tarif de gestion technique quotidienne} avant la fin des 3 mois de stabilisation (article~20 du pacte).
  \\item Nommer un référent \\textbf{support utilisateurs} (réponses aux clubs, modération niveau~1).
  \\item Prévoir une assurance responsabilité civile professionnelle de la société.
  \\item Documenter une procédure en cas d'indisponibilité prolongée d'Alfred (continuité, pacte art.~39).
\\end{itemize}

\\subsection{Qualité \\& confiance}

\\begin{itemize}[leftmargin=1.2cm]
  \\item Augmenter les tests automatiques avant chaque mise à jour store.
  \\item Audit RGPD avec un conseil externe (registre, DPO si besoin).
  \\item Modération renforcée des contenus (annonces, messages signalés).
  \\item Politique de suppression de compte et export des données (droit utilisateur).
\\end{itemize}

\\section{Priorités — vue synthétique}

\\begin{tabularx}{\\linewidth}{@{}p{2.2cm} Y@{}}
\\badge{urgent}{Urgent} & Pacte signé, tests associés, bugs bloquants, déploiement sécurité, soumission stores, URLs légales publiques \\\\[0.5em]
\\badge{important}{Important} & Sondage tarifs, clubs pilotes, recette MVP, profils coach/club, fil d'actualité, stores \\\\[0.5em]
\\badge{later}{Plus tard} & Module stages, abonnements actifs, visio, commissions pros, packs sponsors \\\\
\\end{tabularx}

\\section{Qui fait quoi ?}

\\begin{tabularx}{\\linewidth}{@{}>{\bfseries}p{3.5cm} Y@{}}
\\tabhead{Personne / rôle} & \\tabhead{Responsabilités principales} \\\\[0.35em]
Alfred (Associé~4) & Développement, technique, sortie stores, stabilisation 3 mois, reporting hebdomadaire \\\\
Associés 1, 2 et 3 & Divisions métier (à préciser), tests, décisions unanimes, clubs pilotes, communication, juridique société \\\\
Tous ensemble & Comité de pilotage, validation recette, budget, tarif gestion post-stabilisation \\\\
Expert-comptable / avocat (conseil) & Immatriculation, relecture pacte, conformité RGPD \\\\
\\end{tabularx}

\\section{Glossaire (mots techniques expliqués)}

\\begin{description}[leftmargin=0cm, style=nextline, itemsep=0.2em]
  \\item[MVP] Version minimale mais utilisable du produit, suffisante pour un premier lancement public.
  \\item[Firebase] Service en ligne (Google) qui stocke les comptes, messages et données de l'app — comme un «~serveur~» sans serveur physique chez PRODAY.
  \\item[Build] Fichier d'installation de l'application prêt à être envoyé à Apple ou Google.
  \\item[Store] App Store (iPhone) ou Google Play (Android) — boutiques où le public télécharge l'app.
  \\item[Recette] Phase où les associés vérifient officiellement que l'app répond au cahier des charges avant validation finale.
  \\item[Stabilisation] Trois mois après la mise en ligne pendant lesquels Alfred corrige les bugs et assure le support technique initial.
  \\item[RGPD] Règles européennes sur les données personnelles (consentement, confidentialité, droits des utilisateurs).
  \\item[Stripe] Service de paiement en ligne (cartes bancaires, abonnements) — prévu phases 2 à 4.
  \\item[Value-Based Pricing] Tarification selon la valeur que chaque type d'utilisateur retire de la plateforme (gagner vs dépenser).
  \\item[Freemium] Version gratuite limitée + offre payante «~Premium~».
  \\item[API] Brique technologique toute faite (ex. visio) que l'on connecte à l'app au lieu de tout inventer.
  \\item[Commission] Pourcentage prélevé par PRODAY sur une prestation réservée via l'app (légal seulement hors actes médicaux réglementés).
\\end{description}

\\section{Checklist rapide — prochaines 4 semaines}

\\begin{enumerate}[leftmargin=1.2cm]
  \\item[$\\square$] Fixer la \\textbf{date de départ} du sprint MVP (pacte).
  \\item[$\\square$] Chacun teste l'app 2~h minimum et note les problèmes sur une liste partagée.
  \\item[$\\square$] Réunion Comité de pilotage #1 — prioriser les corrections.
  \\item[$\\square$] Lancer les démarches d'\\textbf{immatriculation} de la société.
  \\item[$\\square$] Rédiger les textes \\textbf{App Store / Google Play}.
  \\item[$\\square$] Publier CGU + confidentialité sur une \\textbf{URL accessible}.
  \\item[$\\square$] Planifier la version bêta avec au moins un club pilote.
  \\item[$\\square$] \\textbf{Lancer le sondage} auprès d'agents, kinés, coachs et clubs («~combien paieriez-vous par mois ?~»).
  \\item[$\\square$] Réunion dédiée~: valider la grille tarifaire \\textbf{après} résultats du sondage.
  \\item[$\\square$] Valider le cahier des charges \\textbf{profil club} vs \\textbf{profil coach} + module \\textbf{stages}.
  \\item[$\\square$] Prendre un \\textbf{avis juridique} sur kinés / commissions avant tout module «~Doctolib du sport~».
\\end{enumerate}

\\end{document}
`;

const texPath = join(OUT_DIR, `${BASE}.tex`);
const pdfPath = join(OUT_DIR, `${BASE}.pdf`);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(texPath, tex, 'utf8');

for (let i = 0; i < 2; i += 1) {
  try {
    execSync(`xelatex -interaction=nonstopmode -output-directory="${OUT_DIR}" "${BASE}.tex"`, {
      cwd: OUT_DIR,
      stdio: 'pipe',
    });
  } catch {
    /* nonstopmode */
  }
}

if (!existsSync(pdfPath)) {
  throw new Error(`Échec génération : ${pdfPath}`);
}

for (const ext of ['.aux', '.log', '.out', '.toc']) {
  const p = join(OUT_DIR, `${BASE}${ext}`);
  if (existsSync(p)) unlinkSync(p);
}

console.log(`✓ ${pdfPath}`);
