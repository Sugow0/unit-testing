export const capitalize = (str: string | null): string => {
	if (!str) return "";
	return str[0].toUpperCase() + str.slice(1).toLowerCase();
};

export const calculateAverage = (numbers: number[] | null): number => {
	if (!numbers || numbers.length === 0) return 0;
	const sum = numbers.reduce((acc, n) => acc + n, 0);
	return Math.round((sum / numbers.length) * 100) / 100;
};

export const slugify = (text: string | null): string => {
	if (!text) return "";
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, "")
		.trim()
		.replace(/\s+/g, "-");
};

export const clamp = (value: number, min: number, max: number): number => {
	return Math.min(Math.max(value, min), max);
};

type Student = { name: string; grade: number; age: number };

export const sortStudents = (
	students: Student[] | null,
	sortBy: "name" | "grade" | "age",
	order: "asc" | "desc" = "asc",
): Student[] => {
	if (!students || students.length === 0) return [];
	const copy = [...students];
	copy.sort((a, b) => {
		const aVal = a[sortBy];
		const bVal = b[sortBy];
		if (aVal < bVal) return order === "asc" ? -1 : 1;
		if (aVal > bVal) return order === "asc" ? 1 : -1;
		return 0;
	});
	return copy;
};

export const parsePrice = (input: string | number | null): number | null => {
	if (input === null || input === undefined) return null;
	if (typeof input === "number") return input >= 0 ? input : null;
	if (input.toLowerCase() === "gratuit") return 0;
	const cleaned = input.replace(/[€$\s]/g, "").replace(",", ".");
	const value = parseFloat(cleaned);
	if (Number.isNaN(value)) return null;
	if (value < 0) return null;
	return value;
};

export const groupBy = <T extends Record<string, unknown>>(
	array: T[] | null,
	key: string,
): Record<string, T[]> => {
	if (!array) return {};
	return array.reduce(
		(groups, item) => {
			const groupKey = String(item[key] ?? "undefined");
			if (!groups[groupKey]) groups[groupKey] = [];
			groups[groupKey].push(item);
			return groups;
		},
		{} as Record<string, T[]>,
	);
};

type DiscountRule =
	| { type: "percentage"; value: number }
	| { type: "fixed"; value: number }
	| { type: "buyXgetY"; buy: number; free: number; itemPrice: number };

export const calculateDiscount = (
	price: number | null,
	discountRules: DiscountRule[] | null,
): number | { error: string } => {
	if (price === null || price === undefined) return { error: "Invalid price" };
	if (!discountRules) return { error: "Invalid rules" };
	let result = price;
	for (const rule of discountRules) {
		if (rule.type === "percentage") {
			result -= result * (rule.value / 100);
		} else if (rule.type === "fixed") {
			result -= rule.value;
		} else if (rule.type === "buyXgetY") {
			result -= rule.itemPrice;
		}
		if (result < 0) result = 0;
	}
	return Math.round(result * 100) / 100;
};
