/** Shared types for ProDay AI agents. */

export type AgentName =
  | 'club'
  | 'coach'
  | 'match'
  | 'training'
  | 'player'
  | 'analytics'
  | 'video'
  | 'revenue';

export type AgentContext = {
  uid: string;
  role: string;
  club_id?: string;
  team_id?: string;
  query: string;
};

export type AgentResult = {
  agent: AgentName;
  summary: string;
  facts: Record<string, unknown>;
  error?: string;
};
