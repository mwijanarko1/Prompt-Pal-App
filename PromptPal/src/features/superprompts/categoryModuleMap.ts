import type { GenerateCategory } from "./types";

/** Maps Generate surface category to learning module route id. */
export function learningModuleIdForCategory(
	category: GenerateCategory,
): string {
	switch (category) {
		case "image":
			return "image-generation";
		case "copy":
			return "copywriting";
		case "code":
			return "coding-logic";
		default: {
			const _exhaustive: never = category;
			return _exhaustive;
		}
	}
}
