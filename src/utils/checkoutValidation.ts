import { COLOMBIA_DEPARTMENTS } from "../data/colombiaTerritory";

export const MIN_QTY = 1;
export const MAX_QTY = 10;
export const MIN_CITY_LENGTH = 3;
export const MAX_DELIVERY_NOTES_LENGTH = 200;

export const isShippingLocationValid = (department: string, city: string): boolean =>
  COLOMBIA_DEPARTMENTS.some((item) => item === department) &&
  city.trim().length >= MIN_CITY_LENGTH;

export const shippingAddressValidity = (values: { address: string; neighborhood: string }) => ({
  address: values.address.length >= 5,
  neighborhood: values.neighborhood.length >= 2
});

export const customerContactValidity = (contact: {
  fullName: string;
  phone: string;
  email: string;
  documentId: string;
}) => {
  const words = contact.fullName.trim().split(/\s+/);
  return {
    fullName: words.length >= 2 && words.every((word) =>
      /\p{L}/u.test(word) && /^[\p{L}\p{M}]+(?:['’\-][\p{L}\p{M}]+)*$/u.test(word)
    ),
    phone: /^3\d{9}$/.test(contact.phone),
    email: /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/.test(contact.email),
    documentId: /^\d{6,10}$/.test(contact.documentId)
  };
};
