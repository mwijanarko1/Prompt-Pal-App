import { APICallError, RetryError } from "ai";
import type { AppAIErrorData } from "../src/lib/aiErrors";

export function getErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message) {
		return error.message;
	}

	return "Unknown AI provider error";
}

export function toProviderErrorData(error: unknown): AppAIErrorData {
	const candidate = RetryError.isInstance(error) ? error.lastError : error;
	const fallbackMessage = getErrorMessage(candidate);

	if (APICallError.isInstance(candidate)) {
		const normalized = [
			candidate.message,
			typeof candidate.responseBody === "string" ? candidate.responseBody : "",
		]
			.join(" ")
			.toLowerCase();

		if (
			candidate.statusCode === 429 &&
			(normalized.includes("quota") || normalized.includes("billing"))
		) {
			return {
				code: "AI_PROVIDER_QUOTA_EXCEEDED",
				message:
					"AI generation is temporarily unavailable right now. Please try again later.",
				retryable: false,
				provider: "gemini",
				statusCode: 429,
			};
		}

		if (candidate.statusCode === 429) {
			return {
				code: "AI_PROVIDER_RATE_LIMITED",
				message:
					"AI generation is temporarily rate limited. Please wait a moment and try again.",
				retryable: true,
				provider: "gemini",
				statusCode: 429,
			};
		}

		if ((candidate.statusCode ?? 0) >= 500) {
			return {
				code: "AI_PROVIDER_UNAVAILABLE",
				message:
					"AI generation is temporarily unavailable right now. Please try again later.",
				retryable: true,
				provider: "gemini",
				statusCode: candidate.statusCode,
			};
		}
	}

	if (
		fallbackMessage.toLowerCase().includes("billing details") ||
		fallbackMessage.toLowerCase().includes("current quota")
	) {
		return {
			code: "AI_PROVIDER_QUOTA_EXCEEDED",
			message:
				"AI generation is temporarily unavailable right now. Please try again later.",
			retryable: false,
			provider: "gemini",
			statusCode: 429,
		};
	}
	if (
		fallbackMessage.toLowerCase().includes("api key not found") ||
		fallbackMessage.toLowerCase().includes("valid api key")
	) {
		return {
			code: "AI_PROVIDER_UNAVAILABLE",
			message:
				"AI generation is unavailable because the Gemini API key is not configured on the backend.",
			retryable: false,
			provider: "gemini",
		};
	}

	return {
		code: "AI_REQUEST_FAILED",
		message: "AI generation failed. Please try again.",
		retryable: true,
		provider: "gemini",
	};
}
