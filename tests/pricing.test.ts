import { describe, expect, it } from "bun:test";
import {
	applyPromoCode,
	calculateDeliveryFee,
	calculateOrderTotal,
	calculateSurge,
	PROMO_CODES,
} from "../src/pricing";

// ─── B1: calculateDeliveryFee ──────────────────────────────────────────────

describe("calculateDeliveryFee", () => {
	it("should return base fee of €2 when distance is within 3km and weight is normal", () => {
		// Arrange / Act / Assert
		expect(calculateDeliveryFee(2, 1)).toBe(2.0);
	});

	it("should add €0.50 per km beyond 3km when distance is between 3 and 10km", () => {
		// 2 + (7-3)*0.5 = 4.00
		expect(calculateDeliveryFee(7, 3)).toBe(4.0);
	});

	it("should add €1.50 weight surcharge when weight exceeds 5kg", () => {
		// 2 + (5-3)*0.5 + 1.5 = 4.50
		expect(calculateDeliveryFee(5, 8)).toBe(4.5);
	});

	it("should return base fee when distance is exactly 3km (boundary)", () => {
		expect(calculateDeliveryFee(3, 1)).toBe(2.0);
	});

	it("should return fee when distance is exactly 10km (boundary)", () => {
		// 2 + (10-3)*0.5 = 5.50
		expect(calculateDeliveryFee(10, 1)).toBe(5.5);
	});

	it("should not apply weight surcharge when weight is exactly 5kg", () => {
		expect(calculateDeliveryFee(3, 5)).toBe(2.0);
	});

	it("should return null when distance exceeds 10km (rejected)", () => {
		expect(calculateDeliveryFee(15, 1)).toBeNull();
	});

	it("should return error when distance is negative", () => {
		expect(calculateDeliveryFee(-1, 1)).toHaveProperty("error");
	});

	it("should return error when weight is negative", () => {
		expect(calculateDeliveryFee(5, -1)).toHaveProperty("error");
	});

	it("should return €3.50 for 6km and 2kg (precise calculation)", () => {
		// 2 + (6-3)*0.5 = 3.50
		expect(calculateDeliveryFee(6, 2)).toBe(3.5);
	});

	it("should return €7.00 for 10km and 6kg (precise calculation with weight surcharge)", () => {
		// 2 + (10-3)*0.5 + 1.5 = 7.00
		expect(calculateDeliveryFee(10, 6)).toBe(7.0);
	});
});

// ─── B1: applyPromoCode ────────────────────────────────────────────────────

describe("applyPromoCode", () => {
	it("should apply 20% discount when BIENVENUE20 is used on a €50 order", () => {
		const result = applyPromoCode(50, "BIENVENUE20", PROMO_CODES);
		expect(result).toEqual({ price: 40, discount: 10 });
	});

	it("should apply fixed €5 discount when REDUC5 is used on a €30 order", () => {
		const result = applyPromoCode(30, "REDUC5", PROMO_CODES);
		expect(result).toEqual({ price: 25, discount: 5 });
	});

	it("should accept promo when subtotal meets minimum order requirement exactly", () => {
		const result = applyPromoCode(15, "BIENVENUE20", PROMO_CODES);
		expect(result).not.toHaveProperty("error");
	});

	it("should return error when promo code has expired", () => {
		const result = applyPromoCode(50, "EXPIRED", PROMO_CODES);
		expect(result).toHaveProperty("error");
	});

	it("should return error when subtotal is below minimum order requirement", () => {
		const result = applyPromoCode(10, "BIENVENUE20", PROMO_CODES);
		expect(result).toHaveProperty("error");
	});

	it("should return error when promo code is unknown", () => {
		const result = applyPromoCode(50, "UNKNOWN_CODE", PROMO_CODES);
		expect(result).toHaveProperty("error");
	});

	it("should cap final price at €0 when 100% discount is applied", () => {
		const result = applyPromoCode(20, "TOTAL100", PROMO_CODES);
		expect(result).toEqual({ price: 0, discount: 20 });
	});

	it("should return error when promo code is null", () => {
		const result = applyPromoCode(50, null, PROMO_CODES);
		expect(result).toHaveProperty("error");
	});

	it("should return error when subtotal is negative", () => {
		const result = applyPromoCode(-5, "BIENVENUE20", PROMO_CODES);
		expect(result).toHaveProperty("error");
	});

	it("should return zero discount when subtotal is €0 with 100% promo", () => {
		const result = applyPromoCode(0, "TOTAL100", PROMO_CODES);
		expect(result).toEqual({ price: 0, discount: 0 });
	});
});

// ─── B1: calculateSurge ───────────────────────────────────────────────────

