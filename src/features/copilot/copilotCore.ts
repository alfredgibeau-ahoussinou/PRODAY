/**
 * Noyau pur du Copilote ProDay — aucune dépendance React, réseau ou stockage.
 *
 * Tout ce qui décide du comportement observable est ici, donc testable :
 *   - le modèle de conversation et sa **portée** (compte + club + rôle + pôle) ;
 *   - les **états de message** réels (`pending` → `complete` | `stopped` | `failed`) ;
 *   - le **découpage en blocs** des réponses (paragraphes, listes, tableaux, code, liens) ;
 *   - la distinction **conseil / brouillon / action**, et ce qui exige une confirmation.
 *
 * Règle d'honnêteté encodée ici plutôt que laissée à la vigilance de l'écran : une action
 * n'est rapportée comme réussie que si l'appel a réellement abouti (`resolveActionOutcome`),
 * et `findUnconfirmedSuccessClaims` permet aux tests d'interdire toute copie qui annonce
 * « envoyé / publié / enregistré » sans exécution préalable.
 */

export type CopilotRole = 'assistant' | 'user';

/** Les trois pôles qui exposent le copilote. Sert à cloisonner l'historique. */
export type CopilotPole = 'club' | 'coach' | 'player' | 'president';

export type CopilotMessageStatus = 'pending' | 'complete' | 'stopped' | 'failed';

export type CopilotMessage = {
  id: string;
  role: CopilotRole;
  content: string;
  status: CopilotMessageStatus;
  /** Renseigné quand l'appel au modèle a échoué : le motif réel, jamais un texte de remplacement. */
  error?: string;
  /** Moment de l'échec — base du délai d'attente avant un nouvel essai. */
  failedAt?: number;
  /** Agents serveur ayant contribué (information, pas décoration). */
  agents?: string[];
  /** Identifiant du modèle ayant répondu, tel que rapporté par le serveur. */
  model?: string;
  createdAt: number;
};

export type CopilotConversation = {
  id: string;
  /** Portée de cloisonnement : l'historique n'est jamais partagé entre deux portées. */
  scopeKey: string;
  title: string;
  messages: CopilotMessage[];
  createdAt: number;
  updatedAt: number;
};

/** Contexte actif affiché à l'utilisateur et envoyé au service. */
export type CopilotContextRef = {
  uid: string;
  role: CopilotRole | string;
  pole: CopilotPole;
  clubId?: string;
  clubName?: string;
  teamId?: string;
  teamName?: string;
};

export const COPILOT_SCHEMA_VERSION = 1;
export const MAX_CONVERSATIONS_PER_SCOPE = 30;
export const MAX_TITLE_CHARS = 48;

/**
 * Clé de portée. **C'est la seule protection d'isolation côté client** : changer de club
 * ou de rôle produit une clé différente, donc un historique différent. Un changement de
 * rôle dans le même club (coach → dirigeant) change aussi la clé, ce qui empêche de
 * réutiliser un contexte restreint (exigence « re-evaluate permissions »).
 */
export function copilotScopeKey(ref: CopilotContextRef): string {
  const uid = ref.uid.trim() || 'anon';
  const club = (ref.clubId ?? '').trim() || 'noclub';
  const role = String(ref.role ?? '').trim() || 'norole';
  return `${COPILOT_SCHEMA_VERSION}:${ref.pole}:${uid}:${club}:${role}`.toLowerCase();
}

let idCounter = 0;

/** Identifiant local déterministe dans une session, sans dépendance à `crypto`. */
export function makeCopilotId(prefix: string, at: number = Date.now()): string {
  idCounter = (idCounter + 1) % 100000;
  return `${prefix}-${at.toString(36)}-${idCounter.toString(36)}`;
}

/**
 * Titre lisible dérivé du premier message de l'utilisateur.
 * Retourne `null` si aucun message utilisateur exploitable n'existe : l'appelant décide
 * alors de garder un libellé neutre plutôt que d'inventer un sujet.
 */
