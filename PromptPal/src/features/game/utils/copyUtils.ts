/**
 * Returns which required elements are present or missing in copy text (case-insensitive).
 */
export function getMatchedRequirements(
  copy: string,
  requiredElements: string[]
): { label: string; matched: boolean }[] {
  const copyLower = copy.trim().toLowerCase();
  return requiredElements.map((label) => ({
    label,
    matched: copyLower.includes(label.toLowerCase()),
  }));
}
