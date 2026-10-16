import deskHeroImg from "@assets/calendar/calendar-desk-hero.jpg";
import wallHeroImg from "@assets/calendar/calendar-wall-hero.jpg";
import type { ImageMetadata } from "astro";

export type CalendarVariantId = "desk-2027" | "wall-2027";

export interface CalendarVariant {
  id: CalendarVariantId;
  name: string;
  shortName: string;
  dimensions: string;
  base: string;
  priceCOP: number;
  badge: string;
  imageAsset: ImageMetadata;
  alt: string;
}

/**
 * Formats a monetary value into Colombian Pesos (es-CO).
 */
export const formatCOP = (amount: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(amount);
};

export const calendarVariants: Record<CalendarVariantId, CalendarVariant> = {
  "desk-2027": {
    alt: "Calendario de Escritorio 2027 - Cristina León",
    badge: "Ideal para el escritorio",
    base: "Base triangular plegable",
    dimensions: "15 x 21 cm (A5)",
    id: "desk-2027",
    imageAsset: deskHeroImg,
    name: "Calendario de Escritorio 2027",
    priceCOP: 65000,
    shortName: "Escritorio"
  },
  "wall-2027": {
    alt: "Calendario de Pared 2027 con Wire-O - Cristina León",
    badge: "Formato lámina decorativa",
    base: "Colgador Wire-O metálico superior",
    dimensions: "30 x 42 cm (A3)",
    id: "wall-2027",
    imageAsset: wallHeroImg,
    name: "Calendario de Pared 2027",
    priceCOP: 85000,
    shortName: "Pared"
  }
};

export const calendarVariantsList: CalendarVariant[] =
  Object.values(calendarVariants);

export const DEFAULT_VARIANT_ID: CalendarVariantId = "desk-2027";
