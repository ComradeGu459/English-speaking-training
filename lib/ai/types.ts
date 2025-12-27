export type ProviderType = 'gemini' | 'deepseek' | 'qwen-text' | 'qwen-audio' | 'doubao' | 'newapi' | 'openai_compat';

export type TaskType = 
  | 'translation'
  | 'explanation'
  | 'rewriting'
  | 'keywords'
  | 'definition'
  | 'speech_asr' // Audio to Text
  | 'speech_tts' // Text to Speech
  | 'audio_understanding'; // Understanding audio context

export interface GenRequest {
  prompt: string;
  systemPrompt?: string;
  jsonMode?: boolean;
  temperature?: number;
  model?: string;
  // Multimodal inputs
  audioUrl?: string; 
}

export interface GenResponse<T = any> {
  text: string;
  data?: T;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  provider: ProviderType;
}

export interface CacheEntry<T = any> {
  id: string;
  data: T;
  promptVersion: string;
  providerUsed: ProviderType;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

export interface AIProvider {
  name: ProviderType;
  isHealthy(): boolean;
  generateText(req: GenRequest): Promise<GenResponse<string>>;
  generateJson<T>(req: GenRequest): Promise<GenResponse<T>>;
  // Optional capability
  synthesizeSpeech?(text: string): Promise<ArrayBuffer>;
}
