import { Elysia } from "elysia";
import { applyPromoCode, calculateOrderTotal, PROMO_CODES } from "./pricing";

type StoredOrder = {
	id: string;
	subtotal: number;
	discount: number;
	deliveryFee: number;
	surge: number;
	total: number;
};

type OrderBody = {
	items: { name: string; price: number; quantity: number }[];
	distance: number;
	weight: number;
	promoCode?: string;
	hour: number;
	dayOfWeek: number;
};

let orders = new Map<string, StoredOrder>();
let counter = 1;

export const resetOrders = () => {
	orders = new Map();
	counter = 1;
};

export const app = new Elysia()
	.post("/orders/simulate", ({ body, set }) => {
		const b = body as OrderBody;
		const result = calculateOrderTotal(
			b.items,
			b.distance,
			b.weight,
			b.promoCode ?? null,
			b.hour,
			b.dayOfWeek,
		);
		if ("error" in result) {
			set.status = 400;
			return result;
		}
		return result;
	})
	.post("/orders", ({ body, set }) => {
		const b = body as OrderBody;
		const result = calculateOrderTotal(
			b.items,
			b.distance,
			b.weight,
			b.promoCode ?? null,
			b.hour,
			b.dayOfWeek,
		);
		if ("error" in result) {
			set.status = 400;
			return result;
		}
		const id = String(counter++);
		const order: StoredOrder = { id, ...result };
		orders.set(id, order);
		set.status = 201;
		return order;
	})
	.get("/orders/:id", ({ params, set }) => {
		const order = orders.get(params.id);
		if (!order) {
			set.status = 404;
			return { error: "Order not found" };
		}
		return order;
	})
	.post("/promo/validate", ({ body, set }) => {
		const b = body as { promoCode?: string; amount?: number };
		if (!b?.promoCode) {
			set.status = 400;
			return { error: "Promo code is required" };
		}
		const result = applyPromoCode(b.amount ?? 0, b.promoCode, PROMO_CODES);
		if ("error" in result) {
			set.status = result.error === "Unknown promo code" ? 404 : 400;
			return result;
		}
		return { valid: true, newPrice: result.price, discount: result.discount };
	});
