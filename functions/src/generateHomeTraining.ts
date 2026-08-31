/**
 * CF callable — génère un programme d'entraînement individuel via Mistral.
 * Appelée par le joueur depuis TrainHubScreen.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { generateAiChatCompletion } from './aiProvider';

interface GenerateRequest {
  objective: string;
  position?: string;
  level: string;
  duration_min: number;
  equipment: string[];
  partner: boolean;
}

const OBJECTIVE_LABELS: Record<string, string> = {
  pied_faible: 'Travail du pied faible',
  vitesse: 'Vitesse et explosivité',
  endurance: 'Endurance',
  frappe: 'Frappe et finition',
  dribble: 'Dribble et feintes',
  passes: 'Passes et vision du jeu',
  heading: 'Jeu de tête',
  technique: 'Technique générale',
  physique: 'Préparation physique',
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
};

export const generateHomeTraining = onCall(
  {
    region: 'europe-west1',
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Connexion requise.');
    }

    const data = request.data as GenerateRequest;
    if (!data.objective || !data.level) {
      throw new HttpsError('invalid-argument', 'objective et level requis.');
    }

    const durationMin = Math.min(Math.max(data.duration_min || 30, 15), 90);
    const equipment = Array.isArray(data.equipment) ? data.equipment : [];
    const partner = Boolean(data.partner);
    const position = data.position?.trim() || undefined;

    const objLabel = OBJECTIVE_LABELS[data.objective] ?? data.objective;
    const lvlLabel = LEVEL_LABELS[data.level] ?? data.level;

    const prompt = [
      `Génère un programme d'entraînement individuel de football adapté aux paramètres suivants :`,
      `- Objectif principal : ${objLabel}`,
      `- Niveau : ${lvlLabel}`,
      `- Durée totale : ${durationMin} minutes`,
      `- Matériel disponible : ${equipment.length ? equipment.join(', ') : 'aucun (au poids du corps + ballon)'}`,
      `- Avec partenaire : ${partner ? 'oui' : 'non (seul)'}`,
      position ? `- Poste : ${position}` : '',
      '',
      `Format de réponse JSON attendu :`,
      `{`,
      `  "phases": [`,
      `    {`,
      `      "phase_type": "warmup | exercises | cooldown",`,
      `      "title": "Titre de la phase",`,
      `      "duration_min": 5,`,
      `      "exercises": [`,
      `        {`,
      `          "title": "Nom de l'exercice",`,
      `          "description": "Consignes claires et précises",`,
      `          "duration_min": 3,`,
      `          "reps": 10,`,
      `          "sets": 3,`,
      `          "rest_sec": 30,`,
      `          "tips": ["Conseil technique", "Conseil d'intensité"]`,
      `        }`,
      `      ]`,
      `    }`,
      `  ]`,
      `}`,
      '',
      `Règles :`,
      `- Toujours 3 phases : warmup (5-10 min), exercises (majorité), cooldown (3-5 min)`,
      `- La somme des duration_min doit être ~${durationMin} min`,
      `- Phase exercises : 3 à 5 exercices progressifs`,
      `- Exercices réalisables ${partner ? 'à deux' : 'seul'} ${equipment.length ? `avec ${equipment.join(', ')}` : 'sans matériel'}`,
      `- Adapter au poste ${position ? `(${position})` : 'polyvalent'}`,
      `- reps et sets obligatoires pour les exercices physiques / techniques`,
      `- rest_sec entre séries`,
      `- tips : 1-2 conseils concrets par exercice`,
      `- Langue : français uniquement`,
    ].filter(Boolean).join('\n');

    let aiRes;
    try {
      aiRes = await generateAiChatCompletion({
        systemPrompt: 'Tu es un préparateur physique football. Réponds UNIQUEMENT en JSON valide, sans markdown. Langue: français.',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
      });
    } catch (e) {
      console.error('[generateHomeTraining] AI error', e);
      throw new HttpsError('internal', 'Le modèle IA a échoué. Réessayez.');
    }

    try {
      const cleaned = aiRes.text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleaned) as { phases?: unknown[] };
      if (!Array.isArray(parsed.phases) || parsed.phases.length === 0) {
        throw new Error('phases manquantes');
      }
      return {
        source: aiRes.provider,
        model: aiRes.model,
        objective: data.objective,
        duration_min: durationMin,
        level: data.level,
        equipment,
        partner,
        position,
        phases: parsed.phases,
      };
    } catch {
      throw new HttpsError('internal', 'Réponse IA illisible.');
    }
  },
);
