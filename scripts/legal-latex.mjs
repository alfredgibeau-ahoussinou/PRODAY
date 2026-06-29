/** Échappement LaTeX pour textes juridiques ProDay. */
export function latexEscape(text) {
  return String(text)
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/[&%$#_{}]/g, (m) => `\\${m}`)
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/€/g, '{\\euro}')
    .replace(/'/g, '’')
    .replace(/"/g, '« ')
    .replace(/"/g, ' »');
}

export function latexPreambleLegal({ pdfTitle }) {
  return `
\\usepackage{booktabs}
\\usepackage{array}
\\usepackage{tabularx}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{xcolor}
\\usepackage{microtype}
\\usepackage{graphicx}
\\usepackage{fancyhdr}

\\hypersetup{
  colorlinks=true,
  linkcolor=prodayline,
  urlcolor=prodayline,
  pdftitle={${latexEscape(pdfTitle)}},
  pdfauthor={PRODAY}
}

\\definecolor{prodayline}{RGB}{15,23,42}
\\definecolor{prodaymuted}{RGB}{100,116,139}

\\geometry{a4paper, left=2.4cm, right=2.4cm, top=2.6cm, bottom=2.8cm, headheight=22pt, headsep=8pt}
\\setmainfont{Times New Roman}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0.45em}
\\emergencystretch=2em

\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0.4pt}
\\fancyhead[L]{\\footnotesize\\textbf{PRODAY}}
\\fancyhead[R]{\\footnotesize\\textcolor{prodaymuted}{${latexEscape(pdfTitle)}}}
\\fancyfoot[C]{\\footnotesize Page \\thepage}
\\fancypagestyle{plain}{
  \\fancyhf{}
  \\renewcommand{\\headrulewidth}{0pt}
  \\fancyfoot[C]{\\footnotesize Page \\thepage}
}
`;
}

export function latexCover(title, subtitle, meta, logoPath) {
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `
\\thispagestyle{empty}
\\vspace*{1.2cm}
\\begin{center}
  \\includegraphics[width=4.8cm]{${logoPath}}
  \\vspace{1.4cm}
  {\\LARGE\\bfseries\\color{prodayline} ${latexEscape(title)}\\par}
  \\vspace{0.6cm}
  {\\large\\color{prodaymuted} ${latexEscape(subtitle)}\\par}
  \\vspace{1.2cm}
  {\\normalsize Mise à jour : ${latexEscape(meta.updatedAt)}\\par}
  {\\normalsize Contact : \\texttt{${latexEscape(meta.contact)}}\\par}
  {\\normalsize Document généré le ${latexEscape(dateStr)}\\par}
\\end{center}
\\vfill
{\\footnotesize\\color{prodaymuted}\\centering ${latexEscape(meta.footer ?? '')}\\par}
\\clearpage
`;
}

export function latexSections(sections, startIndex = 1) {
  let n = startIndex;
  return sections
    .map((section) => {
      const parts = [
        `\\section*{${n}. ${latexEscape(section.title)}}`,
        `\\addcontentsline{toc}{section}{${latexEscape(section.title)}}`,
      ];
      for (const p of section.paragraphs ?? []) {
        parts.push(`${latexEscape(p)}\\par`);
      }
      if (section.bullets?.length) {
        parts.push('\\begin{itemize}[leftmargin=1.2em,itemsep=0.25em]');
        for (const b of section.bullets) {
          parts.push(`  \\item ${latexEscape(b)}`);
        }
        parts.push('\\end{itemize}');
      }
      n += 1;
      return parts.join('\n');
    })
    .join('\n\n');
}

export function latexSignaturesBlock() {
  return `
\\section*{Signatures}
\\addcontentsline{toc}{section}{Signatures}
\\vspace{0.6cm}
\\begin{tabularx}{\\textwidth}{@{}X@{}X@{}}
  \\textbf{Pour ProDay} & \\textbf{Pour le Partenaire} \\\\
  \\vspace{2.8cm} & \\vspace{2.8cm} \\\\
  Date : \\rule{4.5cm}{0.4pt} & Date : \\rule{4.5cm}{0.4pt} \\\\
  Nom : \\rule{4.5cm}{0.4pt} & Nom : \\rule{4.5cm}{0.4pt} \\\\
\\end{tabularx}
\\vspace{1em}
{\\footnotesize\\textit{Parapher chaque page. Conserver un exemplaire original par partie.}}
`;
}

export function buildLegalTex({
  filename,
  title,
  subtitle,
  meta,
  intro,
  sections,
  logoPath,
  parties,
  signatures = false,
}) {
  const partiesBlock = parties?.length
    ? `\\section*{Entre}\\addcontentsline{toc}{section}{Entre}
\\begin{itemize}[leftmargin=1.2em]
${parties.map((p) => `  \\item ${latexEscape(p)}`).join('\n')}
\\end{itemize}`
    : '';

  return `% ${filename}.tex — généré automatiquement
\\documentclass[11pt,a4paper]{article}
\\usepackage{fontspec}
\\usepackage[french]{babel}
\\usepackage{geometry}
\\usepackage{setspace}
${latexPreambleLegal({ pdfTitle: title })}

\\begin{document}
${latexCover(title, subtitle, meta, logoPath)}

\\tableofcontents
\\clearpage

${partiesBlock}

${intro ? `${latexEscape(intro)}\\par\\vspace{0.6em}` : ''}

${latexSections(sections)}

${signatures ? latexSignaturesBlock() : ''}

\\end{document}
`;
}
