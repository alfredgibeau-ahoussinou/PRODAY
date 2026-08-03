export const SKILL_ENDORSEMENT_KEYS = [
  'dribbling',
  'passing',
  'defending',
  'finishing',
  'pace',
  'vision',
  'leadership',
] as const;

export type SkillEndorsementKey = (typeof SKILL_ENDORSEMENT_KEYS)[number];

export interface SkillEndorsement {
  id: string;
  endorser_uid: string;
  endorser_name: string;
  endorsed_uid: string;
  skill: SkillEndorsementKey;
  club_id?: string;
  created_at: Date;
}

export interface CreateSkillEndorsementInput {
  endorser_uid: string;
  endorser_name: string;
  endorsed_uid: string;
  skill: SkillEndorsementKey;
  club_id?: string;
}

export type SkillEndorsementCounts = Record<SkillEndorsementKey, number>;

export function emptySkillCounts(): SkillEndorsementCounts {
  return {
    dribbling: 0,
    passing: 0,
    defending: 0,
    finishing: 0,
    pace: 0,
    vision: 0,
    leadership: 0,
  };
}
