import { calendarPrices } from "@data/calendarPrices";
import { calculateShippingRate } from "@data/colombiaTerritory";
import type { OrderReceipt } from "@stores/currentOrder";
import {
  customerContactValidity,
  isShippingLocationValid,
  MAX_DELIVERY_NOTES_LENGTH,
  shippingAddressValidity,
} from "@utils/checkoutValidation";
import { isOrderReceipt } from "@utils/orderValidation";

interface NetlifyFunctionConfig {
  path: string;
  rateLimit: {
    windowLimit: number;
    windowSize: number;
    aggregateBy: ("ip" | "domain")[];
  };
}

export const config: NetlifyFunctionConfig = {
  path: "/api/orders",
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] },
};

const MAX_BODY_BYTES = 16_384;
const UPSTREAM_TIMEOUT_MS = 7000;
const jsonResponse = (
  status: number,
  body: Record<string, unknown>,
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isValidOrder = (value: unknown): value is OrderReceipt => {
  if (
    !isOrderReceipt(value) ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.createdAt)
  )
    return false;
  const { shipping, customer } = value;

  const address = shippingAddressValidity({
    address: shipping.address,
    neighborhood: shipping.neighborhood,
  });
  const contact = customerContactValidity({
    fullName: customer.fullName,
    phone: customer.phone,
    email: customer.email,
    documentId: customer.documentId,
  });
  const unitPrice = calendarPrices[value.variant];
  const subtotal = unitPrice * value.quantity;
  const shippingCost = calculateShippingRate(
    shipping.department,
    shipping.city,
    value.quantity,
  );
  return (
    isShippingLocationValid(shipping.department, shipping.city) &&
    address.address &&
    address.neighborhood &&
    shipping.deliveryNotes.length <= MAX_DELIVERY_NOTES_LENGTH &&
    Object.values(contact).every(Boolean) &&
    value.unitPrice === unitPrice &&
    value.subtotal === subtotal &&
    value.shippingCost === shippingCost &&
    value.total === subtotal + shippingCost
  );
};

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST")
    return jsonResponse(405, { ok: false, error: "METHOD_NOT_ALLOWED" });
  const declaredLength = req.headers.get("content-length");
  if (declaredLength && Number(declaredLength) > MAX_BODY_BYTES) {
    return jsonResponse(413, { ok: false, error: "ORDER_TOO_LARGE" });
  }

  let payload: unknown;
  try {
    const body = await req.text();
    if (new TextEncoder().encode(body).length > MAX_BODY_BYTES) {
      return jsonResponse(413, { ok: false, error: "ORDER_TOO_LARGE" });
    }
    payload = JSON.parse(body);
  } catch {
    return jsonResponse(400, { ok: false, error: "INVALID_JSON" });
  }
  if (!isValidOrder(payload))
    return jsonResponse(400, { ok: false, error: "INVALID_ORDER" });

  const webhookUrl = process.env.ORDERS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("Orders webhook is not configured.");
    return jsonResponse(503, { ok: false, error: "ORDERS_NOT_CONFIGURED" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const { shipping, customer } = payload;
    const order = {
      orderId: payload.orderId,
      createdAt: payload.createdAt,
      syncStatus: payload.syncStatus,
      variant: payload.variant,
      quantity: payload.quantity,
      unitPrice: payload.unitPrice,
      subtotal: payload.subtotal,
      shippingCost: payload.shippingCost,
      total: payload.total,
      shipping: {
        department: shipping.department,
        city: shipping.city,
        address: shipping.address,
        neighborhood: shipping.neighborhood,
        complement: shipping.complement,
        deliveryNotes: shipping.deliveryNotes,
      },
      customer: {
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
        documentId: customer.documentId,
      },
    };
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
      signal: controller.signal,
    });
    if (!response.ok) {
      console.warn(`Orders webhook returned HTTP ${response.status}.`);
      return jsonResponse(502, { ok: false, error: "ORDERS_UPSTREAM_ERROR" });
    }
    let result: unknown;
    try {
      result = await response.json();
    } catch {
      console.warn("Orders webhook returned invalid JSON.");
      return jsonResponse(502, { ok: false, error: "ORDERS_UPSTREAM_ERROR" });
    }
    if (
      isRecord(result) &&
      result.ok === false &&
      result.error === "ORDER_ID_CONFLICT"
    ) {
      return jsonResponse(409, { ok: false, error: "ORDER_ID_CONFLICT" });
    }
    if (isRecord(result) && result.ok === false) {
      const knownErrors = [
        "INVALID_ORDER",
        "INVALID_SHEET",
        "LOCK_TIMEOUT",
        "SCRIPT_ERROR",
      ];
      const code =
        typeof result.error === "string" && knownErrors.includes(result.error)
          ? result.error
          : "UNKNOWN_ERROR";
      console.warn(`Orders webhook rejected the order: ${code}.`);
      return jsonResponse(502, { ok: false, error: "ORDERS_UPSTREAM_ERROR" });
    }
    if (
      !isRecord(result) ||
      result.ok !== true ||
      result.orderId !== payload.orderId
    ) {
      console.warn("Orders webhook returned an invalid confirmation.");
      return jsonResponse(502, { ok: false, error: "ORDERS_UPSTREAM_ERROR" });
    }
    return jsonResponse(200, {
      ok: true,
      orderId: payload.orderId,
      ...(result.duplicate === true ? { duplicate: true } : {}),
    });
  } catch {
    console.warn(
      controller.signal.aborted
        ? "Orders webhook request timed out."
        : "Orders webhook could not be reached.",
    );
    return jsonResponse(502, { ok: false, error: "ORDERS_UPSTREAM_ERROR" });
  } finally {
    clearTimeout(timeout);
  }
};
