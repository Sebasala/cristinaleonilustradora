import { atom, computed } from 'nanostores';
import { calendarVariants } from '@data/calendarVariants';
import { selectedVariant } from '@stores/cartStore';

export const MIN_QTY = 1;
export const MAX_QTY = 10;

export const $itemQuantity = atom<number>(MIN_QTY);

export const $subtotal = computed(
	[selectedVariant, $itemQuantity],
	(variantId, quantity) => calendarVariants[variantId].priceCOP * quantity,
);

export const setQuantity = (value: number): void => {
	if (!Number.isFinite(value)) return;
	$itemQuantity.set(Math.min(MAX_QTY, Math.max(MIN_QTY, Math.trunc(value))));
};

export const incrementQuantity = (): void => setQuantity($itemQuantity.get() + 1);

export const decrementQuantity = (): void => setQuantity($itemQuantity.get() - 1);
