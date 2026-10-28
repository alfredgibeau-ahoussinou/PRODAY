/**
 * Extraction de texte PDF — **sans dépendance externe**.
 *
 * Pourquoi ce module : le pôle Coach doit accepter une feuille d'équipe PDF
 * (export FootClubs / FFF imprimé), et le dépôt n'embarque **aucune** bibliothèque
 * PDF. Le service d'import de licences (`clubLicenseService`) ne sait lire que du
 * texte délimité. Plutôt que d'ajouter un parseur PDF au bundle mobile, la
 * conversion PDF → texte se fait ici, côté serveur, où `node:zlib` est
 * disponible nativement.
 *
 * Ce que le module prend en charge — et rien d'autre :
 * - objets indirects, flux `FlateDecode`, **flux d'objets** (`/Type /ObjStm`) ;
 * - arbre de pages (`/Pages` → `/Kids`) avec repli sur l'ordre des objets ;
 * - opérateurs de texte `Tj`, `TJ`, `'`, `"` et déplacements `Td`/`TD`/`T*` ;
 * - polices simples (encodage WinAnsi/Latin-1) **et** polices composites
 *   (`Identity-H`) via la table `/ToUnicode`.
 *
 * Ce qu'il ne prend pas en charge : PDF chiffrés, flux LZW, PDF scannés
 * (image seule). Dans ces cas `hasText` reste faux et l'appelant doit demander
 * un export CSV — jamais inventer des joueurs.
 */

import { inflateSync, inflateRawSync } from 'node:zlib';

export type PdfTextResult = {
  text: string;
  pages: number;
  /** Vrai si au moins un opérateur de texte a produit des caractères. */
  hasText: boolean;
  /** Diagnostic court, affichable au coach. */
  reason?: string;
};

type PdfObject = {
  num: number;
  dictRaw: string;
  stream?: Buffer;
};

const MAX_OBJECTS = 20000;
const MAX_STREAM_BYTES = 12 * 1024 * 1024;
const MAX_TEXT_CHARS = 400_000;

/** CP1252 0x80–0x9F — la seule plage où WinAnsi diffère de Latin-1. */
const CP1252_HIGH = [
  '\u20AC', '\uFFFD', '\u201A', '\u0192', '\u201E', '\u2026', '\u2020', '\u2021',
  '\u02C6', '\u2030', '\u0160', '\u2039', '\u0152', '\uFFFD', '\u017D', '\uFFFD',
  '\uFFFD', '\u2018', '\u2019', '\u201C', '\u201D', '\u2022', '\u2013', '\u2014',
  '\u02DC', '\u2122', '\u0161', '\u203A', '\u0153', '\uFFFD', '\u017E', '\u0178',
];

export function decodeWinAnsi(bytes: number[]): string {
  let out = '';
  for (const byte of bytes) {
    if (byte >= 0x80 && byte <= 0x9f) {
      out += CP1252_HIGH[byte - 0x80] ?? '\uFFFD';
    } else {
      out += String.fromCharCode(byte);
    }
  }
  return out;
}

export function decodeUtf16Be(bytes: number[]): string {
  let out = '';
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    out += String.fromCharCode((bytes[i]! << 8) | bytes[i + 1]!);
  }
  return out;
}

function hexToBytes(hex: string): number[] {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes: number[] = [];
  for (let i = 0; i + 1 < clean.length; i += 2) {
    bytes.push(parseInt(clean.slice(i, i + 2), 16));
  }
  return bytes;
}

/** Table `/ToUnicode` d'une police composite : code de glyphe → caractère. */
export type ToUnicodeMap = {
  map: Map<number, string>;
  /** Nombre d'octets par code (1 ou 2), déduit du codespace. */
  byteLength: 1 | 2;
};

