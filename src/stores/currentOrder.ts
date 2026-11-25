import type { CalendarVariantId } from "@data/calendarVariants";
import { isOrderReceipt } from "@utils/orderValidation";
import { atom } from "nanostores";
import type { ShippingAddress } from "./orderStore";

export interface OrderDetails {
  variant: CalendarVariantId;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  shippingCost: number;
  total: number;
  shipping: ShippingAddress & { department: string; city: string };
  customer: {
    fullName: string;
    phone: string;
    email: string;
    documentId: string;
  };
}

export interface OrderReceipt extends OrderDetails {
  orderId: string;
  createdAt: string;
  syncStatus: "synced" | "fallback";
}

const STORAGE_KEY = "calendar-current-order";

export const $currentOrder = atom<OrderReceipt | null>(null);

if (typeof window !== "undefined") {
  try {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed: unknown = JSON.parse(saved);
      if (!isOrderReceipt(parsed)) throw new Error("Invalid order receipt");
      $currentOrder.set(parsed);
    }
  } catch (error) {
    console.warn(
      "Could not restore order receipt from session storage.",
      error,
    );
  }

  $currentOrder.listen((receipt) => {
    try {
      if (receipt)
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(receipt));
      else window.sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Could not save order receipt to session storage.", error);
    }
  });
}
