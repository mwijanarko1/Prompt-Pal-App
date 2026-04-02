import React from "react";
import { View, Text } from "react-native";
import { Card } from "@/components/ui";

export const HINT_XP_COST = 25;

type ScaffoldType = "template" | "checklist" | "none";

interface PromptScaffoldProps {
	scaffoldType?: ScaffoldType;
	scaffoldTemplate?: string;
	checklistItems?: string[];
	matchedChecklistItems?: string[];
}

const PLACEHOLDER_PATTERN = /\[[^[\]]+\]/g;

export function findFirstPlaceholderRange(
	template?: string,
): { start: number; end: number } | null {
	if (!template) return null;

	const match = PLACEHOLDER_PATTERN.exec(template);
	if (!match || match.index === undefined) return null;

	return {
		start: match.index,
		end: match.index + match[0].length,
	};
}

function renderTemplateText(template: string) {
	const segments = template.split(PLACEHOLDER_PATTERN);
	const matches = template.match(PLACEHOLDER_PATTERN) ?? [];

	return segments.flatMap((segment, index) => {
		const nodes: React.ReactNode[] = [];

		if (segment) {
			nodes.push(
				<Text key={`segment-${index}`} className="text-onSurface text-sm leading-6">
					{segment}
				</Text>,
			);
		}

		const placeholder = matches[index];
		if (placeholder) {
			nodes.push(
				<Text
					key={`placeholder-${index}`}
					className="text-primary text-sm font-black leading-6"
				>
					{placeholder}
				</Text>,
			);
		}

		return nodes;
	});
}

export function PromptScaffoldHelper({
	scaffoldType,
	scaffoldTemplate,
	checklistItems = [],
	matchedChecklistItems = [],
}: PromptScaffoldProps) {
	const shouldShowTemplate =
		scaffoldType === "template" && Boolean(scaffoldTemplate);
	const shouldShowChecklist =
		(scaffoldType === "template" || scaffoldType === "checklist") &&
		checklistItems.length > 0;

	if (!shouldShowTemplate && !shouldShowChecklist) {
		return null;
	}

	const matchedSet = new Set(matchedChecklistItems);

	return (
		<View className="mb-4">
			{shouldShowTemplate ? (
				<Card className="mb-3 rounded-[20px] border border-primary/20 bg-primary/5 p-4">
					<Text className="mb-2 text-[10px] font-black uppercase tracking-[2px] text-primary">
						Scaffold Template
					</Text>
					<Text className="text-onSurface text-sm leading-6">
						{renderTemplateText(scaffoldTemplate!)}
					</Text>
				</Card>
			) : null}

			{shouldShowChecklist ? (
				<Card className="rounded-[20px] border border-outline/15 bg-surfaceVariant/20 p-4">
					<Text className="mb-3 text-[10px] font-black uppercase tracking-[2px] text-onSurfaceVariant">
						Checklist
					</Text>
					{checklistItems.map((item) => {
						const isMatched = matchedSet.has(item);

						return (
							<View
								key={item}
								className="mb-2 flex-row items-center last:mb-0"
							>
								<View
									className={`mr-3 h-5 w-5 items-center justify-center rounded-full border ${
										isMatched
											? "border-success bg-success/20"
											: "border-outline/30 bg-surface"
									}`}
								>
									{isMatched ? (
										<Text className="text-[10px] font-black text-success">✓</Text>
									) : null}
								</View>
								<Text
									className={`flex-1 text-sm ${
										isMatched ? "text-onSurface font-semibold" : "text-onSurfaceVariant"
									}`}
								>
									{item}
								</Text>
							</View>
						);
					})}
				</Card>
			) : null}
		</View>
	);
}
