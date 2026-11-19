import { calendarVariants, calendarVariantsList } from "@data/calendarVariants";
import {
  calculateShippingRate,
  COLOMBIA_DEPARTMENTS
} from "@data/colombiaTerritory";
import {
  selectedVariant as $selectedVariant,
  setSelectedVariant
} from "@stores/cartStore";
import { atom, computed } from "nanostores";

export const MIN_QTY = 1;
export const MAX_QTY = 10;

export const $itemQuantity = atom<number>(MIN_QTY);

export const $subtotal = computed(
  [$selectedVariant, $itemQuantity],
  (variantId, quantity) => calendarVariants[variantId].priceCOP * quantity
);

export const $shippingDepartment = atom<string>("");
export const $shippingCity = atom<string>("");

export const $shippingCost = computed(
  [$shippingDepartment, $shippingCity, $itemQuantity],
  calculateShippingRate
);

export const $grandTotal = computed(
  [$subtotal, $shippingCost],
  (subtotal, shippingCost) => subtotal + shippingCost
);

export const setQuantity = (value: number): void => {
  if (!Number.isFinite(value)) return;
  $itemQuantity.set(Math.min(MAX_QTY, Math.max(MIN_QTY, Math.trunc(value))));
};

export const incrementQuantity = (): void =>
  setQuantity($itemQuantity.get() + 1);

export const decrementQuantity = (): void =>
  setQuantity($itemQuantity.get() - 1);

const CHECKOUT_STORAGE_KEY = "calendar-checkout";

if (typeof window !== "undefined") {
  try {
    const saved = window.sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (saved !== null) {
      const state: unknown = JSON.parse(saved);
      if (typeof state !== "object" || state === null) {
        throw new Error("Invalid checkout state");
      }

      const { variant, quantity, department, city } = state as Record<
        string,
        unknown
      >;
      const savedVariant = calendarVariantsList.find(
        (item) => item.id === variant
      );
      if (
        !savedVariant ||
        typeof quantity !== "number" ||
        !Number.isInteger(quantity) ||
        quantity < MIN_QTY ||
        quantity > MAX_QTY ||
        typeof department !== "string" ||
        (department !== "" &&
          !COLOMBIA_DEPARTMENTS.some((item) => item === department)) ||
        typeof city !== "string"
      ) {
        throw new Error("Invalid checkout state");
      }

      setSelectedVariant(savedVariant.id);
      setQuantity(quantity);
      $shippingDepartment.set(department);
      $shippingCity.set(city);
    }
  } catch (error) {
    console.warn(
      "Could not restore checkout state from session storage.",
      error
    );
  }

  const persistCheckout = (): void => {
    try {
      window.sessionStorage.setItem(
        CHECKOUT_STORAGE_KEY,
        JSON.stringify({
          variant: $selectedVariant.get(),
          quantity: $itemQuantity.get(),
          department: $shippingDepartment.get(),
          city: $shippingCity.get()
        })
      );
    } catch (error) {
      console.warn("Could not save checkout state to session storage.", error);
    }
  };

  $selectedVariant.listen(persistCheckout);
  $itemQuantity.listen(persistCheckout);
  $shippingDepartment.listen(persistCheckout);
  $shippingCity.listen(persistCheckout);
}
