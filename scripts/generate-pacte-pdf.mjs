#!/usr/bin/env node
/**
 * Génère 4 pactes d'associés PRODAY (LaTeX → PDF).
 * Usage: node scripts/generate-pacte-pdf.mjs
 */

import { writeFileSync, mkdirSync, unlinkSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { identiteSignataire, signaturesBloc } from './pacte-blocs.mjs';
import { corpsPacte } from './pacte-corps-fixe.mjs';
import { latexPreamble, pageGarde, pageSynthese } from './pacte-style.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'docs/legal/pactes');
const LOGO_PATH = join(ROOT, 'assets/branding/logo-light.png').replace(/\\/g, '/');

const PERSONS = [
  { filename: 'Pacte_PRODAY_Associe_01', title: 'Exemplaire personnel — Associé 1', slot: 1, isAlfred: false },
  { filename: 'Pacte_PRODAY_Associe_02', title: 'Exemplaire personnel — Associé 2', slot: 2, isAlfred: false },
  { filename: 'Pacte_PRODAY_Associe_03', title: 'Exemplaire personnel — Associé 3', slot: 3, isAlfred: false },
  { filename: 'Pacte_PRODAY_Alfred', title: 'Exemplaire personnel — Alfred', slot: 4, isAlfred: true },
];

const CO_ASSOCIES = [
  { slot: 1, label: 'Associé 1' },
  { slot: 2, label: 'Associé 2' },
  { slot: 3, label: 'Associé 3' },
  { slot: 4, label: 'Associé 4' },
];

function buildTex(person) {
  const myLabel = CO_ASSOCIES.find((a) => a.slot === person.slot).label;
  const alfredNote = person.isAlfred ? ' \\textit{(Alfred)}' : '';
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `% ${person.filename}.tex
\\documentclass[11pt,a4paper]{article}
\\usepackage{fontspec}
\\usepackage[french]{babel}
\\usepackage{geometry}
\\usepackage{graphicx}
\\usepackage{setspace}
\\usepackage{fancyhdr}
\\usepackage{enumitem}
${latexPreamble(person)}

\\begin{document}

${pageGarde(person, LOGO_PATH, dateStr)}
${pageSynthese(person)}

\\section*{Préambule}
\\addcontentsline{toc}{section}{Préambule}

Les soussignés, futurs associés fondateurs de la société \\textbf{PRODAY} (en cours de constitution), conviennent du présent pacte afin d'organiser leurs relations avant et après immatriculation, le développement de la plateforme numérique PRODAY et la gouvernance du groupe de fondateurs.

\\vspace{0.5em}
${identiteSignataire(person, myLabel, alfredNote)}

\\vspace{0.4em}
Le signataire déclare agir en pleine capacité juridique et accepter l'intégralité des clauses ci-après, y compris les annexes.${
    person.isAlfred
      ? " Il est désigné \\textbf{développeur du groupe}. À la date de signature, une base technique substantielle de l'application PRODAY existe déjà~; il s'engage à finaliser le MVP, assurer la sortie stores et la stabilisation initiale selon les articles~16 et~18."
      : " Il reconnaît qu'\\textbf{Alfred} (Associé 4) est le développeur du groupe. À la date de signature, l'application est en cours de construction (non publiée)~; le déroulement actuel et prévu est détaillé à l'article~16."
  }

${corpsPacte(person, myLabel)}

\\clearpage
\\section{Signatures}
\\addcontentsline{toc}{section}{Signatures}
${signaturesBloc(myLabel)}

\\vspace{1em}
{\\footnotesize\\textit{Parapher chaque page. Conserver un exemplaire original par Associé.}}

\\end{document}
`;
}

function cleanAux(base) {
  for (const ext of ['.aux', '.log', '.out', '.toc']) {
    const p = `${base}${ext}`;
    if (existsSync(p)) unlinkSync(p);
  }
}

mkdirSync(OUT_DIR, { recursive: true });

for (const person of PERSONS) {
  const base = join(OUT_DIR, person.filename);
  writeFileSync(`${base}.tex`, buildTex(person), 'utf8');

  for (let i = 0; i < 3; i += 1) {
    try {
      execSync(
        `xelatex -interaction=nonstopmode -output-directory="${OUT_DIR}" "${person.filename}.tex"`,
        { cwd: OUT_DIR, stdio: 'pipe' }
      );
    } catch {
      /* nonstopmode peut retourner un code non nul malgré un PDF généré */
    }
  }

  if (!existsSync(`${base}.pdf`)) {
    throw new Error(`Échec génération PDF : ${base}.pdf`);
  }

  const overfull = execSync(
    `grep -c "Overfull" "${base}.log" 2>/dev/null || echo 0`,
    { encoding: 'utf8' }
  ).trim();
  console.log(`✓ ${base}.pdf (Overfull: ${overfull})`);
}

console.log('\n4 pactes régénérés avec mise en page corrigée.');
