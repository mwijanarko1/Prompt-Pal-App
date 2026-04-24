import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import renderer from "react-test-renderer";

import { WebViewerCloseButton } from "@/features/game/components/WebViewerCloseButton";

const mockIonicons = jest.fn(() => null);

jest.mock("@expo/vector-icons", () => {
	return {
		Ionicons: mockIonicons,
	};
});

describe("WebViewerCloseButton", () => {
	it("renders the lesson-one close button styling and handles presses", () => {
		const onPress = jest.fn();

		const tree = renderer.create(
			<WebViewerCloseButton top={28} onPress={onPress} />,
		);
		const button = tree.root.findByProps({
			accessibilityLabel: "Close full screen preview",
		});

		expect(button.props.testID).toBe("web-viewer-close-button");
		expect(button.props.hitSlop).toBe(12);
		expect(button.props.className).toBe(
			"absolute right-3 w-11 h-11 rounded-full items-center justify-center bg-surfaceElevated border border-outline/20 shadow-lg shadow-black/20",
		);
		expect(button.props.style).toEqual({
			top: 28,
			zIndex: 100,
			elevation: 0,
		});
		expect(mockIonicons).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "close",
				size: 22,
				color: "#6B7280",
			}),
			expect.anything(),
		);

		button.props.onPress();
		expect(onPress).toHaveBeenCalledTimes(1);
	});
});
