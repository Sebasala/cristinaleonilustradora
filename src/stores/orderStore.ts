import { calendarVariants, calendarVariantsList } from "@data/calendarVariants";
import {
  calculateShippingRate,
  COLOMBIA_DEPARTMENTS
} from "@data/colombiaTerritory";
import {
  selectedVariant as $selectedVariant,
  setSelectedVariant
} from "@stores/cartStore";
import { atom, computed, map } from "nanostores";

export const MIN_QTY = 1;
export const MAX_QTY = 10;

export const $itemQuantity = atom<number>(MIN_QTY);

export const $subtotal = computed(
  [$selectedVariant, $itemQuantity],
  (variantId, quantity) => calendarVariants[variantId].priceCOP * quantity
);

export const $shippingDepartment = atom<string>("");
export const $shippingCity = atom<string>("");

export interface ShippingAddress {
  address: string;
  neighborhood: string;
  complement: string;
  deliveryNotes: string;
}

const emptyShippingAddress: ShippingAddress = {
  address: "",
  neighborhood: "",
  complement: "",
  deliveryNotes: ""
};

export const MAX_DELIVERY_NOTES_LENGTH = 200;

export const normalizeShippingAddressValue = (value: string): string =>
  value.replace(/\r?\n+/g, " ").replace(/\s{2,}/g, " ").trim();

export const $shippingAddress = map<ShippingAddress>({ ...emptyShippingAddress });

export const $shippingAddressValidity = computed($shippingAddress, (values) => {
  const address = values.address.length >= 5;
  const neighborhood = values.neighborhood.length >= 2;
  return { address, neighborhood };
});

export const setShippingAddressField = (
  field: keyof ShippingAddress,
  value: string
): void => {
  const limitedValue =
    field === "deliveryNotes"
      ? value.replace(/\r\n/g, "\n").slice(0, MAX_DELIVERY_NOTES_LENGTH)
      : value;
  $shippingAddress.setKey(field, normalizeShippingAddressValue(limitedValue));
};

const isStoredShippingAddress = (value: unknown): value is ShippingAddress =>
  typeof value === "object" &&
  value !== null &&
  "address" in value &&
  typeof value.address === "string" &&
  "neighborhood" in value &&
  typeof value.neighborhood === "string" &&
  "complement" in value &&
  typeof value.complement === "string" &&
  "deliveryNotes" in value &&
  typeof value.deliveryNotes === "string" &&
  value.deliveryNotes.replace(/\r\n/g, "\n").length <= MAX_DELIVERY_NOTES_LENGTH;

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

      const { variant, quantity, department, city, shippingAddress } = state as Record<
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

      if (shippingAddress !== undefined) {
        if (!isStoredShippingAddress(shippingAddress)) {
          console.warn("Could not restore invalid shipping address from session storage.");
        } else {
          setShippingAddressField("address", shippingAddress.address);
          setShippingAddressField("neighborhood", shippingAddress.neighborhood);
          setShippingAddressField("complement", shippingAddress.complement);
          setShippingAddressField("deliveryNotes", shippingAddress.deliveryNotes);
        }
      }
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
          city: $shippingCity.get(),
          shippingAddress: $shippingAddress.get()
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
  $shippingAddress.listen(persistCheckout);
}
