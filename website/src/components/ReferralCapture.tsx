"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const STORAGE_KEY = "proday_referral_code";

/** Capture `?ref=` (ou `?referral=`) et le conserve pour la waitlist / inscription. */
export function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const raw = searchParams.get("ref") ?? searchParams.get("referral");
    if (!raw) return;
    const code = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length < 6 || code.length > 12) return;
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }, [searchParams]);

  return null;
}

export function readStoredReferralCode(): string | null {
  try {
    const code = localStorage.getItem(STORAGE_KEY);
    if (!code) return null;
    const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    return normalized.length >= 6 && normalized.length <= 12 ? normalized : null;
  } catch {
    return null;
  }
}