export function parseToUnicodeCmap(cmapText: string): ToUnicodeMap {
  const map = new Map<number, string>();
  let byteLength: 1 | 2 = 1;

  const codespace = /begincodespacerange([\s\S]*?)endcodespacerange/.exec(cmapText);
  if (codespace) {
    const first = /<([0-9a-fA-F]+)>/.exec(codespace[1] ?? '');
    if (first && first[1] && first[1].length > 2) byteLength = 2;
  }

  const bfchar = /beginbfchar([\s\S]*?)endbfchar/g;
  for (const block of cmapText.matchAll(bfchar)) {
    for (const pair of (block[1] ?? '').matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)) {
      const code = parseInt(pair[1]!, 16);
      const value = decodeUtf16Be(hexToBytes(pair[2]!));
      if (Number.isFinite(code) && value) map.set(code, value);
    }
  }

  const bfrange = /beginbfrange([\s\S]*?)endbfrange/g;
  for (const block of cmapText.matchAll(bfrange)) {
    const body = block[1] ?? '';
    const arrayRanges =
      /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*\[([\s\S]*?)\]/g;
    for (const match of body.matchAll(arrayRanges)) {
      const low = parseInt(match[1]!, 16);
      const values = [...(match[3] ?? '').matchAll(/<([0-9a-fA-F]+)>/g)].map((entry) =>
        decodeUtf16Be(hexToBytes(entry[1]!)),
      );
      values.forEach((value, index) => {
        if (value) map.set(low + index, value);
      });
    }
    const strippedBody = body.replace(/<[0-9a-fA-F]+>\s*<[0-9a-fA-F]+>\s*\[[\s\S]*?\]/g, '');
    const simpleRanges =
      /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
    for (const match of strippedBody.matchAll(simpleRanges)) {
      const low = parseInt(match[1]!, 16);
      const high = parseInt(match[2]!, 16);
      const startBytes = hexToBytes(match[3]!);
      if (!Number.isFinite(low) || !Number.isFinite(high) || high < low) continue;
      const span = Math.min(high - low, 65535);
      for (let offset = 0; offset <= span; offset += 1) {
        const bytes = [...startBytes];
        let carry = offset;
        for (let i = bytes.length - 1; i >= 0 && carry > 0; i -= 1) {
          const sum = bytes[i]! + (carry & 0xff);
          bytes[i] = sum & 0xff;
          carry = (carry >> 8) + (sum > 0xff ? 1 : 0);
        }
        const value = decodeUtf16Be(bytes);
        if (value) map.set(low + offset, value);
      }
    }
  }

  if (byteLength === 1) {
    for (const code of map.keys()) {
      if (code > 0xff) {
        byteLength = 2;
        break;
      }
    }
  }

  return { map, byteLength };
}

function decodeWithMap(bytes: number[], cmap: ToUnicodeMap): string {
  let out = '';
  if (cmap.byteLength === 2) {
    for (let i = 0; i + 1 < bytes.length; i += 2) {
      const code = (bytes[i]! << 8) | bytes[i + 1]!;
      out += cmap.map.get(code) ?? '';
    }
    return out;
  }
  for (const byte of bytes) {
    out += cmap.map.get(byte) ?? decodeWinAnsi([byte]);
  }
  return out;
}

/** Découpe les octets d'une chaîne affichée selon la police courante. */
export function decodeTextBytes(bytes: number[], cmap: ToUnicodeMap | null): string {
  if (cmap && cmap.map.size > 0) return decodeWithMap(bytes, cmap);
  return decodeWinAnsi(bytes);
}

function inflate(buffer: Buffer): Buffer | null {
  try {
    return inflateSync(buffer);
  } catch {
    try {
      return inflateRawSync(buffer);
    } catch {
      return null;
    }
  }
}

function isFlate(dictRaw: string): boolean {
  return /\/FlateDecode/.test(dictRaw);
}

/**
 * Décodage d'un flux : `FlateDecode` est le seul filtre courant des PDF texte.
 * Un flux non filtré est renvoyé tel quel.
 */
function decodeStream(dictRaw: string, stream: Buffer): Buffer | null {
  if (!isFlate(dictRaw)) return stream;
  return inflate(stream);
}

