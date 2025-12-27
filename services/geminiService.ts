import { GoogleGenAI, Type } from "@google/genai";
import { WordDefinition } from "../types";

// NOTE: In a real app, never expose API keys on the client side like this unless strictly controlled.
// The instructions specify using process.env.API_KEY.
const apiKey = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const getWordDefinition = async (word: string, contextSentence: string): Promise<WordDefinition | null> => {
  if (!ai) return null;

  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `
      Analyze the word "${word}" in the context of this sentence: "${contextSentence}".
      Provide the IPA pronunciation, a concise meaning in Chinese, a simple English example sentence (different from the context), and the word type (noun, verb, etc).
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            ipa: { type: Type.STRING },
            meaning: { type: Type.STRING },
            example: { type: Type.STRING },
            type: { type: Type.STRING }
          },
          required: ["word", "ipa", "meaning", "example", "type"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as WordDefinition;
    }
    return null;
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback mock for demonstration if API fails or key is missing
    return {
      word: word,
      ipa: "/məck/",
      meaning: "API Error / Mock Definition",
      example: "Could not fetch real definition.",
      type: "noun"
    };
  }
};