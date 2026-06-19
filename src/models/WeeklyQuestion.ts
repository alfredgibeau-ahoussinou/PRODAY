import type { UserRole } from './User';

export interface WeeklyQuestion {
  id: string;
  week_key: string;
  question: string;
  active: boolean;
  author_uid: string;
  author_name: string;
  created_at: Date;
}

export interface WeeklyQuestionResponse {
  id: string;
  author_uid: string;
  display_name: string;
  author_role?: UserRole;
  body: string;
  created_at: Date;
}

export interface CreateWeeklyQuestionInput {
  author_uid: string;
  author_name: string;
  question: string;
  week_key: string;
}

export interface SubmitWeeklyResponseInput {
  question_id: string;
  author_uid: string;
  display_name: string;
  author_role: UserRole;
  body: string;
}
