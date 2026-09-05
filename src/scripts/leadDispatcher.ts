export type LeadPayload = Record<string, string>;

export interface LeadSubmitSuccess {
  ok: true;
  whatsapp: string | null;
}

export interface LeadSubmitFailure {
  ok: false;
  recovered: boolean;
}

export type LeadSubmitResult = LeadSubmitSuccess | LeadSubmitFailure;

const LEAD_ENDPOINT = "/api/lead";
const REQUEST_TIMEOUT_MS = 4000;
const RECOVERY_STORAGE_KEY = "pending_lead_recovery";

const persistPendingLead = (payload: LeadPayload): boolean => {
  try {
    window.localStorage.setItem(
      RECOVERY_STORAGE_KEY,
      JSON.stringify({ payload, savedAt: new Date().toISOString() })
    );
    return true;
  } catch {
    return false;
  }
};

export const clearPendingLead = (): void => {
  try {
    window.localStorage.removeItem(RECOVERY_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
};

export const submitLead = async (
  payload: LeadPayload
): Promise<LeadSubmitResult> => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      return { ok: false, recovered: persistPendingLead(payload) };
    }

    let data: { whatsapp?: string | null } = {};
    try {
      data = (await response.json()) as { whatsapp?: string | null };
    } catch {
      // Empty or non-JSON body on a successful response; treat as no data.
    }
    clearPendingLead();
    return { ok: true, whatsapp: data.whatsapp ?? null };
  } catch {
    return { ok: false, recovered: persistPendingLead(payload) };
  } finally {
    window.clearTimeout(timeoutId);
  }
};
