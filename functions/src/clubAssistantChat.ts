import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import {
  generateAiChatCompletion,
  getGeminiApiKey,
  getMistralApiKey,
} from './aiProvider';

const db = admin.firestore();
const MAX_HISTORY = 16;
const MAX_USER_CHARS = 1200;
const MAX_REPLY_CHARS = 2200;

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

async function buildClubContext(uid: string, clubId: string): Promise<string> {
  const [clubSnap, teamsSnap, membershipsSnap] = await Promise.all([
    db.doc(`clubs/${clubId}`).get(),
    db.collection('teams').where('club_id', '==', clubId).limit(40).get(),
    db.collection('memberships').where('club_id', '==', clubId).limit(80).get(),
  ]);

  const club = clubSnap.data() ?? {};
  const clubName = String(club.name ?? 'Club');
  const teams = teamsSnap.docs.map((d) => d.data());
  const memberships = membershipsSnap.docs.map((d) => d.data());
  const pending = memberships.filter((m) => m.status === 'pending').length;
  const players = memberships.filter((m) => m.status === 'approved' || m.status === 'active').length;
  const withoutCoach = teams.filter((t) => !Array.isArray(t.coach_uids) || t.coach_uids.length === 0)
    .length;
  const teamLabels = teams
    .slice(0, 12)
    .map((t) => String(t.name ?? t.category ?? 'Équipe'))
    .join(', ');

  const userSnap = await db.doc(`users/${uid}`).get();
  const user = userSnap.data() ?? {};
  const plan = String(user.subscription_plan_id ?? 'none');
  const tier = String(user.subscription_tier ?? 'free');

  return [
    `Club: ${clubName} (id=${clubId})`,
    `Abonnement compte: tier=${tier}, plan=${plan}`,
    `Équipes: ${teams.length}${teamLabels ? ` (${teamLabels})` : ''}`,
    `Licenciés / membres listés: ${players}`,
    `Adhésions en attente: ${pending}`,
    `Équipes sans coach: ${withoutCoach}`,
    `Navigation app: dossiers Accueil (Aujourd’hui, Assistant IA, Terrain), Organisation (Structure, Vivier, Pipeline), Sport (Calendrier, Invitations, Tournois), Communication, Ressources (Offres, Covoiturage, Vidéo…).`,
    `Formules: Amateur, Essentiel, Tout inclus, Pro + Veo. Tournois dès Essentiel. Vidéo / IA avancée dès Tout inclus.`,
  ].join('\n');
}

/**
 * Interdit définitivement les tirets typographiques et listes « - » dans les réponses.
 * Conserve les traits d’union dans les mots (ex. peut-être).
 * (Miroir de src/utils/stripDashTypography.ts — garder synchronisé.)
 */
export function stripDashTypography(text: string): string {
  return text
    .replace(/\u2014/g, ',') // —
    .replace(/\u2013/g, ',') // –
    .replace(/^\s*[-–—•*]\s+/gm, '')
    .replace(/\s+-\s+/g, ', ')
    .replace(/\s*,\s*,+/g, ',')
    .replace(/\s+([.!?])/g, '$1')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Chat copilote Club — Mistral (vrai dialogue, pas FAQ).
 * Auth club requise. Contexte roster chargé côté serveur.
 */
export const clubAssistantChat = onCall(
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
    const geminiKey = getGeminiApiKey();
    const mistralKey = getMistralApiKey();
    if (!geminiKey && !mistralKey) {
      throw new HttpsError(
        'failed-precondition',
        'Assistant IA non configuré (clé GEMINI_API_KEY ou MISTRAL_API_KEY manquante côté serveur).',
      );
    }

    const userSnap = await db.doc(`users/${uid}`).get();
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Profil introuvable.');
    }
    const user = userSnap.data()!;
    if (user.role !== 'club') {
      throw new HttpsError('permission-denied', 'Réservé aux comptes Club.');
    }

    const profile = (user.profile as Record<string, unknown> | undefined) ?? {};
    const clubId = String(profile.club_id ?? uid);
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
      contextBlock = await buildClubContext(uid, clubId);
    } catch (error) {
      console.warn('[clubAssistantChat] context', error);
      contextBlock = `Club id=${clubId} (contexte partiel).`;
    }

    const system = `Tu es le Copilote IA Dirigeant ProDay, propulsé par Google Gemini (modèle Gemini Flash Lite). Tu parles à un dirigeant ou président de club, comme un collègue compétent, pas comme un manuel.
Si on te demande quelle IA tu es ou qui t'a conçu, réponds clairement que tu es Google Gemini intégré dans ProDay Club. Tu n'es ni Meta, ni Mistral, ni ChatGPT.

Style d’écriture (obligatoire) :
Interdiction absolue et permanente d’utiliser des tirets : ni -, ni –, ni —, ni puces « - item ». Jamais de listes à tirets. Écris uniquement des phrases ou des phrases numérotées (1. 2. 3.) si une énumération est vraiment utile.
Français naturel. Tutoiement ou vouvoiement selon l’utilisateur (par défaut tutoiement simple et direct).
Chaleureux, clair, concret. Phrases courtes. Pas de jargon robotique.
En général 2 à 5 phrases. Tu peux reformuler brièvement la question, puis proposer une ou deux prochaines actions.
Si tu cites un dossier de l’app (Structure, Vivier, Pipeline, Calendrier, Tournois, Offres, Vidéo…), dis-le en langage naturel (« ouvre Organisation puis Structure »).

Règles de vérité :
N’invente aucun chiffre hors du contexte fourni. Si une info manque, dis-le et propose comment la trouver dans l’app.
Ne promets pas de paiements, de caméra obligatoire, ni d’accès médical.
Tu n’es ni avocat ni médecin.

Contexte club (faits serveur) :
${contextBlock}`;

    const completion = await generateAiChatCompletion({
      systemPrompt: system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: 0.7,
      maxTokens: 1400,
      preferProvider: 'gemini',
    });

    const reply = stripDashTypography(completion.text).slice(0, MAX_REPLY_CHARS);

    return {
      reply,
      model: completion.model || 'gemini-3.5-flash-lite',
      clubId,
    };
  },
);
