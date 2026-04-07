import { describe, expect, it } from "bun:test";
import { isValidAge, isValidEmail, isValidPassword } from "../src/validators";

// ─── A2: Fonctions de validation ───────────────────────────────────────────

describe("isValidEmail", () => {
	it("should return true when given valid simple email", () => {
		expect(isValidEmail("user@example.com")).toBe(true);
	});

	it("should return true when given valid complex email with tags and subdomain", () => {
		expect(isValidEmail("user.name+tag@domain.co")).toBe(true);
	});

	it("should return false when given string without @ symbol", () => {
		expect(isValidEmail("invalid")).toBe(false);
	});

	it("should return false when @ is at start with no local part", () => {
		expect(isValidEmail("@domain.com")).toBe(false);
	});

	it("should return false when domain part is missing after @", () => {
		expect(isValidEmail("user@")).toBe(false);
	});

	it("should return false when given empty string", () => {
		expect(isValidEmail("")).toBe(false);
	});

	it("should return false when given null", () => {
		expect(isValidEmail(null)).toBe(false);
	});
});

describe("isValidPassword", () => {
	it("should return valid true with no errors when password meets all requirements", () => {
		// Arrange
		const password = "Passw0rd!";
		// Act
		const result = isValidPassword(password);
		// Assert
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("should return valid false with length error when password is too short", () => {
		const result = isValidPassword("short");
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("8"))).toBe(true);
	});

	it("should return uppercase error when password has no uppercase letter", () => {
		const result = isValidPassword("alllowercase1!");
		expect(result.valid).toBe(false);
		expect(
			result.errors.some((e) => e.toLowerCase().includes("uppercase")),
		).toBe(true);
	});

	it("should return lowercase error when password has no lowercase letter", () => {
		const result = isValidPassword("ALLUPPERCASE1!");
		expect(result.valid).toBe(false);
		expect(
			result.errors.some((e) => e.toLowerCase().includes("lowercase")),
		).toBe(true);
	});

	it("should return digit error when password has no digit", () => {
		const result = isValidPassword("NoDigits!here");
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.toLowerCase().includes("digit"))).toBe(
			true,
		);
	});

	it("should return special character error when password has no special character", () => {
		const result = isValidPassword("NoSpecial1here");
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.toLowerCase().includes("special"))).toBe(
			true,
		);
	});

	it("should return valid false with errors when given null", () => {
		const result = isValidPassword(null);
		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it("should return multiple errors when password is missing several requirements", () => {
		const result = isValidPassword("abc");
		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(1);
	});
});

describe("isValidAge", () => {
	it("should return true when given valid middle-range age", () => {
		expect(isValidAge(25)).toBe(true);
	});

	it("should return true when given 0 (lower boundary)", () => {
		expect(isValidAge(0)).toBe(true);
	});

	it("should return true when given 150 (upper boundary)", () => {
		expect(isValidAge(150)).toBe(true);
	});

	it("should return false when given negative age", () => {
		expect(isValidAge(-1)).toBe(false);
	});

	it("should return false when given age above 150", () => {
		expect(isValidAge(151)).toBe(false);
	});

	it("should return false when given float age", () => {
		expect(isValidAge(25.5)).toBe(false);
	});

	it("should return false when given string instead of number", () => {
		expect(isValidAge("25")).toBe(false);
	});

	it("should return false when given null", () => {
		expect(isValidAge(null)).toBe(false);
	});
});
