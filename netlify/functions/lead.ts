// Minimal local type for Netlify Functions v2 config to avoid depending on @netlify/functions.
interface NetlifyFunctionConfig {
  path: string;
}

export const config: NetlifyFunctionConfig = { path: "/api/lead" };

type LeadPayload = Record<string, string>;

const JSON_HEADERS = { "Content-Type": "application/json" };

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

const isLeadPayload = (value: unknown): value is LeadPayload =>
  typeof value === "object" &&
  value !== null &&
  Object.values(value).every((field) => typeof field === "string");

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return jsonResponse(405, { ok: false, error: "Method not allowed" });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(400, { ok: false, error: "Invalid JSON body" });
  }

  if (!isLeadPayload(payload) || Object.keys(payload).length === 0) {
    return jsonResponse(400, { ok: false, error: "Invalid lead payload" });
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    return jsonResponse(500, { ok: false, error: "Lead intake is not configured" });
  }

  try {
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    });

    if (!webhookResponse.ok) {
      return jsonResponse(502, { ok: false, error: "Lead intake upstream error" });
    }
  } catch {
    return jsonResponse(502, { ok: false, error: "Lead intake upstream unreachable" });
  }

  return jsonResponse(200, { ok: true, whatsapp: process.env.ADMIN_WHATSAPP_PHONE ?? null });
};