export function deriveConversationTitle(messages: CopilotMessage[]): string | null {
  const first = messages.find((m) => m.role === 'user' && m.content.trim().length > 0);
  if (!first) return null;
  const line = first.content
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!line) return null;
  const clean = line.replace(/^[#>*\s•\-–—]+/, '').replace(/\*\*/g, '').trim();
  if (!clean) return null;
  if (clean.length <= MAX_TITLE_CHARS) return clean;
  const cut = clean.slice(0, MAX_TITLE_CHARS);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 24 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function createConversation(scopeKey: string, at: number = Date.now()): CopilotConversation {
  return {
    id: makeCopilotId('conv', at),
    scopeKey,
    title: 'Nouvelle conversation',
    messages: [],
    createdAt: at,
    updatedAt: at,
  };
}

export function appendMessage(
  conv: CopilotConversation,
  message: CopilotMessage,
): CopilotConversation {
  const messages = [...conv.messages, message];
  const derived = deriveConversationTitle(messages);
  return {
    ...conv,
    messages,
    title: derived ?? conv.title,
    updatedAt: message.createdAt,
  };
}

export function makeUserMessage(content: string, at: number = Date.now()): CopilotMessage {
  return {
    id: makeCopilotId('u', at),
    role: 'user',
    content: content.trim(),
    status: 'complete',
    createdAt: at,
  };
}

export function makePendingAssistantMessage(at: number = Date.now()): CopilotMessage {
  return {
    id: makeCopilotId('a', at),
    role: 'assistant',
    content: '',
    status: 'pending',
    createdAt: at,
  };
}

export function replaceMessage(
  conv: CopilotConversation,
  id: string,
  patch: Partial<CopilotMessage>,
): CopilotConversation {
  let touched = false;
  const messages = conv.messages.map((m) => {
    if (m.id !== id) return m;
    touched = true;
    return { ...m, ...patch };
  });
  if (!touched) return conv;
  return { ...conv, messages, updatedAt: Date.now() };
}

/** Un message assistant n'est « en cours » que dans cet état précis. */
export function isGenerating(conv: CopilotConversation | null): boolean {
  if (!conv) return false;
  return conv.messages.some((m) => m.role === 'assistant' && m.status === 'pending');
}

/** L'historique envoyé au modèle : uniquement les tours complets, jamais un échec ni un arrêt. */
export function historyForRequest(conv: CopilotConversation): { role: CopilotRole; content: string }[] {
  return conv.messages
    .filter((m) => m.status === 'complete' && m.content.trim().length > 0)
    .map((m) => ({ role: m.role, content: m.content }));
}

/** Message utilisateur précédant immédiatement un message donné (pour « Réessayer »). */
export function previousUserMessage(
  conv: CopilotConversation,
  messageId: string,
): CopilotMessage | null {
  const idx = conv.messages.findIndex((m) => m.id === messageId);
  if (idx < 0) return null;
  for (let i = idx - 1; i >= 0; i -= 1) {
    const m = conv.messages[i];
    if (m && m.role === 'user') return m;
  }
  return null;
}

/**
 * Déroule un « Réessayer » **sans dupliquer la question**.
 *
 * Le comportement antérieur reprenait la conversation telle quelle et ré-ajoutait
 * la question à la fin : chaque clic empilait une bulle identique et une nouvelle
 * carte d'erreur — exactement la boucle observée sur un 429. La replanification
 * ampute d'abord la réponse à rejouer, puis indique à l'appelant si la question
 * est déjà la dernière du fil (cas normal : échec en fin de tour) pour qu'il la
 * réutilise au lieu de la réécrire.
 */
export type CopilotRetryPlan = {
  /** Conversation amputée de la réponse à rejouer. */
  conv: CopilotConversation;
  userText: string;
  /** Vrai quand la question est déjà la dernière du fil : ne pas la dupliquer. */
  reuseLastUser: boolean;
};

export function conversationForRetry(
  conv: CopilotConversation,
  assistantMessageId: string,
): CopilotRetryPlan | null {
  const targetIndex = conv.messages.findIndex((m) => m.id === assistantMessageId);
  if (targetIndex < 0) return null;
  const target = conv.messages[targetIndex];
  if (!target || target.role !== 'assistant') return null;
  /** Un tour en cours ne se relance pas : il se stoppe d'abord. */
  if (target.status === 'pending') return null;
  const prior = previousUserMessage(conv, assistantMessageId);
  if (!prior) return null;

  /**
   * On rembobine **jusqu'à la question** : la réponse à rejouer disparaît, ainsi
   * que les échecs empilés entre la question et elle (dégâts de l'ancien bug
   * persistés localement). Sans ce nettoyage, reprendre le dernier échec d'une
   * pile aurait laissé un échec plus ancien en fin de fil — et la question
   * aurait de nouveau été dupliquée pour le rejouer.
   */
  const priorIndex = conv.messages.findIndex((m) => m.id === prior.id);
  const messages = conv.messages.filter((m, index) => {
    if (m.id === target.id) return false;
    if (index > priorIndex && index < targetIndex) {
      return !(m.role === 'assistant' && m.status === 'failed');
    }
    return true;
  });
  const last = messages[messages.length - 1];
  return {
    conv: { ...conv, messages },
    userText: prior.content,
    /** Vrai quand la question est déjà la dernière du fil : ne pas la dupliquer. */
    reuseLastUser: last?.id === prior.id,
  };
}

/* ------------------------------------------------------------------ *
 * Découpage en blocs
 * ------------------------------------------------------------------ */

export type CopilotInlineSpan = {
  text: string;
  bold?: boolean;
  code?: boolean;
  /** Lien : `href` non vide. Les URL sont conservées telles quelles, jamais exécutées. */
  href?: string;
};

export type CopilotBlock =
  | { kind: 'heading'; level: 2 | 3; spans: CopilotInlineSpan[] }
  | { kind: 'paragraph'; spans: CopilotInlineSpan[] }
  | { kind: 'bullets'; items: CopilotInlineSpan[][] }
  | { kind: 'ordered'; items: CopilotInlineSpan[][] }
  | { kind: 'quote'; spans: CopilotInlineSpan[] }
  | { kind: 'code'; language: string; code: string }
  | { kind: 'table'; headers: CopilotInlineSpan[][]; rows: CopilotInlineSpan[][][] }
  | { kind: 'divider' };

const ORDERED_RE = /^\s*(\d{1,2})[.)]\s+(.*)$/;
const BULLET_RE = /^\s*([•▪·*\-–]|\u2022)\s+(.*)$/;
const HEADING_RE = /^\s*(#{2,4})\s+(.*)$/;
const TABLE_ROW_RE = /^\s*\|(.+)\|\s*$/;
const TABLE_SEP_RE = /^\s*\|?[\s:|-]+\|[\s:|-]*$/;

/** Découpe une ligne en segments gras / code / liens. Purement textuel — aucune exécution. */
export function parseInline(raw: string): CopilotInlineSpan[] {
  const spans: CopilotInlineSpan[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^\s)]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw)) !== null) {
    if (match.index > last) {
      spans.push({ text: raw.slice(last, match.index) });
    }
    const token = match[0];
    if (token.startsWith('**')) {
      spans.push({ text: token.slice(2, -2), bold: true });
    } else if (token.startsWith('`')) {
      spans.push({ text: token.slice(1, -1), code: true });
    } else {
      const label = token.slice(1, token.indexOf(']'));
      // Groupe 2 = la cible http(s) ; le groupe 1 est l'alternation entière.
      spans.push({ text: label, href: match[2] ?? '' });
    }
    last = match.index + token.length;
  }
  if (last < raw.length) spans.push({ text: raw.slice(last) });
  return spans.filter((s) => s.text.length > 0);
}

