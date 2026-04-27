/** Redirect URLs that fail to open (e.g. promptpal:/// with empty path) */
const INVALID_REDIRECT_PATTERNS = [
	/^promptpal:\/\/\/?$/, // promptpal:// or promptpal:///
	/^promptpal:\/\/\s*$/, // trailing whitespace
];

const SUPPORTED_REDIRECT_PROTOCOLS = new Set(["exp:", "exps:", "http:", "https:"]);
const SUPPORTED_REDIRECT_PATHS = new Set([
	"sso-callback",
	"oauth-native-callback",
]);

function hasSupportedRedirectPath(pathname: string): boolean {
	const segments = pathname.split("/").filter(Boolean);
	const lastSegment = segments.at(-1);
	if (!lastSegment) return false;
	return SUPPORTED_REDIRECT_PATHS.has(lastSegment);
}

export function isValidOAuthRedirectUrl(url: string): boolean {
	if (!url || typeof url !== "string") return false;
	const trimmed = url.trim();

	if (trimmed.startsWith("promptpal://")) {
		const hasPath =
			trimmed.length > "promptpal://".length &&
			!INVALID_REDIRECT_PATTERNS.some((pattern) => pattern.test(trimmed));
		return hasPath;
	}

	try {
		const parsed = new URL(trimmed);

		// Expo Go and web-based auth flows can generate non-custom-scheme redirects.
		return (
			SUPPORTED_REDIRECT_PROTOCOLS.has(parsed.protocol) &&
			hasSupportedRedirectPath(parsed.pathname)
		);
	} catch {
		return false;
	}
}

export function filterOAuthRedirectCandidates(
	candidates: Array<string | null | undefined>,
): string[] {
	return Array.from(
		new Set(
			candidates
				.filter((value): value is string => Boolean(value))
				.filter(isValidOAuthRedirectUrl),
		),
	);
}
