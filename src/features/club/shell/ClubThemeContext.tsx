import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CLUB_TOKENS, type ClubThemeTokens } from '../theme/clubTokens';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { clubsService } from '../../../services/clubs.service';
import type { Club } from '../../../models/Club';
import {
  buildClubThemeTokens,
  resolveClubDynamicBrand,
  type ClubDynamicBrand,
} from '../../../utils/clubDynamicTheme';

type ClubThemeContextValue = {
  tokens: ClubThemeTokens;
  brand: ClubDynamicBrand | null;
  club: Club | null;
  logoUrl: string | null;
  activeTeamId: string | null;
  ready: boolean;
  /** Applique tout de suite une nouvelle URL logo (après upload). */
  applyLogoUrl: (url: string) => void;
  /** Applique tout de suite primary/secondary (après enregistrement couleurs). */
  applyBrandColors: (primary: string, secondary: string) => void;
  /** Recharge le document club + palette. */
  refreshClub: () => Promise<void>;
};

const ClubThemeContext = createContext<ClubThemeContextValue | null>(null);

type ProviderProps = {
  children: React.ReactNode;
  /** Équipe active — teinte le chrome (espace équipe). */
  activeTeamId?: string | null;
};

export function ClubThemeProvider({ children, activeTeamId = null }: ProviderProps) {
  const profile = useSessionProfile();
  const clubId = profile?.profile.club_id ?? null;
  const [club, setClub] = useState<Club | null>(null);
  const [brand, setBrand] = useState<ClubDynamicBrand | null>(null);
  const [ready, setReady] = useState(false);

  const loadClub = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!clubId) {
        setClub(null);
        setBrand(null);
        setReady(true);
        return;
      }
      try {
        let doc = await clubsService.getById(clubId);
        if (doc && !doc.logo_url?.trim()) {
          doc = (await clubsService.ensureBrandingFromDirectory(clubId)) ?? doc;
        }
        setClub(doc);
        const next = await resolveClubDynamicBrand({
          club: doc,
          teamId: activeTeamId,
        });
        setBrand(next);
      } catch {
        if (!opts?.silent) {
          setClub(null);
          setBrand(null);
        }
      } finally {
        setReady(true);
      }
    },
    [clubId, activeTeamId],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!clubId) {
        if (!cancelled) {
          setClub(null);
          setBrand(null);
          setReady(true);
        }
        return;
      }
      try {
        let doc = await clubsService.getById(clubId);
        if (doc && !doc.logo_url?.trim()) {
          doc = (await clubsService.ensureBrandingFromDirectory(clubId)) ?? doc;
        }
        if (cancelled) return;
        setClub(doc);
        const next = await resolveClubDynamicBrand({
          club: doc,
          teamId: activeTeamId,
        });
        if (!cancelled) setBrand(next);
      } catch {
        if (!cancelled) {
          setClub(null);
          setBrand(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clubId, activeTeamId]);

  const applyLogoUrl = useCallback(
    (url: string) => {
      setClub((prev) => {
        const next = prev ? { ...prev, logo_url: url } : prev;
        if (next) {
          void resolveClubDynamicBrand({
            club: next,
            teamId: activeTeamId,
          }).then(setBrand);
        }
        return next;
      });
    },
    [activeTeamId],
  );

  const applyBrandColors = useCallback(
    (primary: string, secondary: string) => {
      setClub((prev) => {
        const next = prev
          ? { ...prev, primary_color: primary, secondary_color: secondary }
          : prev;
        if (next) {
          void resolveClubDynamicBrand({
            club: next,
            teamId: activeTeamId,
          }).then(setBrand);
        }
        return next;
      });
    },
    [activeTeamId],
  );

  const refreshClub = useCallback(async () => {
    await loadClub({ silent: true });
  }, [loadClub]);

  const tokens = useMemo(() => buildClubThemeTokens(brand), [brand]);
  const logoUrl = club?.logo_url?.trim() || null;

  const value = useMemo(
    () => ({
      tokens,
      brand,
      club,
      logoUrl,
      activeTeamId: activeTeamId ?? null,
      ready,
      applyLogoUrl,
      applyBrandColors,
      refreshClub,
    }),
    [
      tokens,
      brand,
      club,
      logoUrl,
      activeTeamId,
      ready,
      applyLogoUrl,
      applyBrandColors,
      refreshClub,
    ],
  );

  return (
    <ClubThemeContext.Provider value={value}>{children}</ClubThemeContext.Provider>
  );
}

const NOOP_ASYNC = async () => undefined;

export function useClubTheme(): ClubThemeContextValue {
  const ctx = useContext(ClubThemeContext);
  if (!ctx) {
    return {
      tokens: CLUB_TOKENS,
      brand: null,
      club: null,
      logoUrl: null,
      activeTeamId: null,
      ready: true,
      applyLogoUrl: () => undefined,
      applyBrandColors: () => undefined,
      refreshClub: NOOP_ASYNC,
    };
  }
  return ctx;
}