function splitRow(line: string): string[] {
  const inner = line.replace(TABLE_ROW_RE, '$1');
  return inner.split('|').map((c) => c.trim());
}

/**
 * Convertit une réponse du modèle en blocs d'affichage. Tolérant : les tirets
 * typographiques et les `•` déjà utilisés par les réponses serveur sont reconnus comme listes.
 */
export function parseCopilotBlocks(text: string): CopilotBlock[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const blocks: CopilotBlock[] = [];
  let i = 0;

  const flushParagraph = (buffer: string[]) => {
    const joined = buffer.join(' ').trim();
    if (joined) blocks.push({ kind: 'paragraph', spans: parseInline(joined) });
  };

  let paragraph: string[] = [];

  while (i < lines.length) {
    const line = lines[i] ?? '';
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph(paragraph);
      paragraph = [];
      i += 1;
      continue;
    }

    // Bloc de code clôturé par ```
    if (trimmed.startsWith('```')) {
      flushParagraph(paragraph);
      paragraph = [];
      const language = trimmed.slice(3).trim();
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !(lines[i] ?? '').trim().startsWith('```')) {
        body.push(lines[i] ?? '');
        i += 1;
      }
      i += 1; // consomme la fermeture
      blocks.push({ kind: 'code', language, code: body.join('\n') });
      continue;
    }

    if (/^\s*([-–—_*]\s*){3,}$/.test(trimmed)) {
      flushParagraph(paragraph);
      paragraph = [];
      blocks.push({ kind: 'divider' });
      i += 1;
      continue;
    }

    const heading = HEADING_RE.exec(line);
    if (heading) {
      flushParagraph(paragraph);
      paragraph = [];
      const level = (heading[1] ?? '##').length <= 3 ? 2 : 3;
      blocks.push({ kind: 'heading', level, spans: parseInline(heading[2] ?? '') });
      i += 1;
      continue;
    }

    // Tableau : ligne d'en-tête suivie d'un séparateur
    if (TABLE_ROW_RE.test(line) && i + 1 < lines.length && TABLE_SEP_RE.test(lines[i + 1] ?? '')) {
      flushParagraph(paragraph);
      paragraph = [];
      const headers = splitRow(line).map(parseInline);
      i += 2;
      const rows: CopilotInlineSpan[][][] = [];
      while (i < lines.length && TABLE_ROW_RE.test(lines[i] ?? '')) {
        rows.push(splitRow(lines[i] ?? '').map(parseInline));
        i += 1;
      }
      blocks.push({ kind: 'table', headers, rows });
      continue;
    }

    if (BULLET_RE.test(line)) {
      flushParagraph(paragraph);
      paragraph = [];
      const items: CopilotInlineSpan[][] = [];
      while (i < lines.length) {
        const current = lines[i] ?? '';
        const m = BULLET_RE.exec(current);
        if (!m) break;
        items.push(parseInline(m[2] ?? ''));
        i += 1;
        // ligne de continuation indentée rattachée à l'item
        while (i < lines.length && /^\s{2,}\S/.test(lines[i] ?? '') && !BULLET_RE.test(lines[i] ?? '')) {
          const cont = (lines[i] ?? '').trim();
          const prev = items[items.length - 1];
          if (prev) items[items.length - 1] = [...prev, ...parseInline(` ${cont}`)];
          i += 1;
        }
      }
      if (items.length > 0) blocks.push({ kind: 'bullets', items });
      continue;
    }

    if (ORDERED_RE.test(line)) {
      flushParagraph(paragraph);
      paragraph = [];
      const items: CopilotInlineSpan[][] = [];
      while (i < lines.length) {
        const m = ORDERED_RE.exec(lines[i] ?? '');
        if (!m) break;
        items.push(parseInline(m[2] ?? ''));
        i += 1;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i] ?? '') && !ORDERED_RE.test(lines[i] ?? '')) {
          const cont = (lines[i] ?? '').trim();
          const prev = items[items.length - 1];
          if (prev) items[items.length - 1] = [...prev, ...parseInline(` ${cont}`)];
          i += 1;
        }
      }
      if (items.length > 0) blocks.push({ kind: 'ordered', items });
      continue;
    }

    if (trimmed.startsWith('>')) {
      flushParagraph(paragraph);
      paragraph = [];
      blocks.push({ kind: 'quote', spans: parseInline(trimmed.replace(/^>\s?/, '')) });
      i += 1;
      continue;
    }

    paragraph.push(trimmed);
    i += 1;
  }

  flushParagraph(paragraph);
  return blocks;
}

