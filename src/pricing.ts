export type PromoCode = {
	code: string;
	type: "percentage" | "fixed";
	value: number;
	minOrder: number;
	expiresAt: string; // "YYYY-MM-DD"
};

export type OrderItem = {
	name: string;
	price: number;
	quantity: number;
};

export type OrderTotal = {
	subtotal: number;
	discount: number;
	deliveryFee: number;
	surge: number;
	total: number;
};

export const PROMO_CODES: PromoCode[] = [
	{
		code: "BIENVENUE20",
		type: "percentage",
		value: 20,
		minOrder: 15.0,
		expiresAt: "2026-12-31",
	},
	{
		code: "REDUC5",
		type: "fixed",
		value: 5,
		minOrder: 20.0,
		expiresAt: "2026-12-31",
	},
	{
		code: "EXPIRED",
		type: "percentage",
		value: 10,
		minOrder: 0,
		expiresAt: "2024-01-01",
	},
	{
		code: "TOTAL100",
		type: "percentage",
		value: 100,
		minOrder: 0,
		expiresAt: "2026-12-31",
	},
];

/**
 * Calculates delivery fee based on distance and weight.
 * Returns null if distance > 10km (rejected).
 * Returns { error } for invalid inputs.
 */
export const calculateDeliveryFee = (
	distance: number | null,
	weight: number | null,
): number | { error: string } | null => {
	if (
		distance === null ||
		distance === undefined ||
		weight === null ||
		weight === undefined
	) {
		return { error: "Invalid input" };
	}
	if (distance < 0) return { error: "Distance cannot be negative" };
	if (weight < 0) return { error: "Weight cannot be negative" };
	if (distance > 10) return null;

	let fee = 2.0;
	if (distance > 3) {
		fee += (distance - 3) * 0.5;
	}
	if (weight > 5) {
		fee += 1.5;
	}
	return Math.round(fee * 100) / 100;
};

/**
 * Applies a promo code to a subtotal.
 * Returns { price, discount } on success or { error } on failure.
 */
export const applyPromoCode = (
	subtotal: number | null,
	promoCode: string | null,
	promoCodes: PromoCode[],
): { price: number; discount: number } | { error: string } => {
	if (subtotal === null || subtotal === undefined)
		return { error: "Invalid subtotal" };
	if (subtotal < 0) return { error: "Subtotal cannot be negative" };
	if (!promoCode) return { error: "Promo code is required" };

	const promo = promoCodes.find((p) => p.code === promoCode);
	if (!promo) return { error: "Unknown promo code" };

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const expiry = new Date(promo.expiresAt);
	expiry.setHours(0, 0, 0, 0);
	if (expiry < today) return { error: "Promo code has expired" };

	if (subtotal < promo.minOrder) {
		return { error: `Minimum order of €${promo.minOrder} required` };
	}

	let newPrice: number;
	if (promo.type === "percentage") {
		newPrice = subtotal * (1 - promo.value / 100);
	} else {
		newPrice = subtotal - promo.value;
	}
	if (newPrice < 0) newPrice = 0;
	newPrice = Math.round(newPrice * 100) / 100;

	return {
		price: newPrice,
		discount: Math.round((subtotal - newPrice) * 100) / 100,
	};
};

/**
 * Returns the surge multiplier for a given hour (decimal, e.g. 12.5 = 12h30)
 * and day of week (0=Sunday, 1=Monday, ..., 6=Saturday).
 * Returns 0 when the restaurant is closed.
 */
export const calculateSurge = (hour: number, dayOfWeek: number): number => {
	if (hour < 10 || hour >= 22) return 0; // closed

	if (dayOfWeek === 0) return 1.2; // Sunday all day

	if (dayOfWeek >= 5) {
		// Friday or Saturday
		if (hour >= 19) return 1.8;
		return 1.0;
	}

	// Monday–Thursday (1–4)
	if (hour >= 19) return 1.5; // dinner
	if (hour >= 12 && hour < 13.5) return 1.3; // lunch 12:00–13:30
	return 1.0;
};

/**
 * Calculates the complete order total.
 * Returns { subtotal, discount, deliveryFee, surge, total } or { error }.
 */
export const calculateOrderTotal = (
	items: OrderItem[] | null,
	distance: number,
	weight: number,
	promoCode: string | null,
	hour: number,
	dayOfWeek: number,
): OrderTotal | { error: string } => {
	if (!items || items.length === 0) return { error: "Cart is empty" };

	for (const item of items) {
		if (item.price < 0) return { error: "Item price cannot be negative" };
		if (item.quantity <= 0) return { error: "Item quantity must be positive" };
	}

	const subtotal =
		Math.round(
			items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100,
		) / 100;

	const surge = calculateSurge(hour, dayOfWeek);
	if (surge === 0) return { error: "Restaurant is closed at this time" };

	const feeResult = calculateDeliveryFee(distance, weight);
	if (feeResult === null) return { error: "Distance too large (max 10km)" };
	if (typeof feeResult === "object" && "error" in feeResult) {
		return { error: feeResult.error };
	}
	const deliveryFee = feeResult;

	let discount = 0;
	if (promoCode) {
		const promoResult = applyPromoCode(subtotal, promoCode, PROMO_CODES);
		if ("error" in promoResult) return { error: promoResult.error };
		discount = promoResult.discount;
	}

	const total =
		Math.round((subtotal - discount + deliveryFee * surge) * 100) / 100;

	return { subtotal, discount, deliveryFee, surge, total };
};
