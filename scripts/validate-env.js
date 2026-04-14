const required = [
	"EXPO_PUBLIC_CONVEX_URL",
	"EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
	console.error("Missing required env vars:", missing.join(", "));
	console.error(
		"For EAS: eas secret:create --scope project --name <name> --value <value>",
	);
	process.exit(1);
}

if (
	process.env.EXPO_PUBLIC_REQUIRE_SUBSCRIPTION === "1" &&
	!process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
) {
	console.warn(
		"Subscription gate is enabled, but EXPO_PUBLIC_REVENUECAT_IOS_API_KEY is missing.",
	);
}

if (
	process.env.EXPO_PUBLIC_REQUIRE_SUBSCRIPTION === "1" &&
	!process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL
) {
	console.warn(
		"Subscription gate is enabled, but EXPO_PUBLIC_PRIVACY_POLICY_URL is missing.",
	);
}
