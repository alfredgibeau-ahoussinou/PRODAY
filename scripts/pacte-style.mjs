/** Préambule LaTeX et macros de mise en forme du pacte PRODAY */

export function latexPreamble(person) {
  const titleShort = person.title.replace(/—/g, '--');
  return `
\\usepackage{booktabs}
\\usepackage{array}
\\usepackage{tabularx}
\\usepackage{ragged2e}
\\usepackage{longtable}
\\usepackage{hyperref}
\\usepackage{tocloft}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\usepackage[most]{tcolorbox}
\\usepackage{microtype}
\\usepackage{needspace}

\\hypersetup{
  colorlinks=true,
  linkcolor=prodayline,
  urlcolor=prodayline,
  pdftitle={Pacte PRODAY},
  pdfauthor={PRODAY}
}

\\definecolor{prodaybg}{RGB}{248,250,252}
\\definecolor{prodayline}{RGB}{15,23,42}

\\geometry{a4paper, left=2.4cm, right=2.4cm, top=2.5cm, bottom=2.8cm, headheight=22pt, headsep=8pt}
\\setmainfont{Times New Roman}
\\setstretch{1.1}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0.35em}
\\emergencystretch=2em

% ——— En-têtes / pieds de page (épurés) ———
\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0.4pt}
\\fancyhead[L]{\\footnotesize\\textbf{PRODAY}}
\\fancyhead[R]{\\footnotesize ${titleShort}}
\\fancyfoot[C]{\\footnotesize Page \\thepage}
\\fancypagestyle{plain}{
  \\fancyhf{}
  \\renewcommand{\\headrulewidth}{0pt}
  \\fancyfoot[C]{\\footnotesize Page \\thepage}
}

% ——— Titres (sans page blanche par titre) ———
\\titleformat{\\part}
  {\\normalfont\\bfseries\\large\\color{prodayline}}
  {\\partname~\\thepart —}
  {0.8em}
  {}

\\titleformat{\\section}
  {\\normalfont\\bfseries\\normalsize\\color{prodayline}}
  {\\thesection}
  {0.5em}
  {}

\\titlespacing*{\\part}{0pt}{1.4em}{0.8em}
\\titlespacing*{\\section}{0pt}{1em}{0.4em}

% Titres \\paragraph en bloc (évite le conflit run-in + encadre / tcolorbox)
\\titleformat{\\paragraph}[block]
  {\\normalfont\\bfseries\\color{prodayline}}
  {\\theparagraph}
  {1em}
  {}
\\titlespacing*{\\paragraph}{0pt}{0.8em}{0.4em}

\\setcounter{secnumdepth}{2}
\\renewcommand{\\thesection}{Article \\arabic{section}}

% ——— Sommaire ———
\\renewcommand{\\cftpartfont}{\\bfseries\\small}
\\renewcommand{\\cftsecfont}{\\small}
\\setlength{\\cftbeforepartskip}{0.5em}
\\setlength{\\cftbeforesecskip}{0.2em}
\\setlength{\\cftpartindent}{0em}
\\setlength{\\cftsecindent}{1.5em}
\\setlength{\\cftsecnumwidth}{4.2em}
\\cftsetrmarg{2.5cm}

% ——— Encadrés (tcolorbox — évite les conflits fcolorbox / textcolor) ———
\\newcolumntype{Y}{>{\\RaggedRight\\arraybackslash}X}

\\tcbset{
  prodaybox/.style={
    enhanced,
    colback=prodaybg,
    colframe=prodayline,
    boxrule=0.75pt,
    arc=1.5mm,
    left=8pt,
    right=8pt,
    top=6pt,
    bottom=6pt,
    before skip=0.5em,
    after skip=0.5em,
    width=\\textwidth,
    boxsep=0pt,
    breakable=false
  }
}

\\newenvironment{encadre}{\\begin{tcolorbox}[prodaybox]}{\\end{tcolorbox}}

\\newcommand{\\libelle}[1]{\\textbf{\\textcolor{prodayline}{#1}}}
`;
}

