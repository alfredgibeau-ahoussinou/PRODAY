/** Post tribune supporter — fil global ou scoped match. */
export type SupporterDebateModeration = 'visible' | 'hidden' | 'flagged';

export type SupporterDebatePost = {
  id: string;
  author_uid: string;
  author_name: string;
  body: string;
  /** null = fil global tribune */
  match_id: string | null;
  match_label?: string;
  like_count: number;
  reply_count: number;
  moderation: SupporterDebateModeration;
  created_at: Date;
  parent_id?: string | null;
};

export type CreateDebatePostInput = {
  author_uid: string;
  author_name: string;
  body: string;
  match_id?: string | null;
  match_label?: string;
  parent_id?: string | null;
};

export const DEBATE_BODY_MIN = 2;
export const DEBATE_BODY_MAX = 280;

export function validateDebateBody(raw: string): string {
  const body = raw.trim().replace(/\s+/g, ' ');
  if (body.length < DEBATE_BODY_MIN) {
    throw new Error('Écris au moins quelques caractères.');
  }
  if (body.length > DEBATE_BODY_MAX) {
    throw new Error(`Maximum ${DEBATE_BODY_MAX} caractères.`);
  }
  return body;
}
