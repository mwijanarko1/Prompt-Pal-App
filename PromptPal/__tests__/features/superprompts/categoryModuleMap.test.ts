import { describe, expect, it } from "@jest/globals";
import { learningModuleIdForCategory } from "@/features/superprompts/categoryModuleMap";

describe("learningModuleIdForCategory", () => {
	it("maps image to image-generation", () => {
		expect(learningModuleIdForCategory("image")).toBe("image-generation");
	});

	it("maps copy to copywriting", () => {
		expect(learningModuleIdForCategory("copy")).toBe("copywriting");
	});

	it("maps code to coding-logic", () => {
		expect(learningModuleIdForCategory("code")).toBe("coding-logic");
	});
});
