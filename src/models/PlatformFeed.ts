import type { UserRole } from './User';

export type FeedPostType = 'news' | 'poll';

/** `all` = fil public · `agents` = sondages / contenus réservés aux agents */
export type FeedAudience = 'all' | 'agents';

export interface PlatformFeedPost {
  id: string;
  type: FeedPostType;
  audience: FeedAudience;
  author_uid: string;
  author_name: string;
  author_role: UserRole;
  title: string;
  body: string;
  image_url?: string;
  poll_options?: string[];
  /** Clé = index option (string), valeur = uid ayant voté */
  poll_votes?: Record<string, string[]>;
  created_at: Date;
  updated_at?: Date;
}

export interface CreateFeedNewsInput {
  author_uid: string;
  author_name: string;
  author_role: UserRole;
  title: string;
  body: string;
  audience?: FeedAudience;
  image_url?: string;
}

export interface CreateFeedPollInput {
  author_uid: string;
  author_name: string;
  author_role: UserRole;
  title: string;
  body?: string;
  options: string[];
}
