/**
 * Extracts code from AI text response (strips markdown fenced code blocks).
 */
export function extractCodeFromMarkdown(text: string): string {
  const fenced = /```(?:\w+)?\s*\n?([\s\S]*?)```/;
  const match = text.match(fenced);
  if (match?.[1] != null) return match[1].trim();
  return text.trim();
}
