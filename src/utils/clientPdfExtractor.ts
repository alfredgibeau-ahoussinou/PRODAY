/**
 * PRODAY — Extracteur PDF autonome côté client (Web & Mobile).
 *
 * Décompresse les flux PDF FlateDecode (Deflate RFC 1951 / zlib RFC 1950) en pur TypeScript
 * sans aucune dépendance binaire externe ni appel serveur obligatoire.
 *
 * Fonctionne hors-ligne, en prévisualisation coach et sur mobile sans dépendre
 * de Firebase Storage ni d'une Cloud Function.
 */

// ---------------------------------------------------------------------------
// 1. Décompresseur Deflate / Inflate pur JS (RFC 1950 & RFC 1951)
// ---------------------------------------------------------------------------

export function inflatePureJs(input: Uint8Array): Uint8Array {
  let inPos = 0;

  // Détection d'en-tête zlib standard (0x78)
  if (
    input.length > 2 &&
    input[0] === 0x78 &&
    (input[1] === 0x9c ||
      input[1] === 0x01 ||
      input[1] === 0xda ||
      (input[0] * 256 + input[1]) % 31 === 0)
  ) {
    inPos = 2; // saute les 2 octets d'en-tête zlib
  }

  let bitBuf = 0;
  let bitCount = 0;

  function getBits(n: number): number {
    while (bitCount < n) {
      if (inPos >= input.length) return 0;
      bitBuf |= input[inPos++] << bitCount;
      bitCount += 8;
    }
    const val = bitBuf & ((1 << n) - 1);
    bitBuf >>>= n;
    bitCount -= n;
    return val;
  }

  interface HuffmanTable {
    maxLen: number;
    table: Map<number, number>;
  }

  function buildHuffman(lengths: Uint8Array | number[]): HuffmanTable | null {
    let maxLen = 0;
    for (let i = 0; i < lengths.length; i++) {
      if (lengths[i] > maxLen) maxLen = lengths[i];
    }
    if (maxLen === 0) return null;

    const blCount = new Uint16Array(maxLen + 1);
    for (let i = 0; i < lengths.length; i++) {
      const len = lengths[i];
      if (len > 0) blCount[len]++;
    }

    const nextCode = new Uint16Array(maxLen + 1);
    let code = 0;
    for (let bits = 1; bits <= maxLen; bits++) {
      code = (code + blCount[bits - 1]) << 1;
      nextCode[bits] = code;
    }

    const table = new Map<number, number>();
    for (let i = 0; i < lengths.length; i++) {
      const len = lengths[i];
      if (len > 0) {
        table.set((len << 16) | nextCode[len], i);
        nextCode[len]++;
      }
    }
    return { maxLen, table };
  }

  function decodeSymbol(huff: HuffmanTable | null): number {
    if (!huff) return 0;
    let code = 0;
    for (let len = 1; len <= huff.maxLen; len++) {
      code = (code << 1) | getBits(1);
      const key = (len << 16) | code;
      if (huff.table.has(key)) {
        return huff.table.get(key)!;
      }
    }
    return 0;
  }

  // Tables de Huffman fixes
  const fixedLitLengths = new Uint8Array(288);
  for (let i = 0; i <= 143; i++) fixedLitLengths[i] = 8;
  for (let i = 144; i <= 255; i++) fixedLitLengths[i] = 9;
  for (let i = 256; i <= 279; i++) fixedLitLengths[i] = 7;
  for (let i = 280; i <= 287; i++) fixedLitLengths[i] = 8;
  const fixedLitHuff = buildHuffman(fixedLitLengths);

  const fixedDistLengths = new Uint8Array(32);
  for (let i = 0; i < 32; i++) fixedDistLengths[i] = 5;
  const fixedDistHuff = buildHuffman(fixedDistLengths);

  const lengthExtraBits = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
  const lengthBase = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
  const distExtraBits = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
  const distBase = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
  const clCodeOrder = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

  const out: number[] = [];
  let isFinal = 0;

  try {
    while (!isFinal) {
      isFinal = getBits(1);
      const bType = getBits(2);

      if (bType === 0) {
        // Bloc non compressé
        bitBuf = 0;
        bitCount = 0;
        const len = input[inPos++] | (input[inPos++] << 8);
        inPos += 2; // saute nlen
        for (let i = 0; i < len; i++) out.push(input[inPos++]);
      } else if (bType === 1 || bType === 2) {
        let litHuff = fixedLitHuff;
        let distHuff = fixedDistHuff;

        if (bType === 2) {
          const hlit = getBits(5) + 257;
          const hdist = getBits(5) + 1;
          const hclen = getBits(4) + 4;

          const clLengths = new Uint8Array(19);
          for (let i = 0; i < hclen; i++) {
            clLengths[clCodeOrder[i]] = getBits(3);
          }
          const clHuff = buildHuffman(clLengths);

          const codeLengths = new Uint8Array(hlit + hdist);
          let numLengths = 0;
          while (numLengths < hlit + hdist) {
            const sym = decodeSymbol(clHuff);
            if (sym < 16) {
              codeLengths[numLengths++] = sym;
            } else if (sym === 16) {
              const repeat = getBits(2) + 3;
              const prev = codeLengths[numLengths - 1] ?? 0;
              for (let r = 0; r < repeat; r++) codeLengths[numLengths++] = prev;
            } else if (sym === 17) {
              const repeat = getBits(3) + 3;
              for (let r = 0; r < repeat; r++) codeLengths[numLengths++] = 0;
            } else if (sym === 18) {
              const repeat = getBits(7) + 11;
              for (let r = 0; r < repeat; r++) codeLengths[numLengths++] = 0;
            }
          }
          litHuff = buildHuffman(codeLengths.subarray(0, hlit));
          distHuff = buildHuffman(codeLengths.subarray(hlit));
        }

        while (true) {
          const sym = decodeSymbol(litHuff);
          if (sym < 256) {
            out.push(sym);
          } else if (sym === 256) {
            break;
          } else {
            const lenIdx = sym - 257;
            const length = lengthBase[lenIdx] + getBits(lengthExtraBits[lenIdx]);
            const distSym = decodeSymbol(distHuff);
            const distance = distBase[distSym] + getBits(distExtraBits[distSym]);
            for (let i = 0; i < length; i++) {
              out.push(out[out.length - distance]);
            }
          }
        }
      } else {
        break;
      }
    }
  } catch {
    // Si la fin de flux est atteinte abruptement
  }

  return new Uint8Array(out);
}

