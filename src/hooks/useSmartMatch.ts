import { useCallback, useEffect, useState } from 'react';
import type { User } from '../models/User';
import type { RecruitmentPost } from '../models/Player';
import {
  buildSmartMatchGraph,
  type SmartMatchEdge,
} from '../core/recruitment/smartMatch.engine';
import { playersDirectoryService } from '../services/playersDirectory.service';
import { recruitmentService } from '../services/recruitment.service';

/** Loads directory + open posts and builds Smart Match edges for staff home. */
export function useSmartMatch(profile: User | null) {
  const [edges, setEdges] = useState<SmartMatchEdge[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!profile) {
      setEdges([]);
      return;
    }
    setLoading(true);
    try {
      const [page, posts] = await Promise.all([
        playersDirectoryService.fetchPage({}),
        recruitmentService.listOpenPosts(30),
      ]);
      const players = page.users.filter((u) => u.role === 'player');
      const pulseByUid: Record<string, number> = {};
      const pulseDeltaByUid: Record<string, number> = {};
      for (const player of players) {
        const stats = player.profile.season_stats;
        pulseByUid[player.uid] = Math.min(
          90,
          42 + (stats?.matches ?? 0) * 2 + (stats?.goals ?? 0) * 3
        );
        pulseDeltaByUid[player.uid] = Math.min(18, (stats?.goals ?? 0) + 5);
      }

      const agents = profile.role === 'agent' ? [profile] : [];
      const staff =
        profile.role === 'recruiter' || profile.role === 'coach' || profile.role === 'club'
          ? [profile]
          : [];

      const graph = buildSmartMatchGraph({
        players,
        posts: posts as RecruitmentPost[],
        agents,
        staff,
        pulseByUid,
        pulseDeltaByUid,
      });
      setEdges(graph.edges);
    } catch {
      setEdges([]);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { edges, loading, refresh };
}
