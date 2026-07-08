#!/usr/bin/env node
/**
 * Génère le pacte d'associés PRODAY unifié (LaTeX → PDF).
 * Usage: node scripts/generate-pacte-pdf.mjs
 */

import { writeFileSync, mkdirSync, unlinkSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { identitesSignataires, signaturesUnifiees } from './pacte-blocs.mjs';
import { corpsPacte } from './pacte-corps-fixe.mjs';
import { latexPreamble, pageGarde, pageSynthese } from './pacte-style.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'docs/legal/pactes');
const LOGO_PATH = join(ROOT, 'assets/branding/logo-light.png').replace(/\\/g, '/');
const FILENAME = 'Pacte_PRODAY';
const LEGACY_STEMS = [
  'Pacte_PRODAY_Associe_01',
  'Pacte_PRODAY_Associe_02',
  'Pacte_PRODAY_Associe_03',
  'Pacte_PRODAY_Alfred',
];

function buildTex() {
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `% ${FILENAME}.tex
\\documentclass[11pt,a4paper]{article}
\\usepackage{fontspec}
\\usepackage[french]{babel}
\\usepackage{geometry}
\\usepackage{graphicx}
\\usepackage{setspace}
\\usepackage{fancyhdr}
\\usepackage{enumitem}
${latexPreamble()}

\\begin{document}

${pageGarde(LOGO_PATH, dateStr)}
${pageSynthese()}

\\section*{Préambule}
\\addcontentsline{toc}{section}{Préambule}

Les soussignés, \\textbf{quatre associés fondateurs} de la société \\textbf{PRODAY} (en cours de constitution), conviennent du présent pacte afin d'organiser leurs relations avant et après immatriculation, le développement de la plateforme numérique PRODAY et la gouvernance du groupe de fondateurs.

\\vspace{0.5em}
Chaque Associé détient \\textbf{25\\,\\%} du capital. \\textbf{Alfred} (Associé 4) est désigné \\textbf{développeur du groupe}. À la date de signature, une base technique et fonctionnelle \\textbf{substantielle} de l'Application et du site vitrine existe déjà (article~16.3 bis)~; Alfred s'engage à finaliser la recette MVP, assurer la sortie sur les stores et la stabilisation initiale selon les articles~16,~18 et~19. Les Associés 1 à 3 contribuent par la définition des besoins métier, les tests utilisateurs et les décisions collectives au Comité de pilotage.

\\vspace{0.4em}
${identitesSignataires()}

\\vspace{0.4em}
Les quatre signataires déclarent agir en pleine capacité juridique et accepter l'intégralité des clauses ci-après, y compris les annexes.

${corpsPacte()}

\\clearpage
\\section{Signatures}
\\addcontentsline{toc}{section}{Signatures}
${signaturesUnifiees()}

\\vspace{1em}
{\\footnotesize\\textit{Parapher chaque page. Conserver une copie conforme pour chaque Associé.}}

\\end{document}
`;
}

function cleanAux(base) {
  for (const ext of ['.aux', '.log', '.out', '.toc']) {
    const p = `${base}${ext}`;
    if (existsSync(p)) unlinkSync(p);
  }
}

function cleanLegacyExemplaires() {
  for (const stem of LEGACY_STEMS) {
    for (const ext of ['.pdf', '.tex', '.aux', '.log', '.out', '.toc']) {
      const p = join(OUT_DIR, `${stem}${ext}`);
      if (existsSync(p)) unlinkSync(p);
    }
  }
}

mkdirSync(OUT_DIR, { recursive: true });

const base = join(OUT_DIR, FILENAME);
writeFileSync(`${base}.tex`, buildTex(), 'utf8');

for (let i = 0; i < 3; i += 1) {
  try {
    execSync(
      `xelatex -interaction=nonstopmode -output-directory="${OUT_DIR}" "${FILENAME}.tex"`,
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

cleanAux(base);
cleanLegacyExemplaires();
console.log('\nPacte unifié régénéré.');
