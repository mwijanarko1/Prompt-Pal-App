import { generateImage as aiGenerateImage, type GeneratedFile } from "ai";
import { google } from "./geminiClient";

export type PromptPalImageSize = "512x512" | "1024x1024" | "1536x1536";

export function toGeminiAspectRatio(
	size?: PromptPalImageSize,
): "1:1" | undefined {
	if (!size) {
		return undefined;
	}

	return "1:1";
}

export async function generatePromptPalImage(args: {
	prompt: string;
	size?: PromptPalImageSize;
}): Promise<GeneratedFile> {
	const { image } = await aiGenerateImage({
		model: google.image("gemini-2.5-flash-image"),
		prompt: args.prompt,
		aspectRatio: toGeminiAspectRatio(args.size),
		maxRetries: 0,
	});

	return image;
}