// ---------------------------------------------------------------------------
// 2. Décodage de polices et ToUnicode
// ---------------------------------------------------------------------------

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

export type ToUnicodeMap = {
  map: Map<number, string>;
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
    const arrayRanges = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*\[([\s\S]*?)\]/g;
    for (const match of body.matchAll(arrayRanges)) {
      const low = parseInt(match[1]!, 16);
      const values = [...(match[3] ?? '').matchAll(/<([0-9a-fA-F]+)>/g)].map((entry) =>
        decodeUtf16Be(hexToBytes(entry[1]!)),
      );
      values.forEach((value, index) => {
        if (value) map.set(low + index, value);
      });
    }
    const simpleRanges = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
    for (const match of body.matchAll(simpleRanges)) {
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

function decodeTextBytes(bytes: number[], cmap: ToUnicodeMap | null): string {
  if (cmap && cmap.map.size > 0) {
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
  return decodeWinAnsi(bytes);
}

// ---------------------------------------------------------------------------
// 3. Modèle d'objets PDF & Extraction de pages
// ---------------------------------------------------------------------------

type PdfObject = {
  num: number;
  dictRaw: string;
  stream?: Uint8Array;
};

function uint8ToStringLatin1(bytes: Uint8Array): string {
  let str = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 8192) {
    str += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, Math.min(i + 8192, len))));
  }
  return str;
}

export function collectPdfObjects(bytes: Uint8Array): Map<number, PdfObject> {
  const latin1 = uint8ToStringLatin1(bytes);
  const objects = new Map<number, PdfObject>();
  const header = /(?:^|[^0-9])(\d+)\s+(\d+)\s+obj\b/g;

  let match: RegExpExecArray | null;
  let count = 0;
  while ((match = header.exec(latin1)) !== null) {
    if (count >= 10000) break;
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

    const lengthMatch = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(dictRaw);
    let dataEnd: number;
    if (lengthMatch) {
      dataEnd = Math.min(bytes.length, dataStart + Number(lengthMatch[1]));
    } else {
      const endstreamIdx = latin1.indexOf('endstream', dataStart);
      dataEnd = endstreamIdx === -1 ? bytes.length : endstreamIdx;
      while (dataEnd > dataStart && (bytes[dataEnd - 1] === 0x0a || bytes[dataEnd - 1] === 0x0d)) {
        dataEnd -= 1;
      }
    }

    const stream = bytes.subarray(dataStart, Math.min(dataEnd, dataStart + 10 * 1024 * 1024));
    objects.set(num, { num, dictRaw, stream });
    header.lastIndex = Math.max(header.lastIndex, dataEnd);
  }

  return objects;
}

