import * as AuthSession from "expo-auth-session";
import { filterOAuthRedirectCandidates } from "@/lib/oauthRedirectCandidates";

interface ClerkErrorShape {
	message?: string;
	errors?: Array<{
		code?: string;
		message?: string;
		longMessage?: string;
	}>;
}

/**
 * Provide a prioritized set of native redirect URLs for Clerk SSO.
 * Filters out malformed URLs (e.g. promptpal:///) that cause "Unable to open URL".
 */
export function getOAuthRedirectCandidates(): string[] {
	const dynamicCandidates = [
		AuthSession.makeRedirectUri({
			path: "sso-callback",
		}),
		AuthSession.makeRedirectUri({
			path: "oauth-native-callback",
		}),
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

	return filterOAuthRedirectCandidates([
		envOverride,
		...dynamicCandidates,
		...fallbacks,
	]);
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
