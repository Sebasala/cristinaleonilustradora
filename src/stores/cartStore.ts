import { atom } from 'nanostores';
import {
	type CalendarVariantId,
	calendarVariants,
	DEFAULT_VARIANT_ID,
} from '@data/calendarVariants';

/**
 * Shared Nano Store holding the currently active calendar variant id.
 * Defaults to "desk-2027".
 */
export const selectedVariant = atom<CalendarVariantId>(DEFAULT_VARIANT_ID);

/**
 * Helper to update the selected variant id safely.
 */
export const setSelectedVariant = (id: CalendarVariantId): void => {
	if (id in calendarVariants) {
		selectedVariant.set(id);
	}
};
