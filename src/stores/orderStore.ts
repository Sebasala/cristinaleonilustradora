import { calendarVariants, calendarVariantsList, DEFAULT_VARIANT_ID } from "@data/calendarVariants";
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
export const MIN_CITY_LENGTH = 3;

export const $shippingLocationValid = computed(
  [$shippingDepartment, $shippingCity],
  (department, city) =>
    COLOMBIA_DEPARTMENTS.some((item) => item === department) &&
    city.trim().length >= MIN_CITY_LENGTH
);

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

export interface CustomerContact {
  fullName: string;
  phone: string;
  email: string;
  documentId: string;
  acceptedPrivacy: boolean;
}

const emptyCustomerContact: CustomerContact = {
  fullName: "",
  phone: "",
  email: "",
  documentId: "",
  acceptedPrivacy: false
};

type ContactTextField = Exclude<keyof CustomerContact, "acceptedPrivacy">;

export const normalizeContactValue = (field: ContactTextField, value: string): string => {
  const trimmed = value.trim();
  if (field === "phone") {
    if (!/^(?:\+57|\(\+57\))?[0-9 ()-]*$/.test(trimmed)) return trimmed;
    return trimmed.replace(/[ ()-]/g, "").replace(/^\+57/, "");
  }
  if (field === "documentId") {
    return /^[\d.\s]*$/.test(trimmed) ? trimmed.replace(/[.\s]/g, "") : trimmed;
  }
  return field === "fullName" ? trimmed.replace(/\s+/g, " ") : trimmed;
};

export const $customerContact = map<CustomerContact>({ ...emptyCustomerContact });

export const setCustomerContactField = (field: ContactTextField, value: string): void => {
  $customerContact.setKey(field, normalizeContactValue(field, value));
};

export const $customerContactValidity = computed($customerContact, (contact) => {
  const words = contact.fullName.trim().split(/\s+/);
  return {
    fullName: words.length >= 2 && words.every((word) =>
      /\p{L}/u.test(word) && /^[\p{L}\p{M}]+(?:['’\-][\p{L}\p{M}]+)*$/u.test(word)
    ),
    phone: /^3\d{9}$/.test(contact.phone),
    email: /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/.test(contact.email),
    documentId: /^\d{6,10}$/.test(contact.documentId),
    acceptedPrivacy: contact.acceptedPrivacy
  };
});

export const $isContactValid = computed($customerContactValidity, (validity) =>
  Object.values(validity).every(Boolean)
);

export const $isCheckoutValid = computed(
  [$shippingLocationValid, $shippingAddressValidity, $isContactValid],
  (locationValid, addressValidity, contactValid) =>
    locationValid && addressValidity.address && addressValidity.neighborhood && contactValid
);

const isStoredCustomerContact = (value: unknown): value is Pick<
  CustomerContact, "fullName" | "phone" | "email" | "documentId"
> =>
  typeof value === "object" &&
  value !== null &&
  "fullName" in value && typeof value.fullName === "string" &&
  "phone" in value && typeof value.phone === "string" &&
  "email" in value && typeof value.email === "string" &&
  "documentId" in value && typeof value.documentId === "string";

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
let clearingCheckout = false;

export const clearCheckoutSession = (): void => {
  clearingCheckout = true;
  try {
    setSelectedVariant(DEFAULT_VARIANT_ID);
    setQuantity(MIN_QTY);
    $shippingDepartment.set("");
    $shippingCity.set("");
    $shippingAddress.set({ ...emptyShippingAddress });
    $customerContact.set({ ...emptyCustomerContact });
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
      } catch (error) {
        console.warn("Could not clear checkout state from session storage.", error);
      }
    }
  } finally {
    clearingCheckout = false;
  }
};

if (typeof window !== "undefined") {
  try {
    const saved = window.sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (saved !== null) {
      const state: unknown = JSON.parse(saved);
      if (typeof state !== "object" || state === null) {
        throw new Error("Invalid checkout state");
      }

      const { variant, quantity, department, city, shippingAddress, customerContact } = state as Record<
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

      if (customerContact !== undefined) {
        if (!isStoredCustomerContact(customerContact)) {
          console.warn("Could not restore invalid customer contact from session storage.");
        } else {
          setCustomerContactField("fullName", customerContact.fullName);
          setCustomerContactField("phone", customerContact.phone);
          setCustomerContactField("email", customerContact.email);
          setCustomerContactField("documentId", customerContact.documentId);
        }
      }
    }
  } catch {
    console.warn(
      "Could not restore checkout state from session storage."
    );
  }

  const persistCheckout = (): void => {
    if (clearingCheckout) return;
    try {
      const { fullName, phone, email, documentId } = $customerContact.get();
      window.sessionStorage.setItem(
        CHECKOUT_STORAGE_KEY,
        JSON.stringify({
          variant: $selectedVariant.get(),
          quantity: $itemQuantity.get(),
          department: $shippingDepartment.get(),
          city: $shippingCity.get(),
          shippingAddress: $shippingAddress.get(),
          customerContact: { fullName, phone, email, documentId }
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
  $customerContact.listen(persistCheckout);
}
