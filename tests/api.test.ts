import { beforeEach, describe, expect, it } from "bun:test";
import { app, resetOrders } from "../src/app";

// Helper to send requests through the Elysia app without a live server
const post = (path: string, body: unknown) =>
	app.handle(
		new Request(`http://localhost${path}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		}),
	);

const get = (path: string) =>
	app.handle(new Request(`http://localhost${path}`));

const defaultOrder = {
	items: [{ name: "Pizza", price: 12.5, quantity: 2 }],
	distance: 5,
	weight: 2,
	hour: 15,
	dayOfWeek: 2, // Tuesday
};

// ─── B2: POST /orders/simulate ─────────────────────────────────────────────

describe("POST /orders/simulate", () => {
	beforeEach(() => resetOrders());

	it("should return 200 with correct price breakdown for a valid order", async () => {
		// Arrange / Act
		const res = await post("/orders/simulate", defaultOrder);
		// Assert
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.subtotal).toBe(25);
		expect(data.deliveryFee).toBe(3);
		expect(data.surge).toBe(1.0);
		expect(data.total).toBe(28);
	});

	it("should show discount when a valid promo code is applied", async () => {
		const res = await post("/orders/simulate", {
			...defaultOrder,
			promoCode: "BIENVENUE20",
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.discount).toBeGreaterThan(0);
		expect(data.discount).toBe(5);
	});

	it("should return 400 when an expired promo code is used", async () => {
		const res = await post("/orders/simulate", {
			...defaultOrder,
			promoCode: "EXPIRED",
		});
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data).toHaveProperty("error");
	});

	it("should return 400 when the cart is empty", async () => {
		const res = await post("/orders/simulate", { ...defaultOrder, items: [] });
		expect(res.status).toBe(400);
	});

	it("should return 400 when distance exceeds 10km", async () => {
		const res = await post("/orders/simulate", {
			...defaultOrder,
			distance: 15,
		});
		expect(res.status).toBe(400);
	});

	it("should return 400 when order is placed at 23h00 (restaurant closed)", async () => {
		const res = await post("/orders/simulate", { ...defaultOrder, hour: 23 });
		expect(res.status).toBe(400);
	});

	it("should apply 1.8x surge multiplier to delivery fee on Friday evening", async () => {
		const res = await post("/orders/simulate", {
			...defaultOrder,
			hour: 20,
			dayOfWeek: 5, // Friday
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.surge).toBe(1.8);
		// total = 25 + 3 * 1.8 = 30.4
		expect(data.total).toBe(30.4);
	});
});

// ─── B2: POST /orders ──────────────────────────────────────────────────────

describe("POST /orders", () => {
	beforeEach(() => resetOrders());

	it("should return 201 with an order ID for a valid order", async () => {
		const res = await post("/orders", defaultOrder);
		expect(res.status).toBe(201);
		const data = await res.json();
		expect(data).toHaveProperty("id");
		expect(data.subtotal).toBe(25);
	});

	it("should make the order retrievable via GET /orders/:id", async () => {
		const postRes = await post("/orders", defaultOrder);
		const created = await postRes.json();
		const getRes = await get(`/orders/${created.id}`);
		expect(getRes.status).toBe(200);
		const fetched = await getRes.json();
		expect(fetched.id).toBe(created.id);
	});

	it("should assign unique IDs to multiple orders", async () => {
		const res1 = await post("/orders", defaultOrder);
		const res2 = await post("/orders", defaultOrder);
		const order1 = await res1.json();
		const order2 = await res2.json();
		expect(order1.id).not.toBe(order2.id);
	});

	it("should return 400 for an invalid order", async () => {
		const res = await post("/orders", { ...defaultOrder, items: [] });
		expect(res.status).toBe(400);
	});

	it("should not persist the order when it is invalid", async () => {
		await post("/orders", { ...defaultOrder, items: [] });
		// No order should have been saved (counter stays at 1, ID "1" doesn't exist)
		const getRes = await get("/orders/1");
		expect(getRes.status).toBe(404);
	});
});

// ─── B2: GET /orders/:id ───────────────────────────────────────────────────

describe("GET /orders/:id", () => {
	beforeEach(() => resetOrders());

	it("should return 200 with the order for an existing ID", async () => {
		const postRes = await post("/orders", defaultOrder);
		const created = await postRes.json();
		const res = await get(`/orders/${created.id}`);
		expect(res.status).toBe(200);
	});

	it("should return 404 for a non-existent order ID", async () => {
		const res = await get("/orders/999");
		expect(res.status).toBe(404);
	});

	it("should return the complete order structure with all required fields", async () => {
		const postRes = await post("/orders", defaultOrder);
		const created = await postRes.json();
		const res = await get(`/orders/${created.id}`);
		const data = await res.json();
		expect(data).toHaveProperty("id");
		expect(data).toHaveProperty("subtotal");
		expect(data).toHaveProperty("discount");
		expect(data).toHaveProperty("deliveryFee");
		expect(data).toHaveProperty("surge");
		expect(data).toHaveProperty("total");
	});
});

// ─── B2: POST /promo/validate ──────────────────────────────────────────────

describe("POST /promo/validate", () => {
	beforeEach(() => resetOrders());

	it("should return 200 with valid reduction details for an existing promo", async () => {
		const res = await post("/promo/validate", {
			promoCode: "BIENVENUE20",
			amount: 50,
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.valid).toBe(true);
		expect(data.newPrice).toBe(40);
		expect(data.discount).toBe(10);
	});

	it("should return 400 for an expired promo code", async () => {
		const res = await post("/promo/validate", {
			promoCode: "EXPIRED",
			amount: 50,
		});
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data).toHaveProperty("error");
	});

	it("should return 400 when amount is below the minimum order", async () => {
		const res = await post("/promo/validate", {
			promoCode: "BIENVENUE20",
			amount: 10,
		});
		expect(res.status).toBe(400);
	});

	it("should return 404 for an unknown promo code", async () => {
		const res = await post("/promo/validate", {
			promoCode: "NOTACODE",
			amount: 50,
		});
		expect(res.status).toBe(404);
	});

	it("should return 400 when promo code is missing from request body", async () => {
		const res = await post("/promo/validate", { amount: 50 });
		expect(res.status).toBe(400);
	});
});
