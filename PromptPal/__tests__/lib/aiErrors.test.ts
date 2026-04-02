import { describe, expect, it } from "@jest/globals";
import { getAIErrorPresentation, isAppAIErrorData } from "@/lib/aiErrors";

describe("aiErrors", () => {
	it("recognizes subscription-required AI errors", () => {
		const error = {
			code: "SUBSCRIPTION_REQUIRED" as const,
			message: "PromptPal Pro is required to use AI features.",
			retryable: false,
			statusCode: 403,
		};

		expect(isAppAIErrorData(error)).toBe(true);
		expect(getAIErrorPresentation(error)).toEqual({
			code: "SUBSCRIPTION_REQUIRED",
			title: "Subscription Required",
			message: "PromptPal Pro is required to use AI features.",
			isOperational: true,
		});
	});
});
