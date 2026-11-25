// TODO: Actualizar precios de los calendarios.
export const calendarPrices = {
  "desk-2027": 65000,
  "wall-2027": 85000,
} as const;

export type CalendarVariantId = keyof typeof calendarPrices;
