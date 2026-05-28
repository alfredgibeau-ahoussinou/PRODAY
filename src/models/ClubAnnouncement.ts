export interface ClubAnnouncement {
  id: string;
  club_id: string;
  author_uid: string;
  author_name: string;
  title: string;
  body: string;
  created_at: Date;
}

export interface CreateClubAnnouncementInput {
  club_id: string;
  author_uid: string;
  author_name: string;
  title: string;
  body: string;
}
