import { describe, expect, it } from "@jest/globals";
import {
	filterOAuthRedirectCandidates,
	isValidOAuthRedirectUrl,
} from "@/lib/oauthRedirectCandidates";

describe("oauthRedirectCandidates", () => {
	it("accepts custom-scheme, Expo Go, and web auth callback URLs", () => {
		expect(isValidOAuthRedirectUrl("promptpal://sso-callback")).toBe(true);
		expect(
			isValidOAuthRedirectUrl("exp://127.0.0.1:8081/--/sso-callback"),
		).toBe(true);
		expect(
			isValidOAuthRedirectUrl("https://promptpal.dev/oauth-native-callback"),
		).toBe(true);
	});

	it("rejects malformed or unrelated callback URLs", () => {
		expect(isValidOAuthRedirectUrl("promptpal:///")).toBe(false);
		expect(isValidOAuthRedirectUrl("https://promptpal.dev/healthcheck")).toBe(
			false,
		);
		expect(isValidOAuthRedirectUrl("exp://127.0.0.1:8081")).toBe(false);
	});

	it("filters invalid candidates while preserving order and uniqueness", () => {
		expect(
			filterOAuthRedirectCandidates([
				"https://promptpal.dev/not-the-auth-callback",
				"exp://127.0.0.1:8081/--/sso-callback",
				"promptpal:/// ",
				"promptpal://oauth-native-callback",
				"exp://127.0.0.1:8081/--/sso-callback",
				"promptpal://sso-callback",
			]),
		).toEqual([
			"exp://127.0.0.1:8081/--/sso-callback",
			"promptpal://oauth-native-callback",
			"promptpal://sso-callback",
		]);
	});
});
