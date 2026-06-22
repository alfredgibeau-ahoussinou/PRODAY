import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const ACTIVITIES_COL = 'player_activities';
const MISTRAL_VISION_MODEL = 'pixtral-12b-2409';
const MISTRAL_TEXT_MODEL = 'mistral-small-latest';

export interface ActivityAnalysisPayload {
  summary_fr: string;
  strengths: string[];
  improvements: string[];
  tactical_notes: string[];
  confidence: number;
}

function getMistralApiKey(): string | null {
  return functions.config().mistral?.api_key ?? process.env.MISTRAL_API_KEY ?? null;
}

function toDate(value: unknown): Date {
  if (value instanceof admin.firestore.Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date(String(value ?? Date.now()));
}

function isImageUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.startsWith('data:image/')) return true;
  return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(lower);
}

function isVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.startsWith('data:video/')) return true;
  return /\.(mp4|mov|webm|m4v)(\?|$)/i.test(lower);
}

async function fetchDocumentAsDataUrl(storageUrl: string, mimeHint?: string): Promise<string | null> {
  const res = await fetch(storageUrl);
  if (!res.ok) return null;
  const contentType = res.headers.get('content-type') ?? mimeHint ?? 'image/jpeg';
  if (contentType.includes('pdf') || contentType.includes('video/')) {
    return null;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const base64 = buf.toString('base64');
  return `data:${contentType.split(';')[0]};base64,${base64}`;
}

function parseAnalysisJson(raw: string): ActivityAnalysisPayload | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const strengths = Array.isArray(parsed.strengths)
      ? parsed.strengths.map(String).filter(Boolean).slice(0, 6)
      : [];
    const improvements = Array.isArray(parsed.improvements)
      ? parsed.improvements.map(String).filter(Boolean).slice(0, 6)
      : [];
    const tactical_notes = Array.isArray(parsed.tactical_notes)
      ? parsed.tactical_notes.map(String).filter(Boolean).slice(0, 4)
      : [];
    const summary_fr = String(parsed.summary_fr ?? '').trim();
    if (!summary_fr) return null;
    const confidence = Math.min(1, Math.max(0, Number(parsed.confidence) || 0));
    return { summary_fr, strengths, improvements, tactical_notes, confidence };
  } catch {
    return null;
  }
}

const ANALYSIS_JSON_SCHEMA = `{
  "summary_fr": "résumé court en français",
  "strengths": ["point fort 1", "point fort 2"],
  "improvements": ["axe d'amélioration 1"],
  "tactical_notes": ["note tactique optionnelle"],
  "confidence": nombre entre 0 et 1
}`;

async function callMistralVisionHighlight(
  apiKey: string,
  prompt: string,
  imageDataUrl: string
): Promise<ActivityAnalysisPayload | null> {
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MISTRAL_VISION_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: imageDataUrl },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    console.error('[analyzeActivityHighlight] vision API', res.status, (await res.text()).slice(0, 300));
    return null;
  }

  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = json.choices?.[0]?.message?.content?.trim();
  if (!raw) return null;
  return parseAnalysisJson(raw);
}

async function callMistralTextHighlight(apiKey: string, prompt: string): Promise<ActivityAnalysisPayload | null> {
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MISTRAL_TEXT_MODEL,
      temperature: 0.25,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    console.error('[analyzeActivityHighlight] text API', res.status, (await res.text()).slice(0, 300));
    return null;
  }

  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = json.choices?.[0]?.message?.content?.trim();
  if (!raw) return null;
  return parseAnalysisJson(raw);
}

function buildSessionContext(activity: Record<string, unknown>): string {
  const lines: string[] = [
    `Type: ${String(activity.type ?? 'training')}`,
    `Durée: ${Number(activity.duration_min ?? 0)} min`,
    `Date: ${toDate(activity.date).toISOString().slice(0, 10)}`,
  ];
  if (activity.goals != null) lines.push(`Buts déclarés: ${activity.goals}`);
  if (activity.assists != null) lines.push(`Passes décisives déclarées: ${activity.assists}`);
  if (activity.rating_self != null) lines.push(`Auto-évaluation /10: ${activity.rating_self}`);
  if (Array.isArray(activity.performance_tags) && activity.performance_tags.length) {
    lines.push(`Tags performance: ${activity.performance_tags.join(', ')}`);
  }
  if (activity.notes) lines.push(`Notes joueur: ${String(activity.notes)}`);
  return lines.join('\n');
}