export function pageGarde(person, logoPath, dateStr) {
  return `
\\thispagestyle{empty}
\\begin{center}
  \\vspace*{1cm}
  \\includegraphics[width=3.2cm]{"${logoPath}"}\\\\[1.2cm]
  {\\fontsize{21}{25}\\selectfont\\bfseries\\textcolor{prodayline}{PACTE D'ASSOCIÉS}}\\\\[0.4cm]
  {\\Large Société \\textbf{PRODAY}}\\\\[0.2cm]
  {\\normalsize\\textit{Société en cours de constitution}}\\\\[1cm]
  \\fcolorbox{prodayline}{prodaybg}{%
    \\begin{minipage}{0.85\\linewidth}
    \\centering
    \\vspace{0.5em}
    {\\large\\textbf{${person.title}}}\\\\[0.4em]
    {\\small ${dateStr}}
    \\vspace{0.5em}
    \\end{minipage}}\\\\[1cm]
  {\\footnotesize 4 associés — 25\\,\\% chacun — Droit français}
  \\vfill
  {\\footnotesize\\textit{Document contractuel — validation par avocat recommandée}}
\\end{center}
\\clearpage`;
}

export function pageSynthese(person) {
  const devBlock = person.isAlfred
    ? `\\item Vous êtes le \\textbf{développeur du groupe} — base technique déjà avancée, MVP à livrer sous 2 mois, puis sortie stores et 3 mois de stabilisation.`
    : `\\item \\textbf{Alfred (Associé 4)} développe seul la technique~; les Associés 1 à 3 définissent les besoins et valident la recette.`;
  return `
\\pagenumbering{roman}
\\setcounter{page}{1}
\\tableofcontents
\\clearpage

\\section*{Fiche de lecture}
\\addcontentsline{toc}{section}{Fiche de lecture}

\\begin{encadre}
\\libelle{En bref}\\\\[0.2em]
Pacte entre \\textbf{4 associés fondateurs} (25\\,\\% chacun) de PRODAY, société \\textbf{en cours de constitution}.
\\end{encadre}

\\libelle{Points essentiels}
\\begin{enumerate}[leftmargin=1.2cm,itemsep=0.2em]
  \\item Société \\textbf{non immatriculée} — avenant après Kbis.
  ${devBlock}
  \\item \\textbf{Actuellement}~: app en construction (non publiée en stores), société non immatriculée.
  \\item \\textbf{Ensuite}~: MVP (2 mois) → sortie stores → 3 mois stabilisation → gestion quotidienne (tarif à fixer).
  \\item Forfait technique~: \\textbf{10\\,000~€} catalogue → \\textbf{-50\\,\\%} → \\textbf{5\\,000~€ HT net} (apport en industrie).
  \\item Décisions stratégiques~: \\textbf{unanimité}.
  \\item Vesting~: 4 ans, cliff 12 mois.
\\end{enumerate}

\\begin{encadre}
\\libelle{Récapitulatif financier}\\\\[0.4em]
\\begin{tabularx}{\\linewidth}{@{}Y r@{}}
\\toprule
\\textbf{Libellé} & \\textbf{Montant HT} \\\\
\\midrule
Valeur catalogue & 10\\,000~€ \\\\
Remise fondateur (50\\,\\%) & -5\\,000~€ \\\\
\\midrule
\\textbf{Montant net définitif} & \\textbf{5\\,000~€} \\\\
TVA indicative (20\\,\\%) & 1\\,000~€ \\\\
\\textbf{Total TTC indicatif} & \\textbf{6\\,000~€} \\\\
\\bottomrule
\\end{tabularx}
\\end{encadre}

\\clearpage
\\subsection*{Structure du document}
\\vspace{0.3em}
\\small
\\begin{tabularx}{\\textwidth}{@{}c Y@{}}
\\toprule
\\textbf{Titre} & \\textbf{Contenu} \\\\
\\midrule
I & Définitions, société en constitution \\\\
II & Capital, apports, vesting \\\\
III & Gouvernance et décisions \\\\
IV & Rôles, engagements, budget \\\\
V & Rémunération et dividendes \\\\
VI & Cession de titres \\\\
VII & Confidentialité et propriété intellectuelle \\\\
VIII & Non-concurrence \\\\
IX & Responsabilité et assurance \\\\
X & Litiges et annexes \\\\
\\bottomrule
\\end{tabularx}
\\normalsize

\\clearpage
\\pagenumbering{arabic}
\\setcounter{page}{1}
`;
}
