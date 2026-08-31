import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { generateAiChatCompletion } from './aiProvider';

const db = admin.firestore();

interface GenerateRequest {
  club_id: string;
  team_id?: string;
  objective: string;
  duration_min: number;
  level: string;
  player_count: number;
  coach_notes?: string;
}

async function assertCoachOrStaff(uid: string, clubId: string): Promise<void> {
  const snap = await db.doc(`users/${uid}`).get();
  if (!snap.exists) throw new HttpsError('permission-denied', 'Profil introuvable.');
  const user = snap.data() ?? {};
  const role = String(user.role ?? '');
  const profile = (user.profile as Record<string, unknown> | undefined) ?? {};
  const userClub = String(profile.club_id ?? user.club_id ?? '');
  const isStaff = ['coach', 'club', 'admin', 'staff'].includes(role) || Boolean(user.is_admin);
  if (!isStaff) throw new HttpsError('permission-denied', 'Réservé au staff coach / club.');
  if (userClub && userClub !== clubId && !user.is_admin) {
    throw new HttpsError('permission-denied', 'Club non autorisé.');
  }
}

const OBJECTIVE_LABELS: Record<string, string> = {
  technique: 'Technique individuelle et collective',
  physique: 'Préparation physique & intensité',
  tactique: 'Organisation tactique',
  recuperation: 'Récupération active',
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
};

export const generateTrainingSession = onCall(
  {
    region: 'europe-west1',
    timeoutSeconds: 60,
    memory: '512MiB',
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Connexion requise.');
    }

    const data = (request.data ?? {}) as GenerateRequest;
    const clubId = String(data.club_id ?? '').trim();
    if (!clubId) throw new HttpsError('invalid-argument', 'club_id requis.');

    await assertCoachOrStaff(request.auth.uid, clubId);

    const objective = OBJECTIVE_LABELS[data.objective] ?? data.objective ?? 'Technique';
    const level = LEVEL_LABELS[data.level] ?? data.level ?? 'Intermédiaire';
    const durationMin = Math.min(Math.max(Number(data.duration_min) || 90, 30), 120);
    const playerCount = Math.min(Math.max(Number(data.player_count) || 18, 4), 40);
    const coachNotes = data.coach_notes ? String(data.coach_notes).slice(0, 500) : '';

    const isBloodBath = /blood\s*bath|bain\s*de\s*sang|cardio\s*extreme|haute\s*intensite|commando|enfer/i.test(coachNotes);

    const systemPrompt = `Tu es un entraîneur de football professionnel d'élite (UEFA Pro).
Tu conçois des séances d'entraînement modernes, intenses et extrêmement précises.
Réponds UNIQUEMENT sous forme d'un objet JSON strict valide, sans balises de code Markdown ni texte autour.

Schéma attendu :
{
  "phases": [
    {
      "name": "warmup",
      "label": "1. Échauffement & Activation Dynamique",
      "duration_min": 15,
      "exercises": [
        {
          "name": "Nom de l'exercice",
          "description": "Description détaillée de l'atelier, des consignes et du déroulement.",
          "duration_min": 15,
          "reps": 3,
          "sets": 2,
          "rest_sec": 45,
          "equipment": ["ballons", "cônes", "chasubles"],
          "tips": ["Point clé technique", "Exigence d'intensité"]
        }
      ]
    },
    {
      "name": "exercises",
      "label": "2. Ateliers & Corps de Séance",
      "duration_min": 35,
      "exercises": [
        {
          "name": "Nom de l'exercice",
          "description": "Description précise avec espaces, distances et règles.",
          "duration_min": 20,
          "reps": 4,
          "sets": 2,
          "rest_sec": 60,
          "equipment": ["mini-buts", "plots"],
          "tips": ["Conseil tactique / d'intensité"]
        }
      ]
    },
    {
      "name": "game",
      "label": "3. Situation Réelle / Match à Thème",
      "duration_min": 30,
      "exercises": [
        {
          "name": "Match à contrainte / Opposition ciblée",
          "description": "Règles du jeu, dimensions du terrain et objectifs.",
          "duration_min": 30,
          "reps": 2,
          "sets": 1,
          "rest_sec": 90,
          "equipment": ["chasubles", "buts"],
          "tips": ["Consigne de pressing et rythme"]
        }
      ]
    },
    {
      "name": "cooldown",
      "label": "4. Retour au Calme & Débriefing",
      "duration_min": 10,
      "exercises": [
        {
          "name": "Régénération & Débriefing",
          "description": "Course lente, étirements activo-dynamiques et analyse des objectifs.",
          "duration_min": 10,
          "reps": null,
          "sets": null,
          "rest_sec": null,
          "equipment": ["tapis"],
          "tips": ["Hydratation immédiate", "Feedback collectif"]
        }
      ]
    }
  ]
}`;

    const userPrompt = [
      `Génère une séance d'entraînement collective de football de niveau d'excellence.`,
      `Objectif principal : ${objective}`,
      `Durée totale requise : ${durationMin} minutes`,
      `Niveau du groupe : ${level}`,
      `Nombre de joueurs : ${playerCount}`,
      coachNotes ? `Consignes spéciales du coach : ${coachNotes}` : '',
      isBloodBath
        ? `🔥 SESSION BLOOD BATH / HAUTE INTENSITÉ : Cette séance doit être à intensité maximale (intermittent court-court, duels explosifs, transition éclair, pressing tout terrain sans temps mort). Les exercices doivent pousser les joueurs dans leurs retranchements physiques et mentaux tout en restant sécurisés et structurés.`
        : '',
      `Assure-toi que la somme des durées des 4 phases égale exactement ${durationMin} minutes.`,
      `Langue : Français.`,
    ].filter(Boolean).join('\n');

    try {
      const response = await generateAiChatCompletion({
        systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        maxTokens: 2500,
        temperature: 0.35,
      });

      const text = response.text;
      if (!text) throw new HttpsError('internal', 'Réponse IA vide.');

      const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleaned) as { phases?: unknown[] };
      if (!Array.isArray(parsed.phases) || parsed.phases.length === 0) {
        throw new Error('Format de phases invalide');
      }

      return {
        source: response.model,
        objective: data.objective,
        duration_min: durationMin,
        level: data.level,
        player_count: playerCount,
        phases: parsed.phases,
      };
    } catch (e) {
      console.error('[generateTrainingSession] Error:', e);
      throw new HttpsError('internal', 'La génération IA a échoué. Veuillez réessayer.');
    }
  },
);
