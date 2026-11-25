import { calendarPrices } from "../data/calendarPrices";
import type { OrderReceipt } from "../stores/currentOrder";
import { MAX_QTY, MIN_QTY } from "./checkoutValidation";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const isOrderReceipt = (value: unknown): value is OrderReceipt => {
  if (!isRecord(value) || !isRecord(value.shipping) || !isRecord(value.customer)) return false;
  const { shipping, customer } = value;
  return (
    typeof value.orderId === "string" && /^CL27-[A-HJ-NP-Z2-9]{10}$/.test(value.orderId) &&
    typeof value.createdAt === "string" && !Number.isNaN(Date.parse(value.createdAt)) &&
    (value.syncStatus === "synced" || value.syncStatus === "fallback") &&
    typeof value.variant === "string" && Object.prototype.hasOwnProperty.call(calendarPrices, value.variant) &&
    typeof value.quantity === "number" && Number.isInteger(value.quantity) &&
    value.quantity >= MIN_QTY && value.quantity <= MAX_QTY &&
    typeof value.unitPrice === "number" && Number.isFinite(value.unitPrice) && value.unitPrice >= 0 &&
    typeof value.subtotal === "number" && value.subtotal === value.unitPrice * value.quantity &&
    typeof value.shippingCost === "number" && Number.isFinite(value.shippingCost) && value.shippingCost >= 0 &&
    typeof value.total === "number" && value.total === value.subtotal + value.shippingCost &&
    ["department", "city", "address", "neighborhood", "complement", "deliveryNotes"].every(
      (key) => typeof shipping[key] === "string"
    ) &&
    ["fullName", "phone", "email", "documentId"].every(
      (key) => typeof customer[key] === "string"
    )
  );
};
