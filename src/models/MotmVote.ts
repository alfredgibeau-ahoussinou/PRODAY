export interface MotmVote {
  id: string;
  team_event_id: string;
  voter_uid: string;
  nominee_uid: string;
  nominee_name: string;
  created_at: Date;
}

export interface CreateMotmVoteInput {
  team_event_id: string;
  voter_uid: string;
  nominee_uid: string;
  nominee_name: string;
}

export interface MotmStanding {
  uid: string;
  name: string;
  votes: number;
}
