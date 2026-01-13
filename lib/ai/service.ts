import { aiManager } from './request-manager';
import { WordDefinition, Subtitle } from '../../types';

// Prompt Versioning for Cache Invalidation
const PROMPT_VERSIONS = {
  definition: 'v1.0',
  explain: 'v1.0',
  rewrite: 'v1.0',
  translate: 'v1.0',
  asr: 'v1.0'
};

export const AIService = {
  /**
   * Get word definition with context analysis.
   */
  async getWordDefinition(word: string, contextSentence: string): Promise<WordDefinition> {
    return aiManager.schedule<WordDefinition>(
      'definition',
      `${word}|${contextSentence}`,
      {
        prompt: `
          Analyze the word "${word}" in the context of this sentence: "${contextSentence}".
          Provide the IPA pronunciation, a concise meaning in Chinese, a simple English example sentence (different from the context), and the word type (noun, verb, etc).
          Return valid JSON.
        `,
        systemPrompt: "You are an English teacher assistant.",
        jsonMode: true
      },
      PROMPT_VERSIONS.definition
    );
  },

  /**
   * Explain a full sentence (grammar, nuance, usage).
   */
  async explainSentence(sentence: string): Promise<{ explanation: string; grammarPoints: string[]; nuance: string }> {
    return aiManager.schedule(
      'explanation',
      sentence,
      {
        prompt: `
          Analyze this English sentence: "${sentence}".
          1. Provide a clear explanation in Chinese.
          2. List key grammar points.
          3. Explain the nuance or tone (formal, casual, sarcastic, etc.).
          Output JSON: { "explanation": "...", "grammarPoints": ["..."], "nuance": "..." }
        `,
        systemPrompt: "You are an expert linguistics tutor.",
        jsonMode: true
      },
      PROMPT_VERSIONS.explain
    );
  },

  /**
   * Rewrite sentence in different styles.
   */
  async rewriteSentence(sentence: string): Promise<{ formal: string; casual: string; concise: string }> {
    return aiManager.schedule(
      'rewriting',
      sentence,
      {
        prompt: `
          Rewrite the following sentence in 3 styles: Formal, Casual, and Concise.
          Sentence: "${sentence}"
          Output JSON: { "formal": "...", "casual": "...", "concise": "..." }
        `,
        jsonMode: true
      },
      PROMPT_VERSIONS.rewrite
    );
  },

  /**
   * Translate text to Chinese.
   */
  async translateText(text: string): Promise<{ translation: string }> {
    return aiManager.schedule(
      'translation',
      text,
      {
        prompt: `Translate the following English text to natural, fluent Chinese: "${text}". Return JSON: { "translation": "..." }`,
        jsonMode: true
      },
      PROMPT_VERSIONS.translate
    );
  },

  /**
   * Simulate generating subtitles for a duration.
   * In a real app with Gemini 1.5 Pro, we would upload the video file.
   * Here we simulate "intelligent" generation or filler text.
   */
  async generateSubtitlesSimulation(duration: number, topic: string): Promise<Subtitle[]> {
      // Simulate API latency
      await new Promise(r => setTimeout(r, 2000));

      const subs: Subtitle[] = [];
      const interval = 5; // seconds
      const count = Math.ceil(duration / interval);
      
      for(let i=0; i<count; i++) {
          const startTime = i * interval;
          const endTime = Math.min((i + 1) * interval, duration);
          subs.push({
              id: `gen-${Date.now()}-${i}`,
              startTime,
              endTime,
              text: `[AI Generated Audio Analysis ${i+1}] discussing ${topic}...`,
              translation: "",
              speaker: "AI"
          });
      }
      return subs;
  }
};
