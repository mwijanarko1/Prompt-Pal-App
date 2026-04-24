import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockGenerateImage = jest.fn<
	(...args: unknown[]) => Promise<{
		image: { mediaType: string; uint8Array: Uint8Array };
	}>
>();
const mockImageModel = jest.fn<(...args: unknown[]) => string>();

jest.mock("ai", () => ({
	generateImage: (...args: unknown[]) => mockGenerateImage(...args),
}));

jest.mock("../../convex/geminiClient", () => ({
	google: {
		image: (...args: unknown[]) => mockImageModel(...args),
	},
}));

import {
	generatePromptPalImage,
	toGeminiAspectRatio,
} from "../../convex/imageGeneration";

describe("imageGeneration", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("maps legacy square sizes to Gemini aspect ratios", () => {
		expect(toGeminiAspectRatio("512x512")).toBe("1:1");
		expect(toGeminiAspectRatio("1024x1024")).toBe("1:1");
		expect(toGeminiAspectRatio("1536x1536")).toBe("1:1");
		expect(toGeminiAspectRatio(undefined)).toBeUndefined();
	});

	it("uses the dedicated image API for Gemini image generation", async () => {
		const imageFile = {
			mediaType: "image/png",
			uint8Array: new Uint8Array([1, 2, 3]),
		};
		mockImageModel.mockReturnValue("image-model");
		mockGenerateImage.mockResolvedValue({ image: imageFile });

		const result = await generatePromptPalImage({
			prompt: "A retro joystick on a neon desk",
			size: "1024x1024",
		});

		expect(mockImageModel).toHaveBeenCalledWith("gemini-2.5-flash-image");
		expect(mockGenerateImage).toHaveBeenCalledWith({
			model: "image-model",
			prompt: "A retro joystick on a neon desk",
			aspectRatio: "1:1",
			maxRetries: 0,
		});
		expect(result).toBe(imageFile);
	});
});
