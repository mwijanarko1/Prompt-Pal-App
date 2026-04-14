export type PracticeEvaluation = {
	success: boolean;
	text: string;
	takeaway: string;
	nudge?: string;
	score: number;
	code: string;
};

const containsAny = (text: string, patterns: RegExp[]) =>
	patterns.some((pattern) => pattern.test(text));

const joinMissingParts = (parts: string[]) => {
	if (parts.length === 0) return "";
	if (parts.length === 1) return parts[0];
	if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
	return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
};

export const delay = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

export function evaluatePractice1Prompt(prompt: string): PracticeEvaluation {
	const normalizedPrompt = prompt.toLowerCase();

	const hasButton = containsAny(normalizedPrompt, [/\bbutton\b/, /\bcta\b/]);
	const hasBehavior = containsAny(normalizedPrompt, [
		/\balert\b/,
		/\bon click\b/,
		/\bwhen clicked\b/,
		/\bshow\b.*\bhello\b/,
		/\bclick\b/,
	]);
	const hasStyle = containsAny(normalizedPrompt, [
		/\borange\b/,
		/\brounded\b/,
		/\bround\b/,
		/\bwhite text\b/,
	]);
	const matchesLabel = containsAny(normalizedPrompt, [
		/\bsay hello\b/,
		/\bhello\b/,
	]);

	const score =
		(hasButton ? 1 : 0) +
		(hasBehavior ? 2 : 0) +
		(hasStyle ? 1 : 0) +
		(matchesLabel ? 2 : 0);

	const success = hasButton && hasBehavior && score >= 3;
	const missingParts = [
		!hasButton && "a clear button subject",
		!matchesLabel && 'the "Say Hello" label',
		!hasBehavior && "what happens when the button is clicked",
		!hasStyle && "visual details like orange and rounded",
	].filter(Boolean) as string[];

	return {
		success,
		score,
		text: success
			? "Nice work. You described both the button and its behavior clearly."
			: "Your prompt has some of the right pieces, but it is still missing important details.",
		nudge: success
			? undefined
			: `Add ${joinMissingParts(missingParts)} so the instruction is complete.`,
		takeaway:
			"Combining structure (what it looks like) and behavior (what it does) is what makes a prompt actionable.",
		code: `<button
  style="
    background: ${hasStyle ? "#FF6B00" : "#94A3B8"};
    color: white;
    border: 0;
    padding: 12px 20px;
    border-radius: ${hasStyle ? "10px" : "4px"};
    font-weight: 700;
  "
  ${hasBehavior ? `onclick="alert('${matchesLabel ? "Hello!" : "Hi!"}')"` : ""}
>
  ${matchesLabel ? "Say Hello" : "Button"}
</button>`,
	};
}

export function evaluatePractice2Prompt(prompt: string): PracticeEvaluation {
	const normalizedPrompt = prompt.toLowerCase();

	const hasInput = containsAny(normalizedPrompt, [
		/\binput\b/,
		/\btext field\b/,
		/\btextbox\b/,
		/\btype\b/,
	]);
	const hasAddMechanism = containsAny(normalizedPrompt, [
		/\bbutton\b/,
		/\badd\b/,
		/\benter\b/,
		/\bclick\b/,
	]);
	const taskAppearsInList = containsAny(normalizedPrompt, [
		/\bappend\b/,
		/\badd to (the )?list\b/,
		/\bshow up\b/,
		/\btask list\b/,
		/\bnew task\b/,
	]);
	const inputClears = containsAny(normalizedPrompt, [
		/\bclear\b/,
		/\breset\b/,
		/\bempty\b.*\binput\b/,
	]);

	const score =
		(hasInput ? 1 : 0) +
		(hasAddMechanism ? 2 : 0) +
		(taskAppearsInList ? 2 : 0) +
		(inputClears ? 1 : 0);

	const success =
		hasInput && hasAddMechanism && taskAppearsInList && score >= 4;
	const missingParts = [
		!hasInput && "an input field",
		!hasAddMechanism && "how the user triggers the add action",
		!taskAppearsInList && "that the new task should appear in the list",
		!inputClears && "that the input should clear afterwards",
	].filter(Boolean) as string[];

	return {
		success,
		score,
		text: success
			? "You described the full interaction, not just the UI. That is the right level of specificity."
			: "The prompt still reads a bit too loosely for an interactive feature.",
		nudge: success
			? undefined
			: `Spell out ${joinMissingParts(missingParts)} so the behavior is testable.`,
		takeaway:
			"For interactive features, step-by-step user behavior matters as much as the visible components.",
		code: `<div class="mt-4 flex gap-2">
  ${hasInput ? `<input id="newTask" type="text" placeholder="New task..." class="border p-2 rounded w-full" />` : ""}
  ${hasAddMechanism ? `<button id="addBtn" class="bg-blue-500 text-white px-4 py-2 rounded">Add</button>` : ""}
</div>
<script>
  const input = document.getElementById('newTask');
  const list = document.getElementById('taskList');
  ${
		hasAddMechanism
			? `document.getElementById('addBtn')?.addEventListener('click', () => {
    const value = input?.value?.trim();
    ${
			taskAppearsInList
				? `if (value) {
      const li = document.createElement('li');
      li.className = 'border p-3 rounded bg-white';
      li.textContent = value;
      list?.appendChild(li);
      ${inputClears ? "input.value = '';" : ""}
    }`
				: ""
		}
  });`
			: ""
	}
</script>`,
	};
}