/* ------------------------------------------------------------------ *
 * Conseil / brouillon / action
 * ------------------------------------------------------------------ */

/**
 * `advice` = information. `draft` = contenu préparé, modifiable, **sans effet de bord**.
 * `action` = opération à effet de bord, qui exige une confirmation explicite.
 */
export type CopilotActionKind = 'advice' | 'draft' | 'action';

export type CopilotAction = {
  id: string;
  kind: CopilotActionKind;
  label: string;
  /** Effet de bord nommé, affiché tel quel avant confirmation (jamais formulé en succès). */
  effect?: string;
  requiresConfirmation: boolean;
};

/** Une action à effet de bord exige toujours une confirmation, quelle que soit sa forme. */
export function requiresConfirmation(kind: CopilotActionKind): boolean {
  return kind === 'action';
}

export function normalizeAction(input: {
  id: string;
  kind: CopilotActionKind;
  label: string;
  effect?: string;
}): CopilotAction {
  return {
    id: input.id,
    kind: input.kind,
    label: input.label,
    effect: input.effect,
    requiresConfirmation: requiresConfirmation(input.kind),
  };
}

export type ActionOutcome =
  | { state: 'idle' }
  | { state: 'running' }
  | { state: 'done'; detail: string }
  | { state: 'failed'; reason: string };

