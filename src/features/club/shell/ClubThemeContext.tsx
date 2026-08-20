import React, {
  createContext,
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
        const doc = await clubsService.getById(clubId);
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
    }),
    [tokens, brand, club, logoUrl, activeTeamId, ready],
  );

  return (
    <ClubThemeContext.Provider value={value}>{children}</ClubThemeContext.Provider>
  );
}

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
    };
  }
  return ctx;
}
