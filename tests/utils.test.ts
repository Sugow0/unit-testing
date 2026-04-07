import { describe, expect, it } from "bun:test";
import {
	calculateAverage,
	calculateDiscount,
	capitalize,
	clamp,
	groupBy,
	parsePrice,
	slugify,
	sortStudents,
} from "../src/utils";

// ─── A1: Fonctions utilitaires ─────────────────────────────────────────────

describe("capitalize", () => {
	it("should capitalize first letter and lowercase the rest when given lowercase word", () => {
		// Arrange
		const input = "hello";
		// Act
		const result = capitalize(input);
		// Assert
		expect(result).toBe("Hello");
	});

	it("should capitalize first letter and lowercase the rest when given uppercase word", () => {
		// Arrange
		const input = "WORLD";
		// Act
		const result = capitalize(input);
		// Assert
		expect(result).toBe("World");
	});

	it("should return empty string when given empty string", () => {
		// Arrange
		const input = "";
		// Act
		const result = capitalize(input);
		// Assert
		expect(result).toBe("");
	});

	it("should return empty string when given null", () => {
		// Arrange
		const input = null;
		// Act
		const result = capitalize(input);
		// Assert
		expect(result).toBe("");
	});
});

describe("calculateAverage", () => {
	it("should return correct average when given multiple numbers", () => {
		// Arrange
		const numbers = [10, 12, 14];
		// Act
		const result = calculateAverage(numbers);
		// Assert
		expect(result).toBe(12);
	});

	it("should return the number itself when given single element array", () => {
		// Arrange
		const numbers = [15];
		// Act
		const result = calculateAverage(numbers);
		// Assert
		expect(result).toBe(15);
	});

	it("should return 0 when given empty array", () => {
		// Arrange
		const numbers: number[] = [];
		// Act
		const result = calculateAverage(numbers);
		// Assert
		expect(result).toBe(0);
	});

	it("should return 0 when given null", () => {
		// Arrange
		const numbers = null;
		// Act
		const result = calculateAverage(numbers);
		// Assert
		expect(result).toBe(0);
	});

	it("should round result to 2 decimals when average is not an integer", () => {
		// Arrange
		const numbers = [1, 2];
		// Act
		const result = calculateAverage(numbers);
		// Assert
		expect(result).toBe(1.5);
	});
});

describe("slugify", () => {
	it("should convert spaces to hyphens and lowercase when given normal phrase", () => {
		// Arrange
		const text = "Hello World";
		// Act
		const result = slugify(text);
		// Assert
		expect(result).toBe("hello-world");
	});

	it("should trim and convert spaces to hyphens when given string with surrounding spaces", () => {
		// Arrange
		const text = " Spaces Everywhere ";
		// Act
		const result = slugify(text);
		// Assert
		expect(result).toBe("spaces-everywhere");
	});

	it("should remove special characters and apostrophes when given string with punctuation", () => {
		// Arrange
		const text = "C'est l'ete !";
		// Act
		const result = slugify(text);
		// Assert
		expect(result).toBe("cest-lete");
	});

	it("should return empty string when given empty string", () => {
		// Arrange
		const text = "";
		// Act
		const result = slugify(text);
		// Assert
		expect(result).toBe("");
	});
});

describe("clamp", () => {
	it("should return value itself when value is within range", () => {
		// Arrange / Act / Assert
		expect(clamp(5, 0, 10)).toBe(5);
	});

	it("should return min when value is below minimum", () => {
		expect(clamp(-5, 0, 10)).toBe(0);
	});

	it("should return max when value exceeds maximum", () => {
		expect(clamp(15, 0, 10)).toBe(10);
	});

	it("should return 0 when min, max, and value are all 0", () => {
		expect(clamp(0, 0, 0)).toBe(0);
	});
});

// ─── A4: sortStudents (TDD) ────────────────────────────────────────────────

const students = [
	{ name: "Alice", grade: 85, age: 20 },
	{ name: "Charlie", grade: 92, age: 22 },
	{ name: "Bob", grade: 78, age: 19 },
];