function decodeStream(dictRaw: string, stream: Uint8Array): string {
  if (/\/FlateDecode/.test(dictRaw)) {
    try {
      const decompressed = inflatePureJs(stream);
      return uint8ToStringLatin1(decompressed);
    } catch {
      return uint8ToStringLatin1(stream);
    }
  }
  return uint8ToStringLatin1(stream);
}

// ---------------------------------------------------------------------------
// 4. Tokenizer et Opérateurs de texte PDF (BT ... ET, Tj, TJ)
// ---------------------------------------------------------------------------

type Token =
  | { kind: 'string'; bytes: number[] }
  | { kind: 'hex'; bytes: number[] }
  | { kind: 'number'; value: number }
  | { kind: 'name'; value: string }
  | { kind: 'operator'; value: string };

function tokenizeContent(content: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < content.length && tokens.length < 200000) {
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
          if (next !== undefined && next >= '0' && next <= '7') {
            let octal = next;
            while (
              octal.length < 3 &&
              content[index] !== undefined &&
              content[index]! >= '0' &&
              content[index]! <= '7'
            ) {
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
          else if (next !== undefined) bytes.push(next.charCodeAt(0) & 0xff);
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

export function extractTextFromContent(
  content: string,
  fonts: Map<string, ToUnicodeMap | null>,
): string {
  const tokens = tokenizeContent(content);
  let currentFont: ToUnicodeMap | null = null;
  let out = '';
  const operandStack: Token[] = [];

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
      case 'TD':
      case 'T*': {
        out += '\n';
        break;
      }
      case 'Tj':
      case "'":
      case '"': {
        const textToken = [...operandStack].reverse().find(
          (entry) => entry.kind === 'string' || entry.kind === 'hex',
        );
        if (textToken && (textToken.kind === 'string' || textToken.kind === 'hex')) {
          out += decodeTextBytes(textToken.bytes, currentFont);
        }
        if (token.value === "'" || token.value === '"') out += '\n';
        break;
      }
      case 'TJ': {
        for (const entry of operandStack) {
          if (entry.kind === 'string' || entry.kind === 'hex') {
            out += decodeTextBytes(entry.bytes, currentFont);
          } else if (entry.kind === 'number' && entry.value < -180 && !/\s$/.test(out)) {
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

// ---------------------------------------------------------------------------
// 5. Extraction complète du PDF & Structuration en CSV
// ---------------------------------------------------------------------------

export function extractPdfTextClient(bytes: Uint8Array): {
  text: string;
  hasText: boolean;
  pageCount: number;
} {
  const objects = collectPdfObjects(bytes);
  if (objects.size === 0) {
    return { text: '', hasText: false, pageCount: 0 };
  }

  // Trouver les pages
  const pages: PdfObject[] = [];
  for (const obj of objects.values()) {
    if (/\/Type\s*\/Page\b/.test(obj.dictRaw) && !/\/Type\s*\/Pages\b/.test(obj.dictRaw)) {
      pages.push(obj);
    }
  }

  const chunks: string[] = [];
  for (const page of pages) {
    // Fonts de la page
    const fonts = new Map<string, ToUnicodeMap | null>();
    for (const match of page.dictRaw.matchAll(/\/([A-Za-z0-9#_.-]+)\s+(\d+)\s+\d+\s+R/g)) {
      const fontObj = objects.get(Number(match[2]));
      if (fontObj) {
        const cmapMatch = /\/ToUnicode\s+(\d+)\s+\d+\s+R/.exec(fontObj.dictRaw);
        if (cmapMatch) {
          const cmapObj = objects.get(Number(cmapMatch[1]));
          if (cmapObj && cmapObj.stream) {
            const cmapText = decodeStream(cmapObj.dictRaw, cmapObj.stream);
            fonts.set(match[1]!, parseToUnicodeCmap(cmapText));
          }
        }
      }
    }

    // Contenu de la page
    const contentMatch = /\/Contents\s+(?:\[([^\]]*)\]|(\d+)\s+\d+\s+R)/.exec(page.dictRaw);
    if (contentMatch) {
      if (contentMatch[2]) {
        const streamObj = objects.get(Number(contentMatch[2]));
        if (streamObj && streamObj.stream) {
          const decoded = decodeStream(streamObj.dictRaw, streamObj.stream);
          chunks.push(extractTextFromContent(decoded, fonts));
        }
      } else if (contentMatch[1]) {
        for (const entry of contentMatch[1].matchAll(/(\d+)\s+\d+\s+R/g)) {
          const streamObj = objects.get(Number(entry[1]));
          if (streamObj && streamObj.stream) {
            const decoded = decodeStream(streamObj.dictRaw, streamObj.stream);
            chunks.push(extractTextFromContent(decoded, fonts));
          }
        }
      }
    }
  }

  // Si aucune page explicite n'a fourni de texte, analyser tous les flux décompressés contenant BT ... ET
  if (chunks.length === 0 || chunks.join('').trim().length === 0) {
    for (const obj of objects.values()) {
      if (obj.stream) {
        const decoded = decodeStream(obj.dictRaw, obj.stream);
        if (decoded.includes('BT') && decoded.includes('ET')) {
          chunks.push(extractTextFromContent(decoded, new Map()));
        }
      }
    }
  }

  const fullText = chunks
    .join('\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');

  return {
    text: fullText,
    hasText: fullText.length > 0,
    pageCount: Math.max(1, pages.length),
  };
}

/**
 * Convertit le texte brut extrait en lignes CSV séparées par des points-virgules.
 */
export function convertExtractedTextToSquadCsv(text: string): {
  csv: string;
  rowCount: number;
} {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { csv: '', rowCount: 0 };
  }

  // Expression régulière pour repérer un numéro de licence (6 à 12 chiffres ou majuscules)
  const licenseRegex = /\b(\d{6,11})\b/;
  const dateRegex = /\b(\d{2}[/.-]\d{2}[/.-]\d{2,4})\b/;

  const rows: Array<{
    license: string;
    nom: string;
    prenom: string;
    category: string;
    medical: string;
    birthDate: string;
  }> = [];

  for (const line of lines) {
    // Si la ligne contient un point-virgule ou une tabulation, la scinder
    if (line.includes(';') || line.includes('\t')) {
      const parts = line.split(/[;\t]/).map((p) => p.trim());
      if (parts.length >= 2) {
        const lic = parts.find((p) => licenseRegex.test(p)) || '';
        const date = parts.find((p) => dateRegex.test(p)) || '';
        const names = parts.filter((p) => p !== lic && p !== date && p.length > 1);
        if (names.length >= 1) {
          rows.push({
            license: lic,
            nom: names[0] || '',
            prenom: names[1] || '',
            category: parts.find((p) => /U\d+|Senior|Vétéran|Féminine/i.test(p)) || '',
            medical: parts.some((p) => /valide|apte|ok/i.test(p)) ? 'Valide' : '',
            birthDate: date,
          });
          continue;
        }
      }
    }

    // Analyse textuelle par espacements multiples
    const tokens = line.split(/\s{2,}|\s+/).map((t) => t.trim()).filter(Boolean);
    const licMatch = line.match(licenseRegex);
    const dateMatch = line.match(dateRegex);

    if (licMatch) {
      const lic = licMatch[1];
      const remainingTokens = tokens.filter((t) => t !== lic && t !== (dateMatch ? dateMatch[1] : ''));
      if (remainingTokens.length >= 2) {
        rows.push({
          license: lic,
          nom: remainingTokens[0] || '',
          prenom: remainingTokens[1] || '',
          category: remainingTokens.find((t) => /U\d+|Senior|Vétéran/i.test(t)) || '',
          medical: line.toLowerCase().includes('apte') || line.toLowerCase().includes('valide') ? 'Valide' : '',
          birthDate: dateMatch ? dateMatch[1] : '',
        });
      }
    }
  }

  if (rows.length === 0) {
    // Repli de découpage direct si aucune licence stricte n'a été détectée mais qu'il y a des noms
    const header = 'N° Licence;Nom;Prénom;Catégorie;Statut médical;Date de naissance';
    return { csv: '', rowCount: 0 };
  }

  const csvLines = [
    'N° Licence;Nom;Prénom;Catégorie;Statut médical;Date de naissance',
    ...rows.map(
      (r) => `${r.license};${r.nom};${r.prenom};${r.category};${r.medical};${r.birthDate}`,
    ),
  ];

  return {
    csv: csvLines.join('\n'),
    rowCount: rows.length,
  };
}