/**
 * Phrase affichée après une action. **Seul un `done` produit une affirmation de succès**, et
 * il n'existe que si l'appel a abouti. `running` et `failed` ne disent jamais « c'est fait ».
 */
export function describeActionOutcome(outcome: ActionOutcome, label: string): string {
  switch (outcome.state) {
    case 'running':
      return `${label} : en cours…`;
    case 'done':
      return `${label} : terminé (${outcome.detail}).`;
    case 'failed':
      return `${label} : échec. ${outcome.reason}`;
    default:
      return `${label} : en attente de confirmation.`;
  }
}

/**
 * Bornes construites à la main : `\b` ne reconnaît pas les caractères accentués comme
 * lettres, donc `\benvoyé\b` ne matcherait jamais. Classes explicites, sans lookbehind
 * (Hermes ne le supporte pas de façon fiable).
 */
const NON_LETTER = 'A-Za-z\u00C0-\u017F';
const SUCCESS_CLAIM_RE = new RegExp(
  `(?:^|[^${NON_LETTER}])(${[
    'envoyé', 'envoyée', 'envoyés', 'envoyées',
    'publié', 'publiée', 'publiés', 'publiées',
    'enregistré', 'enregistrée', 'enregistrés', 'enregistrées',
    'sauvegardé', 'sauvegardée', 'sauvegardés', 'sauvegardées',
    'mis à jour',
    'créé', 'créée', 'créés', 'créées',
    'supprimé', 'supprimée', 'supprimés', 'supprimées',
    'planifié', 'planifiée', 'planifiés', 'planifiées',
  ].join('|')})(?![${NON_LETTER}])`,
  'gi',
);

/**
 * Repère les affirmations de succès au passé. Utilisé par les tests pour interdire qu'une
 * copie statique annonce une opération sans qu'elle ait été exécutée — un faux « envoyé »
 * est exactement ce que le protocole interdit.
 */
export function findUnconfirmedSuccessClaims(text: string): string[] {
  const out: string[] = [];
  SUCCESS_CLAIM_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SUCCESS_CLAIM_RE.exec(text)) !== null) {
    if (m[1]) out.push(m[1].toLowerCase());
    if (m.index === SUCCESS_CLAIM_RE.lastIndex) SUCCESS_CLAIM_RE.lastIndex += 1;
  }
  return out;
}

/** Combien de tours « utiles » une conversation contient (hors accueil vide). */
export function conversationTurnCount(conv: CopilotConversation): number {
  return conv.messages.filter((m) => m.role === 'user').length;
}

