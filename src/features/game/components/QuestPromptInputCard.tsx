import React, { type RefObject } from "react";
import { TextInput, View } from "react-native";

import { BeginnerTemplatePromptInput } from "@/features/game/components/BeginnerTemplatePromptInput";
import { PromptScaffoldHelper } from "@/features/game/components/PromptScaffold";

interface QuestPromptInputCardProps {
	prompt: string;
	onChangePrompt: (text: string) => void;
	promptPlaceholder: string;
	scaffoldType?: "template" | "checklist" | "none";
	scaffoldTemplate?: string;
	beginnerTemplateLocked?: boolean;
	onBeginnerTemplateSlotsFilledChange?: (allFilled: boolean) => void;
	onBeginnerSlotValuesJoinedChange?: (joinedSlotText: string) => void;
	onBeginnerSlotValuesArrayChange?: (values: string[]) => void;
	checklistItems?: string[];
	matchedChecklistItems?: string[];
	inputRef?: RefObject<TextInput | null>;
	onPromptFocus?: () => void;
	inputAccessoryViewID?: string;
}

export function QuestPromptInputCard({
	prompt,
	onChangePrompt,
	promptPlaceholder,
	scaffoldType,
	scaffoldTemplate,
	beginnerTemplateLocked = false,
	onBeginnerTemplateSlotsFilledChange,
	onBeginnerSlotValuesJoinedChange,
	onBeginnerSlotValuesArrayChange,
	checklistItems,
	matchedChecklistItems,
	inputRef,
	onPromptFocus,
	inputAccessoryViewID,
}: QuestPromptInputCardProps) {
	return (
		<View className="bg-surfaceVariant/5 border border-outline/20 rounded-[24px] p-6 min-h-[160px]">
			<PromptScaffoldHelper
				scaffoldType={scaffoldType}
				scaffoldTemplate={scaffoldTemplate}
				hideTemplateCard={beginnerTemplateLocked}
				checklistItems={checklistItems}
				matchedChecklistItems={matchedChecklistItems}
			/>
			{beginnerTemplateLocked && scaffoldTemplate ? (
				<BeginnerTemplatePromptInput
					template={scaffoldTemplate}
					onChangePrompt={onChangePrompt}
					onSlotValuesJoinedChange={onBeginnerSlotValuesJoinedChange}
					onSlotValuesArrayChange={onBeginnerSlotValuesArrayChange}
					onAllSlotsFilledChange={onBeginnerTemplateSlotsFilledChange}
					onPromptFocus={onPromptFocus}
					inputAccessoryViewID={inputAccessoryViewID}
					firstInputRef={inputRef}
					className="min-h-[112px] content-start"
				/>
			) : (
				<TextInput
					ref={inputRef}
					value={prompt}
					onChangeText={onChangePrompt}
					onFocus={onPromptFocus}
					placeholder={promptPlaceholder}
					placeholderTextColor="#8E8E93"
					multiline
					inputAccessoryViewID={inputAccessoryViewID}
					style={{
						textAlignVertical: "top",
						fontSize: 18,
						color: "#000000",
						backgroundColor: "transparent",
						flex: 1,
						padding: 0,
					}}
				/>
			)}
		</View>
	);
}
