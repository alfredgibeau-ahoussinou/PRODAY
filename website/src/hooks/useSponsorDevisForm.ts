"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SPONSOR_DEVIS_INITIAL,
  type SponsorDevisFormState,
  type SponsorPackageTier,
} from "@/lib/sponsorContent";
import {
  loadSponsorDevisState,
  saveSponsorDevisState,
} from "@/lib/sponsorDevisStorage";

export function useSponsorDevisForm(options?: {
  seedPackage?: string | null;
}) {
  const [form, setForm] = useState<SponsorDevisFormState>(SPONSOR_DEVIS_INITIAL);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadSponsorDevisState();
    const seed = options?.seedPackage;
    if (
      seed === "starter" ||
      seed === "territorial" ||
      seed === "national" ||
      seed === "custom"
    ) {
      loaded.packageTier = seed;
    }
    setForm(loaded);
    setHydrated(true);
  }, [options?.seedPackage]);

  useEffect(() => {
    if (!hydrated) return;
    saveSponsorDevisState(form);
  }, [form, hydrated]);

  const patch = useCallback((partial: Partial<SponsorDevisFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const setPackageTier = useCallback((packageTier: SponsorPackageTier) => {
    setForm((prev) => ({ ...prev, packageTier }));
  }, []);

  return { form, patch, setPackageTier, hydrated, setForm };
}
