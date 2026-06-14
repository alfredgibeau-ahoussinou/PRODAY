import { useCallback, useEffect, useState } from 'react';
import type { User } from '../models/User';
import { canPublishRecruitmentPost } from '../utils/roleCapabilities';
import { recruitmentService } from '../services/recruitment.service';
import {
  countAuthorPosts,
  countPendingApplications,
} from '../features/v3/engines/mercatoStaff.engine';

export interface StaffMercatoPipeline {
  myPostsCount: number;
  pendingApplications: number;
  loading: boolean;
}

const EMPTY: StaffMercatoPipeline = {
  myPostsCount: 0,
  pendingApplications: 0,
  loading: false,
};

/** Pipeline Mercato staff — annonces publiées + candidatures en attente. */
export function useStaffMercatoPipeline(profile: User | null): StaffMercatoPipeline {
  const [state, setState] = useState<StaffMercatoPipeline>(EMPTY);

  const refresh = useCallback(async () => {
    if (!profile || !canPublishRecruitmentPost(profile.role)) {
      setState(EMPTY);
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));
    try {
      const posts = await recruitmentService.listOpenPosts(40);
      const myPosts = posts.filter((post) => post.author_uid === profile.uid);
      const batches = await Promise.all(
        myPosts.slice(0, 8).map((post) => recruitmentService.listApplicationsForPost(post.id))
      );
      setState({
        myPostsCount: countAuthorPosts(posts, profile.uid),
        pendingApplications: countPendingApplications(batches.flat()),
        loading: false,
      });
    } catch {
      setState({ ...EMPTY, loading: false });
    }
  }, [profile]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return state;
}
