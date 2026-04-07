export const isValidEmail = (email: string | null): boolean => {
	if (!email) return false;
	const atIndex = email.indexOf("@");
	if (atIndex <= 0) return false;
	const domain = email.slice(atIndex + 1);
	if (!domain || !domain.includes(".")) return false;
	const afterDot = domain.slice(domain.lastIndexOf(".") + 1);
	return afterDot.length > 0;
};

export const isValidPassword = (
	password: string | null,
): { valid: boolean; errors: string[] } => {
	if (!password) return { valid: false, errors: ["Password is required"] };
	const errors: string[] = [];
	if (password.length < 8)
		errors.push("Password must be at least 8 characters");
	if (!/[A-Z]/.test(password))
		errors.push("Password must contain at least one uppercase letter");
	if (!/[a-z]/.test(password))
		errors.push("Password must contain at least one lowercase letter");
	if (!/[0-9]/.test(password))
		errors.push("Password must contain at least one digit");
	if (!/[!@#$%^&*]/.test(password))
		errors.push("Password must contain at least one special character");
	return { valid: errors.length === 0, errors };
};

export const isValidAge = (age: unknown): boolean => {
	if (age === null || age === undefined) return false;
	if (typeof age !== "number") return false;
	if (!Number.isInteger(age)) return false;
	return age >= 0 && age <= 150;
};
