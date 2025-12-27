import { ProviderType } from './ai/types';

// 1. Gemini (Updated with Model selection)
export interface GeminiConfig {
  enabled: boolean;
  apiKey: string;
  model: string; 
}

// 2. DeepSeek (Strict Model Options)
export type DeepSeekModel = 'deepseek-chat' | 'deepseek-reasoner';
export interface DeepSeekConfig {
  enabled: boolean;
  apiKey: string;
  baseUrl: string; // Fixed default, but editable
  model: DeepSeekModel;
}

// 3. Qwen (Text & Audio Separation)
export interface QwenTextConfig {
  enabled: boolean;
  apiKey: string;
  baseUrl: string; // Compatible URL
  model: 'qwen-plus'; // Fixed constraint as per req, or allow string
}

export interface QwenAudioConfig {
  enabled: boolean;
  apiKey: string; // Uses DashScope Native
  model: 'qwen2-audio-instruct'; 
}

// 4. Doubao TTS (Volcengine Strict)
export interface DoubaoConfig {
  enabled: boolean;
  appId: string;
  accessToken: string;
  cluster: string; // Default: volcano_tts
  voiceType: string; // Dropdown + Custom Input
  proxyUrl: string; // Optional for CORS
}

// 5. NewAPI (Fallback & Gateway)
export interface NewAPIConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
  isFallback: boolean; // Toggle
}

export interface UserSettings {
  providers: {
    gemini: GeminiConfig;
    deepseek: DeepSeekConfig;
    qwenText: QwenTextConfig;
    qwenAudio: QwenAudioConfig;
    doubao: DoubaoConfig;
    newapi: NewAPIConfig;
  };
  modelRouting: {
    translation: ProviderType;
    explanation: ProviderType;
    rewriting: ProviderType;
    speech_tts: ProviderType; // Specifically for TTS
    audio_understanding: ProviderType; // Specifically for Qwen Audio
  };
}

const DEFAULT_SETTINGS: UserSettings = {
  providers: {
    gemini: { 
      enabled: true, 
      apiKey: '',
      model: 'gemini-3-flash-preview' 
    },
    deepseek: { 
      enabled: false, 
      apiKey: '', 
      baseUrl: 'https://api.deepseek.com', 
      model: 'deepseek-chat' 
    },
    qwenText: { 
      enabled: false, 
      apiKey: '', 
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', 
      model: 'qwen-plus' 
    },
    qwenAudio: {
      enabled: false,
      apiKey: '',
      model: 'qwen2-audio-instruct'
    },
    doubao: { 
      enabled: false, 
      appId: '', 
      accessToken: '', 
      cluster: 'volcano_tts', 
      voiceType: 'BV001_streaming', // Default common voice
      proxyUrl: '' 
    },
    newapi: { 
      enabled: false, 
      baseUrl: 'https://api.openai.com/v1', 
      apiKey: '', 
      model: 'gpt-3.5-turbo',
      isFallback: false
    }
  },
  modelRouting: {
    translation: 'gemini',
    explanation: 'gemini',
    rewriting: 'gemini',
    speech_tts: 'doubao',
    audio_understanding: 'qwen-audio'
  }
};

export const getSettings = (): UserSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem('echospeak_settings_v3');
    if (!saved) return DEFAULT_SETTINGS;
    
    const parsed = JSON.parse(saved);
    // Deep merge logic (simplified)
    return {
      providers: {
        gemini: { ...DEFAULT_SETTINGS.providers.gemini, ...parsed.providers?.gemini },
        deepseek: { ...DEFAULT_SETTINGS.providers.deepseek, ...parsed.providers?.deepseek },
        qwenText: { ...DEFAULT_SETTINGS.providers.qwenText, ...parsed.providers?.qwenText },
        qwenAudio: { ...DEFAULT_SETTINGS.providers.qwenAudio, ...parsed.providers?.qwenAudio },
        doubao: { ...DEFAULT_SETTINGS.providers.doubao, ...parsed.providers?.doubao },
        newapi: { ...DEFAULT_SETTINGS.providers.newapi, ...parsed.providers?.newapi },
      },
      modelRouting: { ...DEFAULT_SETTINGS.modelRouting, ...parsed.modelRouting }
    };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: UserSettings) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('echospeak_settings_v3', JSON.stringify(settings));
  window.dispatchEvent(new Event('settings-changed'));
};
