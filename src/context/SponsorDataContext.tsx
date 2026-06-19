import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { useSponsorDashboard } from '../hooks/useSponsorDashboard';
import { useUnreadMessageCount } from '../hooks/useUnreadMessages';

interface SponsorDataContextValue {
  loading: boolean;
  refreshing: boolean;
  lastRefreshedAt: Date | null;
  unreadMessages: number;
  refresh: () => Promise<void>;
  dashboard: ReturnType<typeof useSponsorDashboard>;
  companyName: string;
}

const SponsorDataContext = createContext<SponsorDataContextValue | null>(null);

export const SponsorDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const profile = useSessionProfile();
  const companyName = profile?.profile.job_title ?? profile?.display_name ?? 'Sponsor';
  const dashboard = useSponsorDashboard(profile?.uid, companyName);
  const { count: unreadMessages, refresh: refreshUnread } = useUnreadMessageCount();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([dashboard.refresh(), refreshUnread()]);
    setLastRefreshedAt(new Date());
    setRefreshing(false);
  }, [dashboard, refreshUnread]);

  const value = useMemo<SponsorDataContextValue>(
    () => ({
      loading: dashboard.loading,
      refreshing,
      lastRefreshedAt,
      unreadMessages,
      refresh,
      dashboard,
      companyName,
    }),
    [dashboard, refreshing, lastRefreshedAt, unreadMessages, refresh, companyName],
  );

  return (
    <SponsorDataContext.Provider value={value}>{children}</SponsorDataContext.Provider>
  );
};

export function useSponsorData(): SponsorDataContextValue {
  const ctx = useContext(SponsorDataContext);
  if (!ctx) throw new Error('useSponsorData must be used within SponsorDataProvider');
  return ctx;
}
