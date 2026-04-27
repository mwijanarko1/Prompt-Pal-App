import React, {
	useCallback,
	useEffect,
	useMemo,
	useState,
	type RefObject,
} from "react";
import { Text, TextInput, View } from "react-native";
import {
	composePromptFromScaffoldSlots,
	isBeginnerSlotContentMeaningful,
	parseScaffoldPlaceholders,
} from "@/features/game/utils/scaffold";

export interface BeginnerTemplatePromptInputProps {
	template: string;
	onChangePrompt: (text: string) => void;
	/** Slot values only (joined), for checklist matching. */
	onSlotValuesJoinedChange?: (joinedSlotText: string) => void;
	/** Per-slot values in placeholder order, for ordinal checklist UI. */
	onSlotValuesArrayChange?: (values: string[]) => void;
	/** Fires when every slot has meaningful text, not a single letter or punctuation-only. */
	onAllSlotsFilledChange?: (allFilled: boolean) => void;
	onPromptFocus?: () => void;
	inputAccessoryViewID?: string;
	firstInputRef?: RefObject<TextInput | null>;
	className?: string;
}

/**
 * Beginner template: fixed copy from the scaffold with only `[slot]` regions editable.
 */
export function BeginnerTemplatePromptInput({
	template,
	onChangePrompt,
	onSlotValuesJoinedChange,
	onSlotValuesArrayChange,
	onAllSlotsFilledChange,
	onPromptFocus,
	inputAccessoryViewID,
	firstInputRef,
	className = "",
}: BeginnerTemplatePromptInputProps) {
	const { segments, hints } = useMemo(
		() => parseScaffoldPlaceholders(template),
		[template],
	);

	const [slots, setSlots] = useState<string[]>(() =>
		Array(hints.length).fill(""),
	);

	useEffect(() => {
		setSlots(Array(hints.length).fill(""));
	}, [template, hints.length]);

	useEffect(() => {
		if (hints.length === 0) {
			onAllSlotsFilledChange?.(true);
			return;
		}
		const filled = slots.every((s) => isBeginnerSlotContentMeaningful(s));
		onAllSlotsFilledChange?.(filled);
	}, [hints.length, slots, onAllSlotsFilledChange]);

	useEffect(() => {
		const joined = slots
			.map((s) => s.trim())
			.filter(Boolean)
			.join(" ");
		onSlotValuesArrayChange?.(slots);
		onSlotValuesJoinedChange?.(joined);
	}, [slots, onSlotValuesJoinedChange, onSlotValuesArrayChange]);

	const setSlotAt = useCallback(
		(index: number, text: string) => {
			setSlots((prev) => {
				const next = [...prev];
				next[index] = text;
				// Defer parent updates so this state updater never synchronously
				// updates the parent while React is rendering this component.
				queueMicrotask(() => {
					onChangePrompt(composePromptFromScaffoldSlots(segments, next));
				});
				return next;
			});
		},
		[onChangePrompt, segments],
	);

	const inputClass =
		"text-lg text-primary font-semibold min-w-[72px] max-w-[220px] border-b-2 border-primary/35 bg-transparent py-0.5 px-1 mx-0.5 mb-1";
	const staticTextClass = "text-lg text-onSurface leading-7 mb-1";

	return (
		<View className={`flex-row flex-wrap items-end ${className}`}>
			{segments.map((segment, i) => (
				<React.Fragment key={`slot-row-${i}`}>
					{segment ? (
						<Text className={staticTextClass} selectable={false}>
							{segment}
						</Text>
					) : null}
					{i < hints.length ? (
						<TextInput
							ref={i === 0 ? firstInputRef : undefined}
							className={inputClass}
							value={slots[i] ?? ""}
							onChangeText={(t) => setSlotAt(i, t)}
							onFocus={i === 0 ? onPromptFocus : undefined}
							placeholder={hints[i]}
							placeholderTextColor="#9CA3AF"
							scrollEnabled={false}
							inputAccessoryViewID={inputAccessoryViewID}
							accessibilityLabel={hints[i]}
							autoCapitalize="sentences"
						/>
					) : null}
				</React.Fragment>
			))}
		</View>
	);
}
