export type AppAIErrorCode =
	| "APP_QUOTA_EXCEEDED"
	| "AI_PROVIDER_QUOTA_EXCEEDED"
	| "AI_PROVIDER_RATE_LIMITED"
	| "AI_PROVIDER_UNAVAILABLE"
	| "AI_REQUEST_FAILED";

export type AppAIErrorData = {
	code: AppAIErrorCode;
	message: string;
	retryable: boolean;
	provider?: "gemini";
	statusCode?: number;
};

type AIErrorPresentation = {
	code: AppAIErrorCode;
	title: string;
	message: string;
	isOperational: boolean;
};

type ErrorWithData = {
	message?: unknown;
	data?: unknown;
};

const FALLBACK_ERROR: AIErrorPresentation = {
	code: "AI_REQUEST_FAILED",
	title: "Error",
	message: "Something went wrong. Please try again.",
	isOperational: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isAppAIErrorCode(value: unknown): value is AppAIErrorCode {
	return (
		value === "APP_QUOTA_EXCEEDED" ||
		value === "AI_PROVIDER_QUOTA_EXCEEDED" ||
		value === "AI_PROVIDER_RATE_LIMITED" ||
		value === "AI_PROVIDER_UNAVAILABLE" ||
		value === "AI_REQUEST_FAILED"
	);
}

export function isAppAIErrorData(value: unknown): value is AppAIErrorData {
	if (!isRecord(value)) {
		return false;
	}

	return (
		isAppAIErrorCode(value.code) &&
		typeof value.message === "string" &&
		typeof value.retryable === "boolean" &&
		(value.provider === undefined || value.provider === "gemini") &&
		(value.statusCode === undefined || typeof value.statusCode === "number")
	);
}

export function getAppAIErrorData(error: unknown): AppAIErrorData | null {
	if (isAppAIErrorData(error)) {
		return error;
	}

	if (isRecord(error) && isAppAIErrorData((error as ErrorWithData).data)) {
		return (error as ErrorWithData).data as AppAIErrorData;
	}

	return null;
}

function getMessageFromUnknown(error: unknown): string {
	if (error instanceof Error && typeof error.message === "string") {
		return error.message;
	}

	if (isRecord(error) && typeof (error as ErrorWithData).message === "string") {
		return (error as ErrorWithData).message as string;
	}

	return FALLBACK_ERROR.message;
}

function mapKnownErrorCode(error: AppAIErrorData): AIErrorPresentation {
	switch (error.code) {
		case "APP_QUOTA_EXCEEDED":
			return {
				code: error.code,
				title: "Usage Limit Reached",
				message: error.message,
				isOperational: true,
			};
		case "AI_PROVIDER_QUOTA_EXCEEDED":
			return {
				code: error.code,
				title: "AI Temporarily Unavailable",
				message: error.message,
				isOperational: true,
			};
		case "AI_PROVIDER_RATE_LIMITED":
			return {
				code: error.code,
				title: "AI Busy",
				message: error.message,
				isOperational: true,
			};
		case "AI_PROVIDER_UNAVAILABLE":
			return {
				code: error.code,
				title: "AI Unavailable",
				message: error.message,
				isOperational: true,
			};
		case "AI_REQUEST_FAILED":
			return {
				code: error.code,
				title: "Error",
				message: error.message,
				isOperational: false,
			};
	}
}

export function getAIErrorPresentation(error: unknown): AIErrorPresentation {
	const appError = getAppAIErrorData(error);
	if (appError) {
		return mapKnownErrorCode(appError);
	}

	const message = getMessageFromUnknown(error);
	const normalized = message.toLowerCase();

	if (normalized.includes("quota exceeded")) {
		return {
			code: "APP_QUOTA_EXCEEDED",
			title: "Usage Limit Reached",
			message,
			isOperational: true,
		};
	}

	if (
		normalized.includes("billing details") ||
		normalized.includes("current quota") ||
		(normalized.includes("quota") && normalized.includes("gemini"))
	) {
		return {
			code: "AI_PROVIDER_QUOTA_EXCEEDED",
			title: "AI Temporarily Unavailable",
			message:
				"AI generation is temporarily unavailable right now. Please try again later.",
			isOperational: true,
		};
	}

	if (
		normalized.includes("rate limit") ||
		normalized.includes("too many requests")
	) {
		return {
			code: "AI_PROVIDER_RATE_LIMITED",
			title: "AI Busy",
			message:
				"AI generation is temporarily rate limited. Please wait a moment and try again.",
			isOperational: true,
		};
	}

	return {
		...FALLBACK_ERROR,
		message,
	};
}