/** Recense les objets indirects, y compris ceux rangés dans un flux d'objets. */
export function collectObjects(bytes: Uint8Array): Map<number, PdfObject> {
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  const latin1 = buffer.toString('latin1');
  const objects = new Map<number, PdfObject>();
  const header = /(?:^|[^0-9])(\d+)\s+(\d+)\s+obj\b/g;

  let match: RegExpExecArray | null;
  let count = 0;
  while ((match = header.exec(latin1)) !== null) {
    if (count >= MAX_OBJECTS) break;
    count += 1;
    const num = Number(match[1]);
    const bodyStart = header.lastIndex;

    const endobjIdx = latin1.indexOf('endobj', bodyStart);
    const streamIdx = latin1.indexOf('stream', bodyStart);
    const hasStream = streamIdx !== -1 && (endobjIdx === -1 || streamIdx < endobjIdx);

    if (!hasStream) {
      const raw = endobjIdx === -1 ? latin1.slice(bodyStart, bodyStart + 4096) : latin1.slice(bodyStart, endobjIdx);
      objects.set(num, { num, dictRaw: raw });
      continue;
    }

    const dictRaw = latin1.slice(bodyStart, streamIdx);
    let dataStart = streamIdx + 'stream'.length;
    if (latin1[dataStart] === '\r') dataStart += 1;
    if (latin1[dataStart] === '\n') dataStart += 1;

    const indirectLength = /\/Length\s+\d+\s+\d+\s+R/.test(dictRaw);
    const directLengthMatch = !indirectLength ? /\/Length\s+(\d+)\b/.exec(dictRaw) : null;
    let dataEnd: number;
    if (directLengthMatch) {
      dataEnd = Math.min(buffer.length, dataStart + Number(directLengthMatch[1]));
    } else {
      const endstreamIdx = endobjIdx !== -1 ? latin1.lastIndexOf('endstream', endobjIdx) : latin1.indexOf('endstream', dataStart);
      dataEnd = endstreamIdx === -1 ? buffer.length : endstreamIdx;
      while (dataEnd > dataStart && (buffer[dataEnd - 1] === 0x0a || buffer[dataEnd - 1] === 0x0d)) {
        dataEnd -= 1;
      }
    }

    const stream = buffer.subarray(dataStart, Math.min(dataEnd, dataStart + MAX_STREAM_BYTES));
    objects.set(num, { num, dictRaw, stream });

    header.lastIndex = Math.max(header.lastIndex, dataEnd);
  }

  // Flux d'objets : chaque sous-objet devient un objet indirect à part entière.
  for (const object of [...objects.values()]) {
    if (!/\/Type\s*\/ObjStm/.test(object.dictRaw) || !object.stream) continue;
    const decoded = decodeStream(object.dictRaw, object.stream);
    if (!decoded) continue;
    const text = decoded.toString('latin1');
    const countMatch = /\/N\s+(\d+)/.exec(object.dictRaw);
    const firstMatch = /\/First\s+(\d+)/.exec(object.dictRaw);
    if (!countMatch || !firstMatch) continue;
    const pairs = text
      .slice(0, Number(firstMatch[1]))
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((value) => Number(value));
    const total = Math.min(Number(countMatch[1]), Math.floor(pairs.length / 2));
    for (let index = 0; index < total; index += 1) {
      const objNum = pairs[index * 2];
      const offset = pairs[index * 2 + 1];
      if (!Number.isFinite(objNum) || !Number.isFinite(offset)) continue;
      if (objects.has(objNum!)) continue;
      const nextOffset = index + 1 < total ? pairs[(index + 1) * 2 + 1] : undefined;
      const start = Number(firstMatch[1]) + offset!;
      const end =
        nextOffset === undefined
          ? text.length
          : Number(firstMatch[1]) + nextOffset;
      objects.set(objNum!, { num: objNum!, dictRaw: text.slice(start, end) });
    }
  }

  return objects;
}

function resolveRef(objects: Map<number, PdfObject>, raw: string | undefined): PdfObject | null {
  if (!raw) return null;
  const ref = /(\d+)\s+\d+\s+R/.exec(raw);
  if (ref) return objects.get(Number(ref[1])) ?? null;
  return null;
}

function decodeObjectText(objects: Map<number, PdfObject>, object: PdfObject): string {
  if (!object.stream) return '';
  const decoded = decodeStream(object.dictRaw, object.stream);
  return decoded ? decoded.toString('latin1') : '';
}

