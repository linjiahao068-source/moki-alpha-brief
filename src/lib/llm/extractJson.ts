export function extractJsonObjectText(text: string) {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new SyntaxError("No JSON object found in model response.");
  }

  return trimmed.slice(start, end + 1);
}

export function parseJsonObject<T>(text: string): T {
  return JSON.parse(extractJsonObjectText(text)) as T;
}
