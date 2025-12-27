export function parseJsonStrict<T>(text: string): T {
  try {
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanText) as T;
  } catch (e) {
    console.warn("JSON Parse Error, attempting partial fix or throwing", e);
    throw e;
  }
}

export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