/** Ordre des pages : arbre `/Pages → /Kids`, sinon ordre de déclaration. */
export function resolvePageOrder(objects: Map<number, PdfObject>): PdfObject[] {
  const kidRefs = new Set<string>();
  for (const object of objects.values()) {
    const kids = /\/Kids\s*\[([^\]]*)\]/.exec(object.dictRaw);
    if (!kids) continue;
    for (const entry of (kids[1] ?? '').matchAll(/(\d+)\s+\d+\s+R/g)) kidRefs.add(entry[1]!);
  }

  const roots = [...objects.values()].filter(
    (object) => /\/Type\s*\/Pages/.test(object.dictRaw) && !kidRefs.has(String(object.num)),
  );

  const ordered: PdfObject[] = [];
  const seen = new Set<number>();
  const walk = (object: PdfObject, depth: number): void => {
    if (depth > 32 || seen.has(object.num)) return;
    seen.add(object.num);
    if (/\/Type\s*\/Page\b/.test(object.dictRaw) && !/\/Type\s*\/Pages\b/.test(object.dictRaw)) {
      ordered.push(object);
      return;
    }
    const kids = /\/Kids\s*\[([^\]]*)\]/.exec(object.dictRaw);
    if (!kids) return;
    for (const entry of (kids[1] ?? '').matchAll(/(\d+)\s+\d+\s+R/g)) {
      const child = objects.get(Number(entry[1]));
      if (child) walk(child, depth + 1);
    }
  };

  for (const root of roots) walk(root, 0);

  if (ordered.length > 0) return ordered;

  return [...objects.values()]
    .filter((object) => /\/Type\s*\/Page\b/.test(object.dictRaw) && !/\/Type\s*\/Pages\b/.test(object.dictRaw))
    .sort((a, b) => a.num - b.num);
}