describe("calculateSurge", () => {
	it("should return 1.0 during regular afternoon hours on Tuesday", () => {
		expect(calculateSurge(15, 2)).toBe(1.0);
	});

	it("should return 1.3 during lunch hours on Wednesday (12h30)", () => {
		// 12.5 = 12h30, in [12, 13.5) → lunch surge
		expect(calculateSurge(12.5, 3)).toBe(1.3);
	});

	it("should return 1.5 during dinner hours on Thursday", () => {
		expect(calculateSurge(20, 4)).toBe(1.5);
	});

	it("should return 1.8 on Friday evening", () => {
		expect(calculateSurge(21, 5)).toBe(1.8);
	});

	it("should return 1.2 on Sunday regardless of hour", () => {
		expect(calculateSurge(14, 0)).toBe(1.2);
	});

	it("should return 1.0 at 11h30 on Monday (end of morning slot, before lunch)", () => {
		// 11.5 = 11h30 → [10, 12) → 1.0
		expect(calculateSurge(11.5, 1)).toBe(1.0);
	});

	it("should return 1.5 at exactly 19h00 on Tuesday (dinner start boundary)", () => {
		expect(calculateSurge(19, 2)).toBe(1.5);
	});

	it("should return 0 at exactly 22h00 on Wednesday (closed boundary)", () => {
		expect(calculateSurge(22, 3)).toBe(0);
	});

	it("should return 0 at 9h59 (before opening hour)", () => {
		// 9.98 ≈ 9h59
		expect(calculateSurge(9.98, 1)).toBe(0);
	});

	it("should return 1.0 at exactly 10h00 (opening hour)", () => {
		expect(calculateSurge(10, 1)).toBe(1.0);
	});
});

// ─── B1: calculateOrderTotal ──────────────────────────────────────────────

const pizzaItems = [{ name: "Pizza", price: 12.5, quantity: 2 }];
// subtotal = 25.00, deliveryFee(5km, 2kg) = 3.00

describe("calculateOrderTotal", () => {
	it("should return correct breakdown for a normal order on Tuesday afternoon", () => {
		// Arrange
		const result = calculateOrderTotal(pizzaItems, 5, 2, null, 15, 2);
		// Assert
		expect(result).toEqual({
			subtotal: 25,
			discount: 0,
			deliveryFee: 3,
			surge: 1.0,
			total: 28,
		});
	});

	it("should apply promo discount correctly when BIENVENUE20 is used", () => {
		// subtotal=25, discount=5, deliveryFee=3, surge=1.0 → total=23
		const result = calculateOrderTotal(pizzaItems, 5, 2, "BIENVENUE20", 15, 2);
		expect(result).toEqual({
			subtotal: 25,
			discount: 5,
			deliveryFee: 3,
			surge: 1.0,
			total: 23,
		});
	});

	it("should apply 1.8 surge multiplier to delivery fee on Friday evening", () => {
		// subtotal=25, discount=0, deliveryFee=3, surge=1.8 → total=25+3*1.8=30.4
		const result = calculateOrderTotal(pizzaItems, 5, 2, null, 20, 5);
		expect(result).toEqual({
			subtotal: 25,
			discount: 0,
			deliveryFee: 3,
			surge: 1.8,
			total: 30.4,
		});
	});

	it("should return error when cart is empty", () => {
		const result = calculateOrderTotal([], 5, 2, null, 15, 2);
		expect(result).toHaveProperty("error");
	});

	it("should return error when an item has zero quantity", () => {
		const result = calculateOrderTotal(
			[{ name: "Pizza", price: 12.5, quantity: 0 }],
			5,
			2,
			null,
			15,
			2,
		);
		expect(result).toHaveProperty("error");
	});

	it("should return error when an item has negative price", () => {
		const result = calculateOrderTotal(
			[{ name: "Pizza", price: -5, quantity: 1 }],
			5,
			2,
			null,
			15,
			2,
		);
		expect(result).toHaveProperty("error");
	});

	it("should return error when order is placed at 23h00 (restaurant closed)", () => {
		const result = calculateOrderTotal(pizzaItems, 5, 2, null, 23, 2);
		expect(result).toHaveProperty("error");
	});

	it("should return error when delivery distance exceeds 10km", () => {
		const result = calculateOrderTotal(pizzaItems, 15, 2, null, 15, 2);
		expect(result).toHaveProperty("error");
	});

	it("should return an object with all required fields on success", () => {
		const result = calculateOrderTotal(pizzaItems, 5, 2, null, 15, 2);
		expect(result).toHaveProperty("subtotal");
		expect(result).toHaveProperty("discount");
		expect(result).toHaveProperty("deliveryFee");
		expect(result).toHaveProperty("surge");
		expect(result).toHaveProperty("total");
	});

	it("should set discount to 0 when no promo code is applied", () => {
		const result = calculateOrderTotal(pizzaItems, 5, 2, null, 15, 2);
		if ("discount" in result) {
			expect(result.discount).toBe(0);
		}
	});
});