function buildAnalysisPrompt(
  position: string,
  category: string,
  mode: 'vision' | 'session',
  sessionContext: string
): string {
  const roleCtx =
    position || category
      ? `Joueur — poste: ${position || 'non renseigné'}, catégorie: ${category || 'non renseignée'}.`
      : 'Joueur amateur/semi-pro.';

  const constraints =
    mode === 'vision'
      ? `Analyse cette image ou frame de highlight football. Donne un retour QUALITATIF uniquement (posture, placement, technique visible). N'invente PAS de statistiques (passes, tirs, distances) non observables.`
      : `Pas de vidéo analysable — base-toi UNIQUEMENT sur les données de séance ci-dessous. N'invente PAS de stats vidéo. Commence le summary_fr par "Pas de vidéo — analyse basée sur la séance".`;

  return `Tu es coach analyste ProDay (football).
${roleCtx}
${constraints}

Données séance:
${sessionContext}

Réponds UNIQUEMENT en JSON valide (sans markdown):
${ANALYSIS_JSON_SCHEMA}`;
}

function posterUrlForHighlight(
  videoUrl: string,
  profile: Record<string, unknown> | undefined
): string | null {
  const videos = (profile?.highlight_video_urls as string[] | undefined)?.filter(Boolean) ?? [];
  const gallery = (profile?.gallery_urls as string[] | undefined)?.filter(Boolean) ?? [];
  const idx = videos.findIndex((u) => u === videoUrl);
  if (idx >= 0 && gallery[idx] && isImageUrl(gallery[idx])) {
    return gallery[idx];
  }
  const firstGallery = gallery.find((u) => isImageUrl(u));
  return firstGallery ?? null;
}

async function resolveVisionDataUrl(
  activity: Record<string, unknown>,
  profile: Record<string, unknown> | undefined
): Promise<{ dataUrl: string; source: string } | null> {
  const videoUrl = String(activity.video_url ?? '').trim();
  if (!videoUrl) return null;

  if (isImageUrl(videoUrl)) {
    if (videoUrl.startsWith('data:image/')) {
      return { dataUrl: videoUrl, source: 'image_data_url' };
    }
    const dataUrl = await fetchDocumentAsDataUrl(videoUrl);
    return dataUrl ? { dataUrl, source: 'image_url' } : null;
  }

  const thumbnail = activity.thumbnail_url != null ? String(activity.thumbnail_url).trim() : '';
  if (thumbnail && isImageUrl(thumbnail)) {
    const dataUrl = thumbnail.startsWith('data:image/')
      ? thumbnail
      : await fetchDocumentAsDataUrl(thumbnail);
    if (dataUrl) return { dataUrl, source: 'thumbnail_url' };
  }

  if (isVideoUrl(videoUrl)) {
    const poster = posterUrlForHighlight(videoUrl, profile);
    if (poster) {
      const dataUrl = await fetchDocumentAsDataUrl(poster);
      if (dataUrl) return { dataUrl, source: 'profile_poster' };
    }
  }

  return null;
}