/** Trie du plus récent au plus ancien, pour l'historique. */
export function sortConversations(list: CopilotConversation[]): CopilotConversation[] {
  return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Ajoute une conversation et élague au-delà de la limite de portée. */
export function upsertConversation(
  list: CopilotConversation[],
  conv: CopilotConversation,
): CopilotConversation[] {
  const others = list.filter((c) => c.id !== conv.id);
  return sortConversations([conv, ...others]).slice(0, MAX_CONVERSATIONS_PER_SCOPE);
}

/** Une conversation vide n'a aucune valeur : on ne la persiste pas. */
export function isPersistable(conv: CopilotConversation): boolean {
  return conv.messages.some((m) => m.content.trim().length > 0);
}

/* ------------------------------------------------------------------ *
 * Historique : recherche et regroupement
 * ------------------------------------------------------------------ */

/**
 * Recherche dans l'historique **de la portée courante**.
 *
 * Elle porte sur le titre et le texte des messages, sans accents ni casse, parce qu'un
 * utilisateur cherche « cotisation » aussi bien que « cotisâtion ». Elle ne sort jamais de la
 * liste reçue : aucune conversation d'une autre portée ne peut apparaître, même si le filtre
 * était mal appliqué en amont.
 */
export function filterConversations(
  list: CopilotConversation[],
  query: string,
): CopilotConversation[] {
  const q = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  if (!q) return list;
  return list.filter((conv) => {
    const haystack = `${conv.title}\n${conv.messages.map((m) => m.content).join('\n')}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return haystack.includes(q);
  });
}

export type CopilotHistoryGroup = {
  /** Libellé de section affiché tel quel : « Aujourd'hui », « Hier », « 12 septembre ». */
  label: string;
  conversations: CopilotConversation[];
};

const MONTHS_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Regroupe l'historique par jour, du plus récent au plus ancien.
 *
 * Les libellés sont relatifs pour les deux premiers jours (« Aujourd'hui », « Hier ») puis
 * absolus. Un groupe ne contient jamais de conversation d'un autre jour, donc l'ordre relatif
 * à l'intérieur d'un groupe est `sortConversations` — celui de l'API, pas un tri refait ici.
 */
export function groupConversationsByDay(
  list: CopilotConversation[],
  now: number = Date.now(),
): CopilotHistoryGroup[] {
  const today = startOfDay(now);
  const dayMs = 86_400_000;
  const groups: CopilotHistoryGroup[] = [];
  const index = new Map<number, CopilotHistoryGroup>();

  for (const conv of sortConversations(list)) {
    const day = startOfDay(conv.updatedAt);
    let group = index.get(day);
    if (!group) {
      const offset = Math.round((today - day) / dayMs);
      const d = new Date(day);
      const label =
        offset <= 0
          ? "Aujourd'hui"
          : offset === 1
            ? 'Hier'
            : `${d.getDate()} ${MONTHS_FR[d.getMonth()]}${d.getFullYear() !== new Date(now).getFullYear() ? ` ${d.getFullYear()}` : ''}`;
      group = { label, conversations: [] };
      index.set(day, group);
      groups.push(group);
    }
    group.conversations.push(conv);
  }

  return groups;
}

/**
 * Aperçu d'une conversation dans la liste : la **dernière** question, tronquée.
 *
 * Ce n'est délibérément pas la première : le titre est déjà dérivé du premier message
 * (`deriveConversationTitle`), donc répéter celui-ci ajouterait une ligne qui ne dit rien de
 * plus. La dernière question, elle, répond à « où en étais-je ? ».
 *
 * Une conversation à un seul tour n'a donc pas d'aperçu : son titre le dit déjà entièrement.
 */
export function conversationExcerpt(conv: CopilotConversation, maxChars = 72): string | null {
  const userMessages = conv.messages.filter(
    (m) => m.role === 'user' && m.content.trim().length > 0,
  );
  if (userMessages.length < 2) return null;
  const text = userMessages[userMessages.length - 1]!.content.replace(/\s+/g, ' ').trim();
  return text.length > maxChars ? `${text.slice(0, maxChars - 1).trimEnd()}…` : text;
}

/* ------------------------------------------------------------------ *
 * Erreurs du service
 * ------------------------------------------------------------------ */

/**
 * Traduit l'erreur brute du service en message exploitable.
 *
 * Constaté en conditions réelles : une réponse `429` remontait telle quelle à l'écran, sous la
 * forme `Mistral API error (429): {"object":"error",...}`. C'est à la fois illisible, inutile
 * pour l'utilisateur, et contraire à la règle du projet qui veut que le nom du fournisseur ne
 * soit pas exposé dans l'interface (`softAiProviderLabel`). On nomme donc la cause réelle, et
 * on indique quoi faire.
 */
export type CopilotErrorKind =
  | 'rate_limit'
  | 'quota'
  | 'unauthorized'
  | 'not_configured'
  | 'timeout'
  | 'network'
  | 'unknown';

export function classifyCopilotError(raw: string): CopilotErrorKind {
  const s = (raw || '').toLowerCase();
  if (/429|rate limit|rate_limited|too many requests/.test(s)) return 'rate_limit';
  if (/quota|resource-exhausted|billing/.test(s)) return 'quota';
  if (/401|403|unauthenticated|permission-denied|permission denied|invalid api key|api key not valid/.test(s))
    return 'unauthorized';
  if (/failed-precondition|not configured|non configur|missing.*key|cle.*manquante/.test(s))
    return 'not_configured';
  if (/timeout|deadline/.test(s)) return 'timeout';
  if (/network|offline|unreachable|failed to fetch|erreur reseau|erreur réseau/.test(s)) return 'network';
  return 'unknown';
}

/**
 * Délai d'attente avant de rejouer un échec de **limite de débit**.
 *
 * Constaté en conditions réelles : après un 429, un « Réessayer » immédiat
 * reproduisait le refus à l'identique — le limiteur du fournisseur ne s'était pas
 * rouvert. Le bouton reste visible mais affiche le délai restant, ce qui oriente
 * l'attente au lieu de laisser croire qu'un spam de clics finira par passer.
 */
export const COPILOT_RATE_LIMIT_COOLDOWN_MS = 30_000;

/** Millisecondes restantes avant qu'un « Réessayer » ne soit permis (0 = immédiat). */
export function copilotRetryDelay(
  message:
    | (Pick<CopilotMessage, 'status' | 'error' | 'createdAt'> & Partial<Pick<CopilotMessage, 'failedAt'>>)
    | null
    | undefined,
  now: number,
): number {
  if (!message || message.status !== 'failed' || !message.error) return 0;
  if (classifyCopilotError(message.error) !== 'rate_limit') return 0;
  const failedAt = message.failedAt ?? message.createdAt;
  const remaining = COPILOT_RATE_LIMIT_COOLDOWN_MS - (now - failedAt);
  return remaining > 0 ? remaining : 0;
}

export function humanizeCopilotError(raw: string): string {
  const kind = classifyCopilotError(raw);
  switch (kind) {
    case 'rate_limit':
      return 'Le service de génération a refusé la requête : limite de débit atteinte (429). Réessayez dans un instant.';
    case 'quota':
      return 'Quota du service de génération épuisé. Il doit être rechargé côté serveur avant que le Copilote ne puisse répondre.';
    case 'unauthorized':
      return 'Le service de génération a refusé l’authentification. La clé configurée côté serveur est invalide ou expirée.';
    case 'not_configured':
      return 'Copilote non configuré côté serveur : aucune clé de modèle n’est disponible pour ce projet.';
    case 'timeout':
      return 'Le service de génération n’a pas répondu dans le délai imparti. Réessayez.';
    case 'network':
      return 'Service de génération injoignable depuis cet appareil. Vérifiez la connexion puis réessayez.';
    default: {
      // Message inconnu : on retire le JSON brut et les noms de fournisseurs avant affichage.
      const cleaned = raw
        .replace(/\{[\s\S]*\}/g, ' ')
        .replace(/\b(?:mistral|gemini|google|openai|anthropic|claude)\b/gi, 'le service de génération')
        .replace(/\s{2,}/g, ' ')
        .trim();
      return cleaned.length > 0
        ? cleaned
        : 'Le service de génération a échoué sans message exploitable.';
    }
  }
}
