#!/usr/bin/env node
/**
 * Génère modules.{es,de,ko}.ts et ui.{de,ko}.ts depuis les sources anglaises.
 * Usage: node scripts/generate-handcraft-locales.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MESSAGES = join(ROOT, 'src/i18n/messages');

const TARGETS = [
  { code: 'es', label: 'espagnol' },
  { code: 'de', label: 'allemand' },
  { code: 'ko', label: 'coréen' },
];

function esc(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function parseCatalog(source) {
  const entries = [];
  const re = /'([^']+)':\s*'((?:\\.|[^'\\])*)'/g;
  let match;
  while ((match = re.exec(source))) {
    entries.push([match[1], match[2].replace(/\\'/g, "'").replace(/\\\\/g, '\\')]);
  }
  return entries;
}

function protectParams(text) {
  const slots = [];
  const template = text.replace(/\{\{(\w+)\}\}/g, (_, name) => {
    slots.push(name);
    return `__PD${slots.length - 1}__`;
  });
  return { template, slots };
}

function restoreParams(text, slots) {
  return text.replace(/__PD(\d+)__/g, (_, index) => {
    const slot = slots[Number(index)];
    return slot ? `{{${slot}}}` : '';
  });
}

async function translateLine(text, target) {
  const { template, slots } = protectParams(text);
  if (!template.trim()) return text;

  const url =
    'https://translate.googleapis.com/translate_a/single' +
    `?client=gtx&sl=en&tl=${encodeURIComponent(target)}&dt=t` +
    `&q=${encodeURIComponent(template)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`translate_http_${res.status}`);
  const data = await res.json();
  const translated = data[0]?.map((row) => row[0]).join('') ?? template;
  return restoreParams(translated, slots);
}

async function translateEntries(entries, target) {
  const result = {};
  const chunkSize = 8;
  for (let i = 0; i < entries.length; i += chunkSize) {
    const chunk = entries.slice(i, i + chunkSize);
    const translated = await Promise.all(
      chunk.map(async ([key, value]) => {
        try {
          return [key, await translateLine(value, target)];
        } catch {
          return [key, value];
        }
      })
    );
    for (const [key, value] of translated) {
      result[key] = value;
    }
    process.stdout.write(`  ${Math.min(i + chunkSize, entries.length)}/${entries.length}\r`);
  }
  process.stdout.write('\n');
  return result;
}

function writeModuleFile(locale, constName, comment, catalog, filename = `modules.${locale}.ts`) {
  const lines = Object.entries(catalog).map(
    ([key, value]) => `  '${esc(key)}': '${esc(value)}',`
  );
  const body = `import type { MessageCatalog } from '../types';

/** ${comment} */
export const ${constName}: MessageCatalog = {
${lines.join('\n')}
};
`;
  writeFileSync(join(MESSAGES, filename), body, 'utf8');
}

function writeUiFile(locale, constName, comment, catalog) {
  const lines = Object.entries(catalog).map(
    ([key, value]) => `  '${esc(key)}': '${esc(value)}',`
  );
  const body = `import type { MessageCatalog } from '../types';

/** ${comment} */
export const ${constName}: MessageCatalog = {
${lines.join('\n')}
};
`;
  writeFileSync(join(MESSAGES, `ui.${locale}.ts`), body, 'utf8');
}

async function main() {
  const modulesSource = readFileSync(join(MESSAGES, 'modules.en.ts'), 'utf8');
  const secondarySource = readFileSync(join(MESSAGES, 'secondary.en.ts'), 'utf8');
  const uiSource = readFileSync(join(MESSAGES, 'ui.en.ts'), 'utf8');
  const moduleEntries = parseCatalog(modulesSource);
  const secondaryEntries = parseCatalog(secondarySource);
  const uiEntries = parseCatalog(uiSource);

  for (const { code, label } of TARGETS) {
    console.log(`→ modules.${code}.ts (${label})`);
    const modules = await translateEntries(moduleEntries, code);
    writeModuleFile(code, `MODULES_${code.toUpperCase()}`, `Chaînes des onglets — ${label}.`, modules);

    console.log(`→ secondary.${code}.ts (${label})`);
    const secondary = await translateEntries(secondaryEntries, code);
    writeModuleFile(
      code,
      `SECONDARY_${code.toUpperCase()}`,
      `Écrans secondaires — ${label}.`,
      secondary,
      `secondary.${code}.ts`
    );

    if (code !== 'es') {
      console.log(`→ ui.${code}.ts (${label})`);
      const ui = await translateEntries(uiEntries, code);
      writeUiFile(code, `UI_${code.toUpperCase()}`, `Chaînes UI — ${label}.`, ui);
    }
  }

  console.log('✓ Catalogues générés');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