describe("sortStudents", () => {
	it("should sort students by grade ascending when order is asc", () => {
		const result = sortStudents(students, "grade", "asc");
		expect(result[0].grade).toBe(78);
		expect(result[1].grade).toBe(85);
		expect(result[2].grade).toBe(92);
	});

	it("should sort students by grade descending when order is desc", () => {
		const result = sortStudents(students, "grade", "desc");
		expect(result[0].grade).toBe(92);
		expect(result[2].grade).toBe(78);
	});

	it("should sort students by name alphabetically when sortBy is name", () => {
		const result = sortStudents(students, "name", "asc");
		expect(result[0].name).toBe("Alice");
		expect(result[1].name).toBe("Bob");
		expect(result[2].name).toBe("Charlie");
	});

	it("should sort students by age ascending when sortBy is age", () => {
		const result = sortStudents(students, "age", "asc");
		expect(result[0].age).toBe(19);
		expect(result[2].age).toBe(22);
	});

	it("should return empty array when given null", () => {
		expect(sortStudents(null, "grade", "asc")).toEqual([]);
	});

	it("should return empty array when given empty array", () => {
		expect(sortStudents([], "grade", "asc")).toEqual([]);
	});

	it("should not mutate original array when sorting", () => {
		const original = [...students];
		sortStudents(students, "grade", "asc");
		expect(students).toEqual(original);
	});

	it("should sort ascending by default when order parameter is omitted", () => {
		const result = sortStudents(students, "grade");
		expect(result[0].grade).toBe(78);
		expect(result[2].grade).toBe(92);
	});
});

// ─── A5: parsePrice ────────────────────────────────────────────────────────

describe("parsePrice", () => {
	it("should parse string with dot decimal separator", () => {
		expect(parsePrice("12.99")).toBe(12.99);
	});

	it("should parse string with comma decimal separator", () => {
		expect(parsePrice("12,99")).toBe(12.99);
	});

	it("should parse string with euro symbol and trailing space", () => {
		expect(parsePrice("12.99 €")).toBe(12.99);
	});

	it("should parse string with leading euro symbol", () => {
		expect(parsePrice("€12.99")).toBe(12.99);
	});

	it("should return value as-is when given a number", () => {
		expect(parsePrice(12.99)).toBe(12.99);
	});

	it("should return 0 when given string 'gratuit'", () => {
		expect(parsePrice("gratuit")).toBe(0);
	});

	it("should return null when given non-numeric string", () => {
		expect(parsePrice("abc")).toBeNull();
	});

	it("should return null when given negative price string", () => {
		expect(parsePrice("-5.00")).toBeNull();
	});

	it("should return null when given null", () => {
		expect(parsePrice(null)).toBeNull();
	});
});

// ─── A6: groupBy ───────────────────────────────────────────────────────────

describe("groupBy", () => {
	const team = [
		{ name: "Alice", role: "dev" },
		{ name: "Bob", role: "design" },
		{ name: "Charlie", role: "dev" },
	];

	it("should group objects by key value when given valid array and existing key", () => {
		const result = groupBy(team, "role");
		expect(result.dev).toHaveLength(2);
		expect(result.design).toHaveLength(1);
	});

	it("should return empty object when given empty array", () => {
		expect(groupBy([], "role")).toEqual({});
	});

	it("should group all items under 'undefined' key when key does not exist", () => {
		const result = groupBy(team, "nonexistent");
		expect(result.undefined).toHaveLength(3);
	});

	it("should return empty object when given null", () => {
		expect(groupBy(null, "role")).toEqual({});
	});

	it("should create single group when all items share same key value", () => {
		const devs = [
			{ name: "Alice", role: "dev" },
			{ name: "Bob", role: "dev" },
		];
		const result = groupBy(devs, "role");
		expect(Object.keys(result)).toHaveLength(1);
		expect(result.dev).toHaveLength(2);
	});
});

// ─── A7: calculateDiscount ─────────────────────────────────────────────────

describe("calculateDiscount", () => {
	it("should apply percentage discount when given percentage rule", () => {
		const result = calculateDiscount(100, [{ type: "percentage", value: 10 }]);
		expect(result).toBe(90);
	});

	it("should apply fixed discount when given fixed rule", () => {
		const result = calculateDiscount(100, [{ type: "fixed", value: 5 }]);
		expect(result).toBe(95);
	});

	it("should apply buyXgetY discount when given buyXgetY rule", () => {
		const result = calculateDiscount(40, [
			{ type: "buyXgetY", buy: 3, free: 1, itemPrice: 10 },
		]);
		expect(result).toBe(30);
	});

	it("should apply rules sequentially when given multiple rules", () => {
		const result = calculateDiscount(100, [
			{ type: "percentage", value: 10 },
			{ type: "fixed", value: 5 },
		]);
		expect(result).toBe(85);
	});

	it("should return 0 when discount exceeds original price", () => {
		const result = calculateDiscount(5, [{ type: "fixed", value: 10 }]);
		expect(result).toBe(0);
	});

	it("should return error object when price is null", () => {
		const result = calculateDiscount(null, []);
		expect(result).toHaveProperty("error");
	});

	it("should return error object when rules are null", () => {
		const result = calculateDiscount(100, null);
		expect(result).toHaveProperty("error");
	});

	it("should return original price when given empty rules array", () => {
		const result = calculateDiscount(100, []);
		expect(result).toBe(100);
	});
});