/** Polices d'une page : nom de ressource → table `/ToUnicode` éventuelle. */
export function resolvePageFonts(
  objects: Map<number, PdfObject>,
  page: PdfObject,
): Map<string, ToUnicodeMap | null> {
  const fonts = new Map<string, ToUnicodeMap | null>();

  const inlineResources = /\/Resources\s*<<([\s\S]*?)>>\s*(?:\/|$)/.exec(page.dictRaw);
  const resourcesRef = /\/Resources\s+(\d+)\s+\d+\s+R/.exec(page.dictRaw);
  const resourcesRaw = resourcesRef
    ? objects.get(Number(resourcesRef[1]))?.dictRaw ?? ''
    : inlineResources?.[1] ?? page.dictRaw;

  const fontBlock = /\/Font\s*<<([\s\S]*?)>>/.exec(resourcesRaw);
  let fontDictRaw = fontBlock?.[1] ?? '';
  if (!fontBlock) {
    const fontRef = /\/Font\s+(\d+)\s+\d+\s+R/.exec(resourcesRaw);
    if (fontRef) fontDictRaw = objects.get(Number(fontRef[1]))?.dictRaw ?? '';
  }
  if (!fontDictRaw) return fonts;

  for (const entry of fontDictRaw.matchAll(/\/([A-Za-z0-9#_.-]+)\s+(\d+)\s+\d+\s+R/g)) {
    const name = entry[1]!;
    const fontObject = objects.get(Number(entry[2]));
    if (!fontObject) {
      fonts.set(name, null);
      continue;
    }
    const cmapObject = resolveRef(objects, /\/ToUnicode\s+(\d+\s+\d+\s+R)/.exec(fontObject.dictRaw)?.[1]);
    if (!cmapObject) {
      fonts.set(name, null);
      continue;
    }
    const cmapText = decodeObjectText(objects, cmapObject);
    fonts.set(name, cmapText ? parseToUnicodeCmap(cmapText) : null);
  }

  return fonts;
}

function pageContent(objects: Map<number, PdfObject>, page: PdfObject): string {
  const single = /\/Contents\s+(\d+)\s+\d+\s+R/.exec(page.dictRaw);
  const many = /\/Contents\s*\[([^\]]*)\]/.exec(page.dictRaw);

  const chunks: string[] = [];
  if (many) {
    for (const entry of (many[1] ?? '').matchAll(/(\d+)\s+\d+\s+R/g)) {
      const object = objects.get(Number(entry[1]));
      if (object) chunks.push(decodeObjectText(objects, object));
    }
  } else if (single) {
    const object = objects.get(Number(single[1]));
    if (object) chunks.push(decodeObjectText(objects, object));
  }
  return chunks.join('\n');
}

type Token =
  | { kind: 'string'; bytes: number[] }
  | { kind: 'hex'; bytes: number[] }
  | { kind: 'number'; value: number }
  | { kind: 'name'; value: string }
  | { kind: 'arrayStart' }
  | { kind: 'arrayEnd' }
  | { kind: 'operator'; value: string };

function tokenizeContent(content: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < content.length && tokens.length < 400_000) {
    const char = content[index]!;

    if (char === '(') {
      const bytes: number[] = [];
      let depth = 1;
      index += 1;
      while (index < content.length && depth > 0) {
        const current = content[index]!;
        if (current === '\\') {
          const next = content[index + 1];
          index += 2;
          /**
           * Échappement **octal** : les générateurs déclarent souvent les
           * accents en `\351` (é) plutôt qu'en binaire. Sans cette branche, un
           * nom français ressort en « Th351r351se ».
           */
          if (next !== undefined && next >= '0' && next <= '7') {
            let octal = next;
            while (octal.length < 3 && content[index] !== undefined && content[index]! >= '0' && content[index]! <= '7') {
              octal += content[index];
              index += 1;
            }
            bytes.push(parseInt(octal, 8) & 0xff);
            continue;
          }
          if (next === 'n') bytes.push(0x0a);
          else if (next === 'r') bytes.push(0x0d);
          else if (next === 't') bytes.push(0x09);
          else if (next === 'b') bytes.push(0x08);
          else if (next === 'f') bytes.push(0x0c);
          else if (next === '\n') {
            // Continuation de ligne : rien n'est émis.
          } else if (next === undefined) {
            break;
          } else {
            bytes.push(next.charCodeAt(0) & 0xff);
          }
          continue;
        }
        if (current === '(') depth += 1;
        if (current === ')') {
          depth -= 1;
          if (depth === 0) {
            index += 1;
            break;
          }
        }
        bytes.push(current.charCodeAt(0) & 0xff);
        index += 1;
      }
      tokens.push({ kind: 'string', bytes });
      continue;
    }

    if (char === '<' && content[index + 1] !== '<') {
      const close = content.indexOf('>', index);
      if (close === -1) break;
      tokens.push({ kind: 'hex', bytes: hexToBytes(content.slice(index + 1, close)) });
      index = close + 1;
      continue;
    }

    if (char === '[') {
      tokens.push({ kind: 'arrayStart' });
      index += 1;
      continue;
    }
    if (char === ']') {
      tokens.push({ kind: 'arrayEnd' });
      index += 1;
      continue;
    }

    if (char === '/') {
      const match = /^\/([^\s/<>\[\]()]*)/.exec(content.slice(index));
      tokens.push({ kind: 'name', value: match?.[1] ?? '' });
      index += Math.max(1, match?.[0].length ?? 1);
      continue;
    }

    if (/[\s]/.test(char)) {
      index += 1;
      continue;
    }

    const numberMatch = /^[+-]?\d*\.?\d+/.exec(content.slice(index));
    if (numberMatch && numberMatch[0]) {
      tokens.push({ kind: 'number', value: Number(numberMatch[0]) });
      index += numberMatch[0].length;
      continue;
    }

    const operatorMatch = /^[A-Za-z'"*]+/.exec(content.slice(index));
    if (operatorMatch && operatorMatch[0]) {
      tokens.push({ kind: 'operator', value: operatorMatch[0] });
      index += operatorMatch[0].length;
      continue;
    }

    index += 1;
  }

  return tokens;
}

/** Extrait le texte d'un flux de contenu, en suivant la police courante. */
export function extractTextFromContent(
  content: string,
  fonts: Map<string, ToUnicodeMap | null>,
): string {
  const tokens = tokenizeContent(content);
  let currentFont: ToUnicodeMap | null = null;
  let lastX = 0;
  let lastY = 0;
  let out = '';
  const operandStack: Token[] = [];

  const pushText = (text: string) => {
    if (text) out += text;
  };

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]!;

    if (token.kind !== 'operator') {
      operandStack.push(token);
      if (operandStack.length > 32) operandStack.shift();
      continue;
    }

    switch (token.value) {
      case 'Tf': {
        const nameToken = [...operandStack].reverse().find((entry) => entry.kind === 'name');
        if (nameToken && nameToken.kind === 'name') {
          currentFont = fonts.get(nameToken.value) ?? null;
        }
        break;
      }
      case 'Td':
      case 'TD': {
        const numbers = operandStack.filter((entry) => entry.kind === 'number');
        const x = numbers[numbers.length - 2];
        const y = numbers[numbers.length - 1];
        const dx = x && x.kind === 'number' ? x.value : 0;
        const dy = y && y.kind === 'number' ? y.value : 0;
        if (Math.abs(dy) > 0.5) {
          out += '\n';
          lastY += dy;
        } else if (dx >= 12 && out.length > 0 && !/\s$/.test(out)) {
          out += ' ';
        }
        lastX += dx;
        break;
      }
      case 'T*': {
        out += '\n';
        break;
      }
      case 'Tj':
      case "'":
      case '"': {
        const textToken = [...operandStack].reverse().find((entry) => entry.kind === 'string' || entry.kind === 'hex');
        if (textToken && (textToken.kind === 'string' || textToken.kind === 'hex')) {
          pushText(decodeTextBytes(textToken.bytes, currentFont));
        }
        if (token.value === "'" || token.value === '"') out += '\n';
        break;
      }
      case 'TJ': {
        for (const entry of operandStack) {
          if (entry.kind === 'string' || entry.kind === 'hex') {
            pushText(decodeTextBytes(entry.bytes, currentFont));
          } else if (entry.kind === 'number' && entry.value < -180 && out.length > 0 && !/\s$/.test(out)) {
            out += ' ';
          }
        }
        break;
      }
      default:
        break;
    }

    operandStack.length = 0;
  }

  return out;
}

