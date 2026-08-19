/**
 * Annotations visuelles sur clips vidéo — dessins SVG (flèches, cercles, zones, texte).
 * Stockées en JSON dans Firestore : `club_match_videos/{videoId}/video_clips/{clipId}/annotations`.
 */

export type VideoAnnotationType = 'arrow' | 'circle' | 'text' | 'zone' | 'line';

export const VIDEO_ANNOTATION_TYPE_LABELS: Record<VideoAnnotationType, string> = {
  arrow: 'Flèche',
  circle: 'Cercle',
  text: 'Texte',
  zone: 'Zone',
  line: 'Ligne',
};

export interface AnnotationPoint {
  x: number;
  y: number;
}

export interface VideoAnnotationData {
  points: AnnotationPoint[];
  color: string;
  strokeWidth?: number;
  text?: string;
  /** Radius for circles, in normalized 0–1 coords. */
  radius?: number;
}

export interface VideoAnnotation {
  id: string;
  clip_id: string;
  timestamp_sec: number;
  type: VideoAnnotationType;
  data: VideoAnnotationData;
  created_by: string;
  created_at: Date;
}

export interface CreateVideoAnnotationInput {
  clip_id: string;
  timestamp_sec: number;
  type: VideoAnnotationType;
  data: VideoAnnotationData;
  created_by: string;
}

export const DEFAULT_ANNOTATION_COLORS = [
  '#FF3B30',
  '#FF9500',
  '#FFCC00',
  '#34C759',
  '#007AFF',
  '#AF52DE',
  '#FFFFFF',
] as const;

export function buildVideoAnnotation(input: CreateVideoAnnotationInput): VideoAnnotation {
  return {
    id: `vann_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    clip_id: input.clip_id,
    timestamp_sec: Math.max(0, input.timestamp_sec),
    type: input.type,
    data: {
      ...input.data,
      strokeWidth: input.data.strokeWidth ?? 3,
    },
    created_by: input.created_by,
    created_at: new Date(),
  };
}

export function annotationsAtTimestamp(
  annotations: VideoAnnotation[],
  sec: number,
  tolerance = 0.5,
): VideoAnnotation[] {
  return annotations.filter(
    (a) => Math.abs(a.timestamp_sec - sec) <= tolerance,
  );
}

export function sortAnnotationsByTime(list: VideoAnnotation[]): VideoAnnotation[] {
  return [...list].sort((a, b) => a.timestamp_sec - b.timestamp_sec);
}