export async function runActivityHighlightAnalysis(
  activityId: string,
  options?: { force?: boolean }
): Promise<{ status: 'analyzed' | 'failed'; activityId: string }> {
  const apiKey = getMistralApiKey();
  const ref = db.doc(`${ACTIVITIES_COL}/${activityId}`);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Activité introuvable');
  }

  const activity = snap.data()!;
  const currentStatus = String(activity.analysis_status ?? '');

  if (currentStatus === 'analyzed' && !options?.force) {
    throw new HttpsError('already-exists', 'Analyse déjà effectuée (force=true pour relancer)');
  }

  if (!apiKey) {
    await ref.update({
      analysis_status: 'failed',
      analysis_summary_fr: 'Analyse IA indisponible',
      analysis_strengths: admin.firestore.FieldValue.delete(),
      analysis_improvements: admin.firestore.FieldValue.delete(),
      analysis_tactical_notes: admin.firestore.FieldValue.delete(),
      analysis_confidence: admin.firestore.FieldValue.delete(),
      analyzed_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { status: 'failed', activityId };
  }

  const playerUid = String(activity.player_uid ?? '');
  const userSnap = await db.doc(`users/${playerUid}`).get();
  const user = userSnap.data() ?? {};
  const profile = (user.profile as Record<string, unknown> | undefined) ?? {};
  const position = String(profile.position ?? '');
  const category = String(profile.category ?? '');
  const sessionContext = buildSessionContext(activity);

  let analysis: ActivityAnalysisPayload | null = null;
  const videoUrl = String(activity.video_url ?? '').trim();

  if (!videoUrl) {
    const prompt = buildAnalysisPrompt(position, category, 'session', sessionContext);
    analysis = await callMistralTextHighlight(apiKey, prompt);
    if (analysis && !analysis.summary_fr.startsWith('Pas de vidéo')) {
      analysis = {
        ...analysis,
        summary_fr: `Pas de vidéo — analyse basée sur la séance. ${analysis.summary_fr}`,
      };
    }
  } else {
    const vision = await resolveVisionDataUrl(activity, profile);
    if (vision) {
      const prompt = buildAnalysisPrompt(position, category, 'vision', sessionContext);
      analysis = await callMistralVisionHighlight(apiKey, prompt, vision.dataUrl);
    } else {
      const prompt = buildAnalysisPrompt(position, category, 'session', sessionContext);
      analysis = await callMistralTextHighlight(apiKey, prompt);
      if (analysis) {
        const prefix = isVideoUrl(videoUrl)
          ? 'Vidéo non analysable frame par frame — retour basé sur la séance et les tags. '
          : 'Pas de vidéo — analyse basée sur la séance. ';
        if (!analysis.summary_fr.includes('analyse basée')) {
          analysis = { ...analysis, summary_fr: `${prefix}${analysis.summary_fr}` };
        }
      }
    }
  }

  if (!analysis) {
    await ref.update({
      analysis_status: 'failed',
      analysis_summary_fr: 'Analyse IA indisponible',
      analysis_strengths: admin.firestore.FieldValue.delete(),
      analysis_improvements: admin.firestore.FieldValue.delete(),
      analysis_tactical_notes: admin.firestore.FieldValue.delete(),
      analysis_confidence: admin.firestore.FieldValue.delete(),
      analyzed_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { status: 'failed', activityId };
  }

  await ref.update({
    analysis_status: 'analyzed',
    analysis_summary_fr: analysis.summary_fr,
    analysis_strengths: analysis.strengths,
    analysis_improvements: analysis.improvements,
    analysis_tactical_notes: analysis.tactical_notes.length ? analysis.tactical_notes : null,
    analysis_confidence: analysis.confidence,
    analyzed_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { status: 'analyzed', activityId };
}

/** Analyse IA highlight / séance joueur (Gen2 callable, europe-west1). */
export const analyzeActivityHighlight = onCall(
  {
    region: 'europe-west1',
    timeoutSeconds: 120,
    memory: '512MiB',
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Connexion requise');
    }

    const { activityId, force } = request.data as { activityId?: string; force?: boolean };
    if (!activityId?.trim()) {
      throw new HttpsError('invalid-argument', 'activityId requis');
    }

    const ref = db.doc(`${ACTIVITIES_COL}/${activityId.trim()}`);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Activité introuvable');
    }

    const activity = snap.data()!;
    const playerUid = String(activity.player_uid ?? '');
    const isAdmin = request.auth.token?.admin === true;
    if (playerUid !== request.auth.uid && !isAdmin) {
      throw new HttpsError('permission-denied', 'Propriétaire ou admin requis');
    }

    return runActivityHighlightAnalysis(activityId.trim(), { force: force === true });
  }
);