function normalizeExtractedText(raw: string): string {
  return raw
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

/** Point d'entrée : texte brut du PDF, une ligne par ligne affichée. */
export function extractTextFromPdf(bytes: Uint8Array): PdfTextResult {
  try {
    const objects = collectObjects(bytes);
    if (objects.size === 0) {
      return { text: '', pages: 0, hasText: false, reason: 'PDF illisible (aucun objet).' };
    }

    const pages = resolvePageOrder(objects);
    const chunks: string[] = [];

    for (const page of pages) {
      const fonts = resolvePageFonts(objects, page);
      const content = pageContent(objects, page);
      if (!content) continue;
      chunks.push(extractTextFromContent(content, fonts));
    }

    // Balayage de secours : si l'arbre de pages n'a rien livré, examiner tous les flux textuels du document
    if (chunks.length === 0 || chunks.join('').trim().length === 0) {
      for (const obj of objects.values()) {
        if (obj.stream) {
          const decoded = decodeStream(obj.dictRaw, obj.stream);
          if (decoded) {
            const raw = decoded.toString('latin1');
            if (raw.includes('BT') && raw.includes('ET')) {
              chunks.push(extractTextFromContent(raw, new Map()));
            } else {
              const tjMatches = [...raw.matchAll(/\(([^()]{2,120})\)\s*(?:Tj|TJ|'|")/g)];
              if (tjMatches.length >= 3) {
                chunks.push(tjMatches.map((m) => m[1]).join('\n'));
              }
            }
          }
        }
      }
    }

    const text = normalizeExtractedText(chunks.join('\n')).slice(0, MAX_TEXT_CHARS);
    return {
      text,
      pages: pages.length,
      hasText: text.trim().length > 0,
      ...(text.trim().length === 0
        ? { reason: 'PDF sans texte exploitable (document scanné ou image).' }
        : {}),
    };
  } catch (error) {
    return {
      text: '',
      pages: 0,
      hasText: false,
      reason: error instanceof Error ? `Lecture PDF impossible : ${error.message}` : 'Lecture PDF impossible.',
    };
  }
}
