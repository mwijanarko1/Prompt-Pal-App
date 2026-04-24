import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
	blobAsImagePart,
	buildEvaluationImageParts,
	fetchImageUrlAsPart,
} from "../../convex/imageEvaluation";

describe("imageEvaluation helpers", () => {
	const originalFetch = global.fetch;

	const createFetchMock = () =>
		jest.fn() as jest.MockedFunction<typeof fetch>;

	const createResponse = (response: unknown) => response as Response;

	const createStorageGetMock = () =>
		jest.fn() as jest.MockedFunction<
			(storageId: string) => Promise<Blob | null>
		>;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		global.fetch = originalFetch;
	});

	it("converts a Blob into a byte-backed image part and preserves media type", async () => {
		const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "image/webp" });

		const result = await blobAsImagePart(blob);

		expect(result).toEqual({
			type: "image",
			image: new Uint8Array([1, 2, 3]),
			mediaType: "image/webp",
		});
		expect(result.image).toBeInstanceOf(Uint8Array);
	});

	it("falls back to image/png when the Blob media type is empty", async () => {
		const blob = new Blob([new Uint8Array([4, 5, 6])]);

		const result = await blobAsImagePart(blob);

		expect(result.mediaType).toBe("image/png");
	});

	it("fetches an image URL into bytes with the response media type", async () => {
		const fetchMock = createFetchMock();
		fetchMock.mockResolvedValue(createResponse({
			ok: true,
			headers: {
				get: () => "image/jpeg",
			} as unknown as Headers,
			arrayBuffer: async () => Uint8Array.from([7, 8, 9]).buffer,
		}));
		global.fetch = fetchMock;

		const result = await fetchImageUrlAsPart("https://example.com/target.jpg");

		expect(global.fetch).toHaveBeenCalledWith("https://example.com/target.jpg");
		expect(result).toEqual({
			image: new Uint8Array([7, 8, 9]),
			mediaType: "image/jpeg",
		});
	});

	it("throws when the image fetch response is not successful", async () => {
		const fetchMock = createFetchMock();
		fetchMock.mockResolvedValue(createResponse({
			ok: false,
			status: 502,
			headers: { get: () => null } as unknown as Headers,
		}));
		global.fetch = fetchMock;

		await expect(
			fetchImageUrlAsPart("https://example.com/broken.png"),
		).rejects.toThrow("Failed to fetch image: 502");
	});

	it("throws when the fetched response is not an image", async () => {
		const fetchMock = createFetchMock();
		fetchMock.mockResolvedValue(createResponse({
			ok: true,
			headers: {
				get: () => "text/html",
			} as unknown as Headers,
			arrayBuffer: async () => Uint8Array.from([1]).buffer,
		}));
		global.fetch = fetchMock;

		await expect(
			fetchImageUrlAsPart("https://example.com/not-an-image"),
		).rejects.toThrow("Expected an image response");
	});

	it("prefers the stored user image over the user image URL", async () => {
		const storageGet = createStorageGetMock();
		storageGet.mockResolvedValue(
			new Blob([new Uint8Array([11, 12])], { type: "image/png" }),
		);
		const fetchMock = createFetchMock();
		fetchMock.mockResolvedValue(createResponse({
			ok: true,
			headers: {
				get: () => "image/png",
			} as unknown as Headers,
			arrayBuffer: async () => Uint8Array.from([21, 22]).buffer,
		}));
		global.fetch = fetchMock;

		const [expectedPart, userPart] = await buildEvaluationImageParts({
			ctx: {
				storage: {
					get: storageGet,
				},
			},
			expectedImageUrl: "https://example.com/target.png",
			userImageUrl: "https://example.com/user.png",
			userImageStorageId: "storage-123",
		});

		expect(storageGet).toHaveBeenCalledWith("storage-123");
		expect(global.fetch).toHaveBeenCalledTimes(1);
		expect(expectedPart).toEqual({
			type: "image",
			image: new Uint8Array([21, 22]),
			mediaType: "image/png",
		});
		expect(userPart).toEqual({
			type: "image",
			image: new Uint8Array([11, 12]),
			mediaType: "image/png",
		});
	});

	it("falls back to the user image URL when the stored image is missing", async () => {
		const storageGet = createStorageGetMock();
		storageGet.mockResolvedValue(null);
		const fetchMock = createFetchMock();
		fetchMock
			.mockResolvedValueOnce(createResponse({
				ok: true,
				headers: {
					get: () => "image/png",
				} as unknown as Headers,
				arrayBuffer: async () => Uint8Array.from([31]).buffer,
			}))
			.mockResolvedValueOnce(createResponse({
				ok: true,
				headers: {
					get: () => "image/webp",
				} as unknown as Headers,
				arrayBuffer: async () => Uint8Array.from([41, 42]).buffer,
			}));
		global.fetch = fetchMock;

		const [expectedPart, userPart] = await buildEvaluationImageParts({
			ctx: {
				storage: {
					get: storageGet,
				},
			},
			expectedImageUrl: "https://example.com/target.png",
			userImageUrl: "https://example.com/user.webp",
			userImageStorageId: "missing-storage-id",
		});

		expect(storageGet).toHaveBeenCalledWith("missing-storage-id");
		expect(global.fetch).toHaveBeenCalledTimes(2);
		expect(expectedPart).toEqual({
			type: "image",
			image: new Uint8Array([31]),
			mediaType: "image/png",
		});
		expect(userPart).toEqual({
			type: "image",
			image: new Uint8Array([41, 42]),
			mediaType: "image/webp",
		});
	});
});
