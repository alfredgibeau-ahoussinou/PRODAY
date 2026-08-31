"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  SPONSOR_DEVIS_INITIAL,
  type SponsorDevisFormState,
  type SponsorPackageTier,
} from "@/lib/sponsorContent";
import {
  loadSponsorDevisState,
  saveSponsorDevisState,
} from "@/lib/sponsorDevisStorage";

const emptySubscribe = () => () => {};

export function useSponsorDevisForm(options?: {
  seedPackage?: string | null;
}) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const [form, setForm] = useState<SponsorDevisFormState>(() => {
    if (typeof window === "undefined") return SPONSOR_DEVIS_INITIAL;
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
    return loaded;
  });

  const hydrated = isClient;

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
