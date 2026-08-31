import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { stripDashTypography } from './clubAssistantChat';
import { generateAiChatCompletion } from './aiProvider';

const db = admin.firestore();
const MAX_HISTORY = 16;
const MAX_USER_CHARS = 1200;
const MAX_REPLY_CHARS = 2400;

type ChatRole = 'user' | 'assistant';

type ChatMessageIn = {
  role: ChatRole;
  content: string;
};

function sanitizeMessages(raw: unknown): ChatMessageIn[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatMessageIn[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const role = (item as { role?: string }).role;
    const content = String((item as { content?: string }).content ?? '').trim();
    if ((role !== 'user' && role !== 'assistant') || !content) continue;
    out.push({
      role,
      content: content.slice(0, MAX_USER_CHARS),
    });
    if (out.length >= MAX_HISTORY) break;
  }
  return out;
}

async function buildPlayerContext(uid: string): Promise<string> {
  const [userSnap, memberSnap, subSnap] = await Promise.all([
    db.doc(`users/${uid}`).get(),
    db.collection('memberships').where('user_id', '==', uid).limit(1).get(),
    db.doc(`subscriptions/${uid}`).get(),
  ]);

  const user = userSnap.data() ?? {};
  const profile = (user.profile as Record<string, unknown>) ?? {};
  const membership = memberSnap.docs[0]?.data();
  const sub = subSnap.data() ?? {};

  const name = user.display_name ?? 'Joueur';
  const role = user.role ?? 'player';
  const post = profile.position ?? profile.favorite_role ?? 'Non renseigné';
  const secondary = profile.secondary_position ?? 'Aucun';
  const age = profile.birth_year ? `${new Date().getFullYear() - Number(profile.birth_year)} ans` : 'Non renseigné';
  const preferredFoot = profile.preferred_foot ?? 'Droit';
  const level = profile.level ?? 'Amateur';
  const clubName = membership?.club_name ?? profile.club_name ?? 'Sans club';
  const tier = sub.tier ?? 'free';
  const plan = sub.plan ?? 'none';

  let nextMatchLine = 'Prochain match: non planifié';
  const matchSnap = await db
    .collection('team_events')
    .where('type', '==', 'match')
    .where('date', '>=', new Date())
    .orderBy('date', 'asc')
    .limit(1)
    .get()
    .catch(() => null);

  if (matchSnap && !matchSnap.empty) {
    const m = matchSnap.docs[0]?.data();
    if (m) {
      nextMatchLine = `Prochain match: vs ${m.opponent_name ?? 'Adversaire'} (${m.home_away ?? 'domicile'}) le ${m.date?.toDate?.()?.toLocaleDateString('fr-FR') ?? 'bientôt'}`;
    }
  }

  return [
    `Identité: ${name} (${role})`,
    `Poste principal: ${post}, Secondaire: ${secondary}`,
    `Pied fort: ${preferredFoot}, Âge: ${age}, Niveau: ${level}`,
    `Club: ${clubName}`,
    `Abonnement: tier=${tier}, plan=${plan}`,
    nextMatchLine,
    `App: onglets PLAY, MATCH, PERF (Smart Tactics), CARD. Coach IA = conseil tactique et amélioration individuelle.`,
  ].join('\n');
}

/**
 * Coach IA joueur — football + amélioration tactique (dialogue Gemini / Mistral).
 */
export const playerTacticsChat = onCall(
  {
    region: 'europe-west1',
    timeoutSeconds: 90,
    memory: '512MiB',
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Connexion requise.');
    }
    const uid = request.auth.uid;

    const userSnap = await db.doc(`users/${uid}`).get();
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Profil introuvable.');
    }
    const user = userSnap.data()!;
    if (user.role !== 'player') {
      throw new HttpsError('permission-denied', 'Réservé aux comptes Joueur.');
    }

    const messages = sanitizeMessages(request.data?.messages);
    if (messages.length === 0) {
      throw new HttpsError('invalid-argument', 'Aucun message.');
    }
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'user') {
      throw new HttpsError('invalid-argument', 'Le dernier message doit venir de l’utilisateur.');
    }

    let contextBlock = '';
    try {
      contextBlock = await buildPlayerContext(uid);
    } catch (error) {
      console.warn('[playerTacticsChat] context', error);
      contextBlock = `Joueur uid=${uid} (contexte partiel).`;
    }

    const system = `Tu es le Coach IA Pro Day, spécialiste football et tactique individuelle. Tu parles à un joueur ou une joueuse qui veut s’améliorer.

Mission :
Aider à comprendre le jeu (principes tactiques, rôles par poste, phases de jeu, pressing, transitions, set pieces).
Proposer des axes d’amélioration concrets et réalistes pour son poste.
Expliquer simplement des concepts (bloc bas / haut, largeur, profondeur, 1v1, couverture, timing de course…).
Donner des drills courts réalisables à la maison, au jardin ou en club (durée, consignes, critères de réussite).
Relier le conseil au prochain match ou au XI si le contexte le permet.

Style d’écriture (obligatoire) :
Interdiction absolue et permanente d’utiliser des tirets : ni -, ni –, ni —, ni puces « - item ». Jamais de listes à tirets. Écris uniquement des phrases ou des phrases numérotées (1. 2. 3.) si une énumération est vraiment utile.
Français naturel, tutoiement, ton coach motivant et précis. Phrases courtes.
En général 3 à 7 phrases. Une idée claire par réponse, puis 1 ou 2 actions concrètes.
Pas de jargon vide. Si tu utilises un terme tactique, explique-le en une phrase.

Règles de vérité :
N’invente aucun chiffre hors du contexte fourni. Si une info manque (poste, match, forme), pose une question courte.
Tu n’es ni médecin ni préparateur médical : pas de diagnostic blessure. Orienter vers repos / staff si douleur.
Ne remplace pas le coach de club : tu complètes, tu n’imposes pas un XI.

Contexte joueur (faits serveur) :
${contextBlock}`;

    let aiRes;
    try {
      aiRes = await generateAiChatCompletion({
        systemPrompt: system,
        messages,
        temperature: 0.65,
      });
    } catch (e: unknown) {
      console.error('[playerTacticsChat] AI error', e);
      throw new HttpsError(
        'internal',
        e instanceof Error ? e.message : 'Le Coach IA a échoué. Réessayez dans un instant.',
      );
    }

    const reply = stripDashTypography(aiRes.text.slice(0, MAX_REPLY_CHARS));

    return {
      reply,
      model: aiRes.model,
      provider: aiRes.provider,
    };
  },
);