export function evaluatePractice3Prompt(prompt: string): PracticeEvaluation {
	const normalizedPrompt = prompt.toLowerCase();

	const togglesCompletedState = containsAny(normalizedPrompt, [
		/\bline-through\b/,
		/\bstrikethrough\b/,
		/\bcross(ed)? out\b/,
		/\btoggle\b.*\bcomplete\b/,
		/\bmark\b.*\bcomplete\b/,
	]);
	const blocksEmptyInput = containsAny(normalizedPrompt, [
		/\bempty\b/,
		/\bblank\b/,
		/\btrim\b/,
		/\bdon't add\b/,
		/\bdo not add\b/,
		/\bprevent\b.*\bempty\b/,
	]);
	const newTasksClickable = containsAny(normalizedPrompt, [
		/\bnew tasks?\b.*\bclick/,
		/\bnew items?\b.*\bclick/,
		/\bsame behavior\b/,
		/\bnew tasks?\b.*\bline-through\b/,
	]);
	const keepsExistingUi = containsAny(normalizedPrompt, [
		/\bkeep\b.*\b(styling|style|layout|ui|design)\b/,
		/\bdon't change\b/,
		/\bdo not change\b/,
		/\bwithout changing anything else\b/,
		/\bas is\b/,
	]);

	const score =
		(togglesCompletedState ? 2 : 0) +
		(blocksEmptyInput ? 2 : 0) +
		(newTasksClickable ? 1 : 0) +
		(keepsExistingUi ? 1 : 0);

	const success = togglesCompletedState && blocksEmptyInput && score >= 4;
	const missingParts = [
		!togglesCompletedState && "the click-to-cross-out bug",
		!blocksEmptyInput && "the empty-input validation",
		!newTasksClickable && "that newly added tasks need the same fix",
		!keepsExistingUi &&
			"a guardrail to keep the existing layout and styling intact",
	].filter(Boolean) as string[];

	return {
		success,
		score,
		text: success
			? "That is a solid bug report. You identified the broken behavior and set clear guardrails."
			: "The bug report is still too loose, so the fix could easily miss behavior or over-change the UI.",
		nudge: success
			? undefined
			: `Call out ${joinMissingParts(missingParts)} so the fix is precise.`,
		takeaway:
			"The best debugging prompts name the bug, describe the expected behavior, and protect what should not change.",
		code: `<script>
  const taskList = document.getElementById('taskList');
  const input = document.getElementById('newTask');
  const attachTaskBehavior = (item) => {
    ${
			togglesCompletedState
				? `item.addEventListener('click', () => {
      item.style.textDecoration = item.style.textDecoration === 'line-through' ? 'none' : 'line-through';
    });`
				: ""
		}
  };

  taskList?.querySelectorAll('li').forEach((item) => attachTaskBehavior(item));

  document.getElementById('addBtn')?.addEventListener('click', () => {
    const value = input?.value ?? '';
    ${blocksEmptyInput ? `if (!value.trim()) return;` : ""}
    const li = document.createElement('li');
    li.className = 'border p-3 rounded bg-white cursor-pointer';
    li.textContent = value;
    ${newTasksClickable || togglesCompletedState ? "attachTaskBehavior(li);" : ""}
    taskList?.appendChild(li);
    input.value = '';
  });
</script>
${keepsExistingUi ? "<!-- Existing layout and styling preserved -->" : "<!-- Prompt did not protect the existing UI -->"}`,
	};
}
