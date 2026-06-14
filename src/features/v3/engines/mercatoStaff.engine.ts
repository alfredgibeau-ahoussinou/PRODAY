import type { RecruitmentPost } from '../../../models/Player';
import type { Application } from '../../../models/Player';

export interface StaffMercatoSummary {
  myPostsCount: number;
  marketplacePosts: number;
  pendingApplications: number;
}

/** Compte les annonces publiées par le staff connecté. */
export function countAuthorPosts(posts: RecruitmentPost[], authorUid: string): number {
  return posts.filter((post) => post.author_uid === authorUid).length;
}

/** Compte les candidatures en attente de réponse. */
export function countPendingApplications(applications: Application[]): number {
  return applications.filter((app) => app.status === 'PENDING').length;
}

export function summarizeStaffMercato(params: {
  posts: RecruitmentPost[];
  authorUid: string;
  pendingApplications: number;
}): StaffMercatoSummary {
  return {
    myPostsCount: countAuthorPosts(params.posts, params.authorUid),
    marketplacePosts: params.posts.length,
    pendingApplications: params.pendingApplications,
  };
}
