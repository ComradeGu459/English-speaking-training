import { aiManager } from './request-manager';
import { WordDefinition } from '../../types';

// Prompt Versioning for Cache Invalidation
const PROMPT_VERSIONS = {
  definition: 'v1.0',
  explain: 'v1.0',
  rewrite: 'v1.0',
  translate: 'v1.0'
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
  }
};
