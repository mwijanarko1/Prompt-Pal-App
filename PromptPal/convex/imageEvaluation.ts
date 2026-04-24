export type ByteBackedImagePart = {
	type: "image";
	image: Uint8Array;
	mediaType: string;
};

type ImagePartPayload = {
	image: Uint8Array;
	mediaType: string;
};

type ImageEvaluationContext = {
	storage: {
		get(storageId: string): Promise<Blob | null>;
	};
};

type BuildEvaluationImagePartsArgs = {
	ctx: ImageEvaluationContext;
	expectedImageUrl: string;
	userImageUrl?: string;
	userImageStorageId?: string;
};

/**
 * Converts a Blob into the byte-backed shape required by the AI SDK image parts.
 */
export async function blobToImageBytes(blob: Blob): Promise<Uint8Array> {
	return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Resolves the best available media type for an image Blob.
 */
export function resolveBlobMediaType(blob: Blob, fallback = "image/png"): string {
	return blob.type || fallback;
}

/**
 * Fetches an image URL and returns byte-backed data for AI SDK input.
 */
export async function fetchImageUrlAsPart(url: string): Promise<ImagePartPayload> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch image: ${response.status}`);
	}

	const mediaType = response.headers.get("content-type")?.split(";")[0]?.trim();
	if (!mediaType?.startsWith("image/")) {
		throw new Error(
			`Expected an image response for ${url}, received ${mediaType || "unknown content type"}.`,
		);
	}

	return {
		image: new Uint8Array(await response.arrayBuffer()),
		mediaType,
	};
}

/**
 * Converts a Blob into a fully shaped AI SDK image part.
 */
export async function blobAsImagePart(
	blob: Blob,
	fallbackMediaType?: string,
): Promise<ByteBackedImagePart> {
	return {
		type: "image",
		image: await blobToImageBytes(blob),
		mediaType: resolveBlobMediaType(blob, fallbackMediaType),
	};
}

/**
 * Builds the image parts used by backend image evaluation with storage-first user input handling.
 */
export async function buildEvaluationImageParts({
	ctx,
	expectedImageUrl,
	userImageUrl,
	userImageStorageId,
}: BuildEvaluationImagePartsArgs): Promise<
	[ByteBackedImagePart, ByteBackedImagePart]
> {
	const expectedImage = await fetchImageUrlAsPart(expectedImageUrl);
	const expectedImagePart: ByteBackedImagePart = {
		type: "image",
		...expectedImage,
	};

	if (userImageStorageId) {
		const storedUserImage = await ctx.storage.get(userImageStorageId);
		if (storedUserImage) {
			return [expectedImagePart, await blobAsImagePart(storedUserImage)];
		}
	}

	if (userImageUrl) {
		const userImage = await fetchImageUrlAsPart(userImageUrl);
		return [
			expectedImagePart,
			{
				type: "image",
				...userImage,
			},
		];
	}

	throw new Error("Unable to load generated image for evaluation.");
}
