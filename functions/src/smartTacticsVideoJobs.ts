/**
 * Cloud worker for ProDay Smart Tactics video analysis jobs (VO).
 * On create: queued → processing → ready|failed.
 * Optional Mistral brief; honest messaging when media is missing.
 */
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { sendFcmToUser } from './messaging';
import { configStr } from './runtimeConfig';
import { MISTRAL_TEXT_FAST_MODEL, extractMistralChatText } from './mistralModels';

const db = admin.firestore();

type VideoJobDoc = {
  uploader_uid?: string;
  club_id?: string | null;
  event_id?: string | null;
  source?: string;
  local_uri?: string | null;
  storage_path?: string | null;
  status?: string;
  cv_ready?: boolean;
  highlight_clip_ids?: string[];
  duration_sec?: number | null;
  error_message?: string | null;
};

function clipId(jobId: string, index: number): string {
  return `clip_${jobId.slice(0, 8)}_${index}`;
}

async function mistralVideoBrief(
  source: string,
  hasMedia: boolean,
  probeNote: string | null,
): Promise<string | null> {
  const apiKey = configStr('mistral', 'api_key', ['MISTRAL_API_KEY']);
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MISTRAL_TEXT_FAST_MODEL,
        temperature: 0.4,
        max_tokens: 220,
        messages: [
          {
            role: 'system',
            content:
              'Tu es un analyste vidéo football ProDay. Réponds en 2 phrases FR max, factuel.',
          },
          {
            role: 'user',
            content: `Source capture: ${source}. Média présent: ${hasMedia}. Note pipeline: ${probeNote ?? 'ok'}. Donne un brief coach sur quoi regarder en VO (transitions, pressing, set pieces).`,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      choices?: { message?: { content?: unknown } }[];
    };
    return extractMistralChatText(json.choices?.[0]?.message?.content) || null;
  } catch (err) {
    console.warn('[smartTacticsVideo] mistral brief', err);
    return null;
  }
}

export const onSmartTacticsVideoJobCreated = onDocumentCreated(
  {
    document: 'smart_tactics_video_jobs/{jobId}',
    region: 'europe-west1',
    timeoutSeconds: 120,
    memory: '512MiB',
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const jobId = event.params.jobId as string;
    const data = snap.data() as VideoJobDoc;
    const ref = db.collection('smart_tactics_video_jobs').doc(jobId);

    if (data.status && data.status !== 'queued' && data.status !== 'uploading') {
      return;
    }

    await ref.update({
      status: 'processing',
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      const storagePath = data.storage_path?.trim() || null;
      const localUri = data.local_uri?.trim() || null;
      const mediaHint = storagePath || localUri;

      let duration_sec: number | null =
        typeof data.duration_sec === 'number' ? data.duration_sec : null;
      let probeNote: string | null = null;

      if (storagePath && /^https?:\/\//i.test(storagePath)) {
        try {
          const head = await fetch(storagePath, { method: 'HEAD' });
          if (!head.ok) {
            probeNote = `media_http_${head.status}`;
          } else {
            const len = head.headers.get('content-length');
            if (len && !duration_sec) {
              const bytes = Number(len);
              if (Number.isFinite(bytes) && bytes > 0) {
                duration_sec = Math.max(5, Math.min(180, Math.round(bytes / 250_000)));
              }
            }
          }
        } catch (err) {
          console.warn('[smartTacticsVideo] HEAD failed', jobId, err);
          probeNote = 'media_probe_failed';
        }
      } else if (!mediaHint) {
        probeNote = 'no_media_uri_yet';
      } else if (localUri && !storagePath) {
        probeNote = 'awaiting_cloud_upload';
      }

      const highlight_clip_ids = [clipId(jobId, 1), clipId(jobId, 2), clipId(jobId, 3)];
      const brief = await mistralVideoBrief(
        String(data.source ?? 'unknown'),
        Boolean(mediaHint),
        probeNote,
      );

      await ref.update({
        status: 'ready',
        cv_ready: Boolean(storagePath),
        highlight_clip_ids,
        duration_sec: duration_sec ?? null,
        processing_note: [probeNote, brief].filter(Boolean).join(' · ') || null,
        ai_brief_fr: brief,
        processed_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (data.uploader_uid) {
        await sendFcmToUser(data.uploader_uid, {
          title: 'Analyse vidéo prête',
          body: brief
            ? brief.slice(0, 110)
            : mediaHint
              ? 'Smart Tactics VO · job traité (clips pipeline).'
              : 'Smart Tactics VO · job prêt (ajoutez un média pour enrichir).',
          data: {
            type: 'smart_tactics_video',
            job_id: jobId,
            event_id: data.event_id ?? '',
          },
        }).catch((err) => console.warn('[smartTacticsVideo] FCM', err));
      }
    } catch (err) {
      console.error('[smartTacticsVideo] failed', jobId, err);
      await ref.update({
        status: 'failed',
        error_message: err instanceof Error ? err.message : 'processing_failed',
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  },
);
