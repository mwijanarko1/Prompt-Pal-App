import { createGoogleGenerativeAI } from "@ai-sdk/google";

const GEMINI_API_KEY =
	process.env.GEMINI_API_KEY?.trim() ||
	process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
	process.env.GOOGLE_API_KEY?.trim();
if (!GEMINI_API_KEY) {
	throw new Error("GEMINI_API_KEY environment variable is required");
}

export const google = createGoogleGenerativeAI({
	apiKey: GEMINI_API_KEY,
});
