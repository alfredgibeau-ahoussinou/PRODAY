import { useCallback, useEffect, useState } from 'react';
import type { User } from '../models/User';
import type { RecruitmentPost } from '../models/Player';
import {
  statsService,
  formatCount,
  type RecruitmentStats,
} from '../services/stats.service';
import { usersService, type StaffType } from '../services/users.service';
import { recruitmentService } from '../services/recruitment.service';
import { isFirebaseConfigured } from '../config/firebase';

export function useRecruitmentStats() {
  const [stats, setStats] = useState<RecruitmentStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await statsService.getRecruitmentStats();
    setStats(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    stats,
    loading,
    refresh,
    configured: isFirebaseConfigured(),
    labels: stats
      ? {
          players: formatCount(stats.players, 'profil'),
          staff: formatCount(
            stats.coaches + stats.agents,
            'profil',
            'profils'
          ),
          clubs: formatCount(stats.clubs, 'club'),
        }
      : null,
  };
}

export function useUsersByRole(role: 'player', search?: string): {
  users: User[];
  loading: boolean;
  refresh: () => void;
};
export function useUsersByRole(
  role: StaffType,
  search?: string
): { users: User[]; loading: boolean; refresh: () => void };
export function useUsersByRole(
  role: 'player' | StaffType,
  search = ''
): { users: User[]; loading: boolean; refresh: () => void } {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (role === 'player') {
      setUsers(await usersService.listPlayers(search));
    } else {
      setUsers(await usersService.listStaff(role, search));
    }
    setLoading(false);
  }, [role, search]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { users, loading, refresh };
}

export function useUserProfile(uid: string | null) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(uid));

  useEffect(() => {
    if (!uid) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    usersService.getById(uid).then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, [uid]);

  return { user, loading };
}

export function useRecruitmentPosts() {
  const [posts, setPosts] = useState<RecruitmentPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recruitmentService.listOpenPosts().then((p) => {
      setPosts(p);
      setLoading(false);
    });
  }, []);

  return { posts, loading };
}

export function useMercatoHome() {
  const statsHook = useRecruitmentStats();
  const [popularCoaches, setPopularCoaches] = useState<User[]>([]);
  const [recentPlayers, setRecentPlayers] = useState<User[]>([]);
  const [posts, setPosts] = useState<RecruitmentPost[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [coaches, players, openPosts] = await Promise.all([
        usersService.listPopularStaff('coach'),
        usersService.listRecentPlayers(),
        recruitmentService.listOpenPosts(5),
      ]);
      if (!cancelled) {
        setPopularCoaches(coaches);
        setRecentPlayers(players);
        setPosts(openPosts);
        setLoadingExtra(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    ...statsHook,
    popularCoaches,
    recentPlayers,
    posts,
    loadingLists: loadingExtra,
  };
}
