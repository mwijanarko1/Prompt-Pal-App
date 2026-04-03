import * as AuthSession from "expo-auth-session";

interface ClerkErrorShape {
	message?: string;
	errors?: Array<{
		code?: string;
		message?: string;
		longMessage?: string;
	}>;
}

/** Redirect URLs that fail to open (e.g. promptpal:/// with empty path) */
const INVALID_REDIRECT_PATTERNS = [
	/^promptpal:\/\/\/?$/, // promptpal:// or promptpal:///
	/^promptpal:\/\/\s*$/, // trailing whitespace
];

const EXPO_GO_REDIRECT_PREFIXES = ['exp://', 'exps://', 'https://']

function isValidRedirectUrl(url: string): boolean {
	if (!url || typeof url !== "string") return false;
	const trimmed = url.trim();

	if (trimmed.startsWith("promptpal://")) {
		const hasPath =
			trimmed.length > "promptpal://".length &&
			!INVALID_REDIRECT_PATTERNS.some((p) => p.test(trimmed));
		return hasPath;
	}

	// Expo Go and web-based auth flows can generate non-custom-scheme redirects.
	return EXPO_GO_REDIRECT_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

/**
 * Provide a prioritized set of native redirect URLs for Clerk SSO.
 * Filters out malformed URLs (e.g. promptpal:///) that cause "Unable to open URL".
 */
export function getOAuthRedirectCandidates(): string[] {
	const dynamicCandidates = [
		AuthSession.makeRedirectUri({
			scheme: "promptpal",
			path: "sso-callback",
		}),
		AuthSession.makeRedirectUri({
			scheme: "promptpal",
			path: "oauth-native-callback",
		}),
	];

	const envOverride = process.env.EXPO_PUBLIC_CLERK_OAUTH_REDIRECT_URL?.trim();
	const fallbacks = [
		"promptpal://sso-callback",
		"promptpal://oauth-native-callback",
	];

	const candidates = [envOverride, ...dynamicCandidates, ...fallbacks]
		.filter((value): value is string => Boolean(value))
		.filter(isValidRedirectUrl);

	return Array.from(new Set(candidates));
}

/**
 * Clerk errors can appear in multiple shapes. Return a useful user-facing message.
 */
export function getClerkErrorMessage(
	error: unknown,
	fallbackMessage: string,
): string {
	if (!error || typeof error !== "object") {
		return fallbackMessage;
	}

	const clerkError = error as ClerkErrorShape;
	const firstError = clerkError.errors?.[0];

	// Map known Clerk codes to friendly messages
	const code = firstError?.code;
	if (code === "form_identifier_exists") {
		return "An account with this email already exists. Sign in instead.";
	}
	if (code === "form_identifier_not_found") {
		return "No account found with this email. Please sign up.";
	}

	return (
		firstError?.longMessage ||
		firstError?.message ||
		clerkError.message ||
		fallbackMessage
	);
}
