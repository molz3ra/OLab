export const GUEST_MAX_ANALYSES = 3;
const GUEST_KEY = "olab_guest_usage_v1";

export interface GuestQuota {
  used: number;
  max: number;
  remaining: number;
  isLocked: boolean;
}

const isBrowser = typeof window !== "undefined";

export function getGuestUsage(): GuestQuota {
  if (!isBrowser) {
    return { used: 0, max: GUEST_MAX_ANALYSES, remaining: GUEST_MAX_ANALYSES, isLocked: false };
  }

  try {
    const raw = window.localStorage.getItem(GUEST_KEY);
    const used = raw ? Math.max(0, parseInt(raw, 10) || 0) : 0;
    const remaining = Math.max(0, GUEST_MAX_ANALYSES - used);
    return {
      used,
      max: GUEST_MAX_ANALYSES,
      remaining,
      isLocked: used >= GUEST_MAX_ANALYSES,
    };
  } catch {
    return { used: 0, max: GUEST_MAX_ANALYSES, remaining: GUEST_MAX_ANALYSES, isLocked: false };
  }
}

export function incrementGuestUsage(): GuestQuota {
  if (!isBrowser) {
    return getGuestUsage();
  }

  try {
    const current = getGuestUsage();
    const nextUsed = current.used + 1;
    window.localStorage.setItem(GUEST_KEY, String(nextUsed));
    const remaining = Math.max(0, GUEST_MAX_ANALYSES - nextUsed);
    return {
      used: nextUsed,
      max: GUEST_MAX_ANALYSES,
      remaining,
      isLocked: nextUsed >= GUEST_MAX_ANALYSES,
    };
  } catch {
    return getGuestUsage();
  }
}

export function resetGuestUsage(): void {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(GUEST_KEY);
  } catch {
    // Ignore storage errors
  }
}
