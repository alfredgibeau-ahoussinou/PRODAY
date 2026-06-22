import { useCallback, useEffect, useState } from 'react';
import type { RecruitmentPost } from '../models/Player';
import { playersDirectoryService } from '../services/playersDirectory.service';
import {
  rankPlayersForRecruitmentPost,
  type RecruiterPlayerMatch,
} from '../utils/recruiterPlayerMatching';

export function useRecruiterRecommendations(
  post: RecruitmentPost | null,
  excludeUids: string[] = []
) {
  const [matches, setMatches] = useState<RecruiterPlayerMatch[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!post) {
      setMatches([]);
      return;
    }
    setLoading(true);
    const page = await playersDirectoryService.fetchPage({
      city: post.city,
      pageSize: 50,
    });
    const ranked = rankPlayersForRecruitmentPost(page.users, post, excludeUids);
    setMatches(ranked);
    setLoading(false);
  }, [post, excludeUids.join(',')]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { matches, loading, refresh };
}
