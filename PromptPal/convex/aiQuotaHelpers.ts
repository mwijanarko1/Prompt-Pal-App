import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";

export type AIGenerationKind = "text" | "image" | "evaluate";

export async function refundQuotaUsage(
	ctx: ActionCtx,
	args: {
		userId: string;
		appId: string;
		quotaType: "textCalls" | "imageCalls";
	},
): Promise<void> {
	await ctx.runMutation(internal.mutations.refundQuotaUsage, args);
}

export async function logAIGenerationFailure(
	ctx: ActionCtx,
	args: {
		userId: string;
		appId: string;
		requestId: string;
		type: AIGenerationKind;
		model: string;
		promptLength?: number;
		durationMs: number;
		errorMessage: string;
	},
): Promise<void> {
	try {
		await ctx.runMutation(internal.mutations.logAIGeneration, {
			...args,
			success: false,
		});
	} catch {
		// Logging failures should not mask the original provider error.
	}
}
