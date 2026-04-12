import { createGoogleGenerativeAI } from "@ai-sdk/google";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
	throw new Error("GEMINI_API_KEY environment variable is required");
}

export const google = createGoogleGenerativeAI({
	apiKey: GEMINI_API_KEY,
});
