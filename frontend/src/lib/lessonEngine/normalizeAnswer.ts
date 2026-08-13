/** Normalize user text: trim → NFKC → lowercase → collapse spaces → strip edge punctuation. */
export function normalizeAnswer(text: string): string {
  return text
    .trim()
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/^[\s.,!?;:"'""''「」]+|[\s.,!?;:"'""''「」]+$/g, "");
}

export function answersMatch(submitted: string, acceptable: string): boolean {
  return normalizeAnswer(submitted) === normalizeAnswer(acceptable);
}

export function answerInSet(submitted: string, acceptable: string[]): boolean {
  const norm = normalizeAnswer(submitted);
  if (!norm) return false;
  const set = new Set(acceptable.filter(Boolean).map(normalizeAnswer));
  if (set.has(norm)) return true;
  const stripped = norm.replace(/[.,!?]+$/, "");
  return [...set].some((a) => a === stripped || a.replace(/[.,!?]+$/, "") === stripped);
}
