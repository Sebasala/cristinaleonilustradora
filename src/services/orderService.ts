import { calendarVariants } from "@data/calendarVariants";
import { selectedVariant } from "@stores/cartStore";
import { $currentOrder, type OrderDetails, type OrderReceipt } from "@stores/currentOrder";
import {
  $customerContact,
  $grandTotal,
  $isCheckoutValid,
  $itemQuantity,
  $shippingAddress,
  $shippingCity,
  $shippingCost,
  $shippingDepartment,
  $subtotal
} from "@stores/orderStore";

const ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TIMEOUT_MS = 8000;
const ORDER_ENDPOINT = "/api/orders";

const createOrderId = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return `CL27-${Array.from(bytes, (byte) => ID_ALPHABET[byte % ID_ALPHABET.length]).join("")}`;
};

const getOrderDetails = (): OrderDetails => {
  const variant = selectedVariant.get();
  const { fullName, phone, email, documentId } = $customerContact.get();
  return {
    variant,
    quantity: $itemQuantity.get(),
    unitPrice: calendarVariants[variant].priceCOP,
    subtotal: $subtotal.get(),
    shippingCost: $shippingCost.get(),
    total: $grandTotal.get(),
    shipping: {
      department: $shippingDepartment.get(),
      city: $shippingCity.get(),
      ...$shippingAddress.get()
    },
    customer: { fullName, phone, email, documentId }
  };
};

const sameDetails = (receipt: OrderReceipt, details: OrderDetails): boolean =>
  receipt.variant === details.variant &&
  receipt.quantity === details.quantity &&
  receipt.unitPrice === details.unitPrice &&
  receipt.subtotal === details.subtotal &&
  receipt.shippingCost === details.shippingCost &&
  receipt.total === details.total &&
  (Object.keys(details.shipping) as (keyof OrderDetails["shipping"])[]).every(
    (key) => receipt.shipping[key] === details.shipping[key]
  ) &&
  (Object.keys(details.customer) as (keyof OrderDetails["customer"])[]).every(
    (key) => receipt.customer[key] === details.customer[key]
  );

export const isCurrentOrderForCheckout = (): boolean => {
  const receipt = $currentOrder.get();
  return receipt !== null && sameDetails(receipt, getOrderDetails());
};

class OrderConflictError extends Error {
  constructor() {
    super("Order ID conflicts with another order.");
  }
}

const syncOrder = async (receipt: OrderReceipt): Promise<boolean> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(ORDER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(receipt),
      signal: controller.signal
    });
    const result: unknown = await response.json();
    if (typeof result === "object" && result !== null && "error" in result &&
      result.error === "ORDER_ID_CONFLICT") {
      throw new OrderConflictError();
    }
    if (!response.ok || typeof result !== "object" || result === null || !("ok" in result) ||
      result.ok !== true || !("orderId" in result) || result.orderId !== receipt.orderId) {
      throw new Error("Orders webhook returned an invalid response.");
    }
    return true;
  } catch (error) {
    if (error instanceof OrderConflictError) throw error;
    console.warn("Order could not be confirmed by the webhook.");
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
};

export const createConsolidatedOrder = async (): Promise<OrderReceipt> => {
  if (!$isCheckoutValid.get()) throw new Error("Cannot create an invalid order.");

  const details = getOrderDetails();
  const previous = $currentOrder.get();
  let receipt: OrderReceipt =
    previous && sameDetails(previous, details)
      ? previous
      : {
          ...details,
          orderId: createOrderId(),
          createdAt: new Date().toISOString(),
          syncStatus: "fallback"
        };

  try {
    if (receipt.syncStatus !== "synced" && await syncOrder(receipt)) {
      receipt = { ...receipt, syncStatus: "synced" };
    }
  } catch (error) {
    if (error instanceof OrderConflictError && previous?.orderId === receipt.orderId) {
      $currentOrder.set(null);
    }
    throw error;
  }
  $currentOrder.set(receipt);
  window.dispatchEvent(new CustomEvent("order:created", { detail: receipt }));
  return receipt;
};
