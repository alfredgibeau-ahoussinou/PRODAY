#!/usr/bin/env node
/**
 * Génère les contrats juridiques ProDay en PDF (LaTeX → xelatex).
 * Source : src/content/legal/fr.ts (+ sponsorConvention.ts)
 *
 *   npm run docs:legal
 */
import { writeFileSync, mkdirSync, unlinkSync, existsSync, copyFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { execSync } from 'child_process';
import { buildLegalTex } from './legal-latex.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'docs/legal/pdf');
const WEB_DIR = join(ROOT, 'website/public/legal');
const LOGO = join(ROOT, 'assets/branding/logo-light.png').replace(/\\/g, '/');

const legalUrl = pathToFileURL(join(ROOT, 'src/content/legal/fr.ts')).href;
const sponsorUrl = pathToFileURL(join(ROOT, 'src/content/legal/sponsorConvention.ts')).href;

const { LEGAL_META, PRIVACY_INTRO, PRIVACY_SECTIONS, TERMS_INTRO, TERMS_SECTIONS } =
  await import(legalUrl);
const {
  SPONSOR_CONVENTION_META,
  SPONSOR_CONVENTION_PARTIES,
  SPONSOR_CONVENTION_SECTIONS,
} = await import(sponsorUrl);

const DOCUMENTS = [
  {
    filename: 'ProDay_Politique_confidentialite',
    webName: 'ProDay_Politique_confidentialite.pdf',
    title: 'Politique de confidentialité',
    subtitle: 'Application mobile et site ProDay',
    meta: {
      updatedAt: LEGAL_META.updatedAt,
      contact: LEGAL_META.contactEmail,
      footer: `Version en ligne : ${LEGAL_META.siteUrl}${LEGAL_META.privacyPath}`,
    },
    intro: PRIVACY_INTRO,
    sections: PRIVACY_SECTIONS,
  },
  {
    filename: 'ProDay_CGU',
    webName: 'ProDay_CGU.pdf',
    title: "Conditions générales d'utilisation",
    subtitle: 'Application mobile et site ProDay',
    meta: {
      updatedAt: LEGAL_META.updatedAt,
      contact: LEGAL_META.contactEmail,
      footer: `Version en ligne : ${LEGAL_META.siteUrl}${LEGAL_META.termsPath}`,
    },
    intro: TERMS_INTRO,
    sections: TERMS_SECTIONS,
  },
  {
    filename: 'ProDay_Convention_sponsor',
    webName: 'ProDay_Convention_sponsor.pdf',
    title: SPONSOR_CONVENTION_META.title,
    subtitle: SPONSOR_CONVENTION_META.subtitle,
    meta: {
      updatedAt: SPONSOR_CONVENTION_META.updatedAt,
      contact: SPONSOR_CONVENTION_META.contact,
      footer: 'Modèle à personnaliser avant signature.',
    },
    parties: SPONSOR_CONVENTION_PARTIES,
    sections: SPONSOR_CONVENTION_SECTIONS,
    signatures: true,
  },
];

function cleanAux(base) {
  for (const ext of ['.aux', '.log', '.out', '.toc']) {
    const p = `${base}${ext}`;
    if (existsSync(p)) unlinkSync(p);
  }
}

function compileTex(doc) {
  const base = join(OUT_DIR, doc.filename);
  writeFileSync(
    `${base}.tex`,
    buildLegalTex({
      ...doc,
      logoPath: LOGO,
    }),
    'utf8',
  );

  for (let i = 0; i < 2; i += 1) {
    try {
      execSync(
        `xelatex -interaction=nonstopmode -output-directory="${OUT_DIR}" "${doc.filename}.tex"`,
        { cwd: OUT_DIR, stdio: 'pipe' },
      );
    } catch {
      /* nonstopmode */
    }
  }

  if (!existsSync(`${base}.pdf`)) {
    throw new Error(`Échec génération PDF : ${base}.pdf`);
  }

  return `${base}.pdf`;
}

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(WEB_DIR, { recursive: true });

console.log('\n📄 ProDay — génération des contrats PDF\n');

for (const doc of DOCUMENTS) {
  const pdfPath = compileTex(doc);
  const webPath = join(WEB_DIR, doc.webName);
  copyFileSync(pdfPath, webPath);
  cleanAux(join(OUT_DIR, doc.filename));
  console.log(`✓ ${pdfPath}`);
  console.log(`  → ${webPath}`);
}

console.log('\nTerminé. Déployer le site pour publier les PDF.\n');
