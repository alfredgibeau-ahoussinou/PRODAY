export const WAITLIST_STATUS_STORAGE_KEY = "proday_waitlist_status_v1";

export type StoredWaitlistStatus = {
  email: string;
  role: string;
  status: "pending" | "approved" | "rejected";
  savedAt: string;
};

export function saveWaitlistStatus(input: {
  email: string;
  role: string;
  status: "pending" | "approved" | "rejected";
}): void {
  if (typeof window === "undefined") return;
  const payload: StoredWaitlistStatus = {
    email: input.email.trim().toLowerCase(),
    role: input.role,
    status: input.status,
    savedAt: new Date().toISOString(),
  };
  try {
    sessionStorage.setItem(WAITLIST_STATUS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export function readWaitlistStatus(): StoredWaitlistStatus | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(WAITLIST_STATUS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredWaitlistStatus>;
    if (
      typeof parsed.email !== "string" ||
      typeof parsed.role !== "string" ||
      (parsed.status !== "pending" &&
        parsed.status !== "approved" &&
        parsed.status !== "rejected")
    ) {
      return null;
    }
    return {
      email: parsed.email,
      role: parsed.role,
      status: parsed.status,
      savedAt:
        typeof parsed.savedAt === "string"
          ? parsed.savedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
