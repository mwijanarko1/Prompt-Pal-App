import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import { TextInput } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { QuestPromptInputCard } from "@/features/game/components/QuestPromptInputCard";

describe("QuestPromptInputCard", () => {
	it("uses slot fields instead of the composed empty scaffold for locked beginner templates", async () => {
		const onChangePrompt = jest.fn();

		render(
			<QuestPromptInputCard
				prompt="Build a hero section with a , , and a"
				onChangePrompt={onChangePrompt}
				promptPlaceholder="Describe what to build..."
				scaffoldType="template"
				scaffoldTemplate="Build a hero section with a [headline], [supporting text], and a [button label]"
				beginnerTemplateLocked
			/>,
		);

		expect(
			screen.queryByDisplayValue("Build a hero section with a , , and a"),
		).toBeNull();
		expect(screen.getByPlaceholderText("headline")).toBeTruthy();
		expect(screen.getByPlaceholderText("supporting text")).toBeTruthy();
		expect(screen.getByPlaceholderText("button label")).toBeTruthy();

		fireEvent.changeText(screen.getByPlaceholderText("headline"), "Launch faster");
		await waitFor(() => {
			expect(onChangePrompt).toHaveBeenLastCalledWith(
				"Build a hero section with a Launch faster, , and a ",
			);
		});
	});

	it("keeps the plain prompt input for non-locked prompts", () => {
		render(
			<QuestPromptInputCard
				prompt="Describe a button"
				onChangePrompt={jest.fn()}
				promptPlaceholder="Describe what to build..."
			/>,
		);

		const inputs = screen.UNSAFE_getAllByType(TextInput);
		expect(inputs).toHaveLength(1);
		expect(screen.getByDisplayValue("Describe a button")).toBeTruthy();
	});
});
